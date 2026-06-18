const imageInput = document.getElementById("imageInput");
const startButton = document.getElementById("startButton");
const originalImage = document.getElementById("originalImage");
const museumGrid = document.getElementById("museumGrid");
const hallucinationSelect = document.getElementById("hallucinationLevel");

const WORKER_URL =
  "https://hallucination-museum.xind981.workers.dev";

const MAX_HALLS = 8;

const progressContainer =
  document.getElementById(
    "progressContainer"
  );

const progressBar =
  document.getElementById(
    "progressBar"
  );

const progressText =
  document.getElementById(
    "progressText"
  );

const stages = [
  "Reality Recorded",
  "Memory Drift",
  "Interpretation",
  "Distortion",
  "Hallucination",
];

let museumHistory = [];

let uploadedImageURL = null;

window.addEventListener(
  "load",
  restoreMuseum
);

imageInput.addEventListener(
  "change",
  function () {

    const file =
      imageInput.files[0];

    if (!file) return;

    uploadedImageURL =
      URL.createObjectURL(
        file
      );

    originalImage.src =
      uploadedImageURL;

    originalImage.style.display =
      "block";
  }
);

startButton.addEventListener(
  "click",
  async function () {

    const file =
      imageInput.files[0];

    if (!file) {

      alert(
        "Please upload an image first."
      );

      return;
    }

    startButton.disabled =
      true;

    startButton.textContent =
     "Generating...";

    try {

      const hallId =
        Date.now();

      const originalBase64 =
        await fileToBase64(
          file
        );

      const hall = {

        hallId,

        originalImage:
          originalBase64,

        createdAt:
          new Date().toISOString(),

        artworks: [],

        level:
          hallucinationSelect.value,
      };

      console.log(
        "Creating Hall:",
        hallId
      );

      updateProgress(
        0,
        "Starting exhibition..."
      );

      museumHistory.unshift(
        hall
      );

      renderMuseum();

      await runHallucinationChain(
        file,
        hall
      );

      await saveHall(
        hall
      );

      console.log(
        "Saved Hall:",
        hallId
      );

      // show hall immediately
      museumHistory = [
        hall,
        ...museumHistory.filter(
          h => h.hallId !== hall.hallId
        )
      ];

      museumHistory =
        museumHistory.slice(
          0,
          MAX_HALLS
        );

      renderMuseum();

      // after 3 seconds, consistent with kv
      // setTimeout(
      //   restoreMuseum,
      //   3000
      // );

    } catch (error) {

      console.error(error);

      alert(
        "Generation failed."
      );

    } finally {

      startButton.disabled =
        false;

      startButton.textContent =
        "Start Iteration";
    }
  }
);


async function imageUrlToBase64(
  url
) {

  const response =
    await fetch(url);

  const blob =
    await response.blob();

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        blob
      );
    }
  );
}

function renderMuseum() {

  museumGrid.innerHTML = "";

  for (
    let i = 0;
    i < MAX_HALLS;
    i++
  ) {

    const hall =
      museumHistory[i];

    if (hall) {

      createHallCard(
        hall
      );

    } else {

      createEmptyHall(
        i + 1
      );
    }
  }
}

async function restoreMuseum() {

  await fetchMuseum();

  renderMuseum();
}

function createHallCard(
  hall
) {

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "artwork";

  const date =
    new Date(
      hall.createdAt
    ).toLocaleDateString(
      "en-GB"
    );

  card.innerHTML =
    `
    <a
      href="hall.html?id=${hall.hallId}"
      style="
        text-decoration:none;
        color:black;
      "
    >

      <img
        src="${hall.originalImage}"
      >

      <h3>
        Hall
      </h3>

      <p>
        ${date}
      </p>

    </a>
    `;

  museumGrid.appendChild(
    card
  );
}

function createEmptyHall(
  number
) {

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "artwork";

  card.innerHTML =
    `
    <div
      style="
        height:250px;
        border:4px dashed #ccc;
        display:flex;
        justify-content:center;
        align-items:center;
        color:#888;
      "
    >
      Empty Hall
    </div>

    <h3>
      Hall ${number}
    </h3>
    `;

  museumGrid.appendChild(
    card
  );
}

function fileToBase64(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function generateInitialCaption(
  file,
  iteration
) {

  const imageData =
    await fileToBase64(
      file
    );

  const level =
    hallucinationSelect.value;

  const strength =
    (iteration + 1) * 20;

  let instruction =
    "";

  if (
    level === "low"
  ) {

    instruction = `
Describe the image accurately.
Keep all major objects and composition.
Only introduce subtle changes.
Hallucination strength: ${strength}/100.
Within 20 words.
`;

  } else if (
    level === "medium"
  ) {

    instruction = `
Describe the image as a dream.
Preserve some original elements.
Reinterpret their meaning.
Hallucination strength: ${strength}/100.
Within 20 words.
`;

  } else {

    instruction = `
Describe the image as a hallucination.
Invent impossible scenes and structures.
Detach from literal reality.
Hallucination strength: ${strength}/100.
Within 20 words.
`;
  }

  const response =
    await fetch(
      WORKER_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model: "gpt-4o",

          messages: [
            {
              role: "user",

              content: [
                {
                  type: "text",
                  text:
                    instruction
                },

                {
                  type:
                    "image_url",

                  image_url: {
                    url:
                      imageData
                  }
                }
              ]
            }
          ]
        })
      }
    );

  const data =
    await response.json();

  return data
    .choices[0]
    .message.content;
}

async function generateImage(
  caption
) {

  const response =
    await fetch(
      WORKER_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          type: "image",
          prompt:
            caption
        })
      }
    );

  const data =
    await response.json();

  return data
    .images[0]
    .url;
}

async function imageUrlToFile(
  url
) {

  const response =
    await fetch(
      url
    );

  const blob =
    await response.blob();

  return new File(
    [blob],
    "generated.png",
    {
      type:
        "image/png"
    }
  );
}

async function fetchMuseum() {

  const response =
    await fetch(
      `${WORKER_URL}?action=getHalls`
    );

  museumHistory =
    await response.json();
}

async function saveHall(
  hall
) {

  const response =
    await fetch(
      WORKER_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          type:
            "saveHall",

          hall
        })
      }
    );

  const result =
    await response.json();

  console.log(
    "saved hall",
    result
  );

  return result;
}


async function runHallucinationChain(
  file,
  hall
) {

  let currentFile =
    file;

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    updateProgress(
      i * 20,
      `${i * 20}% ${stages[i]} — analysing artifact`
    );

    const caption =
      await generateInitialCaption(
        currentFile,
        i
      );

    updateProgress(
      i * 20 + 7,
      `${i * 20 + 7}% ${stages[i]} — constructing exhibition`
    );

    const imageURL =
      await generateImage(
        caption
      );

    updateProgress(
      i * 20 + 14,
      `${i * 20 + 14}% ${stages[i]} — framing artwork`
    );


    console.log(
      "Generated image:",
      imageURL
    );

    const imageBase64 =
      await imageUrlToBase64(
        imageURL
      );

    const artwork = {

      round:
        i + 1,

      imageURL,

      imageBase64,

      caption
    };

    hall.artworks.push(
      artwork
    );

    renderMuseum();

    currentFile =
      await imageUrlToFile(
        imageURL
      );

  }

  updateProgress(
    100,
    "100% Exhibition completed"
  );
}

function updateProgress(
  percent,
  text
) {

  progressContainer.style.display =
    "block";

  progressBar.style.width =
    `${percent}%`;

  progressText.textContent =
    text;
}
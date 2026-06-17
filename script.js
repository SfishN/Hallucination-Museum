const imageInput = document.getElementById("imageInput");
const startButton = document.getElementById("startButton");
const originalImage = document.getElementById("originalImage");
const museumGrid = document.getElementById("museumGrid");

const WORKER_URL =
  "https://hallucination-museum.xind981.workers.dev";

const hallucinationSelect =
  document.getElementById(
    "hallucinationLevel"
  );

// const FLASK_URL =
//   "http://127.0.0.1:5000/generate";

let uploadedImageURL = null;

imageInput.addEventListener("change", function () {

  const file = imageInput.files[0];

  if (!file) return;

  uploadedImageURL = URL.createObjectURL(file);

  originalImage.src = uploadedImageURL;
  originalImage.style.display = "block";
});

startButton.addEventListener(
  "click",
  async function () {

    const file = imageInput.files[0];

    if (!file) {

      alert(
        "Please upload an image first."
      );

      return;
    }

    museumGrid.innerHTML = "";

    try {

      await runHallucinationChain(
        file
      );

    } catch (error) {

      console.error(error);

      alert(
        "Generation failed."
      );
    }
  }
);

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(
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
    await fileToBase64(file);

  const level =
    hallucinationSelect.value;

  let instruction = "";

  const strength =
  (iteration + 1) * 20;

  if (level === "low") {

    instruction = `
    Describe the image accurately.
    Keep all major objects and composition.
    Only introduce tiny speculative details.
    Hallucination strength:${strength}/10.
    Within 20 words.
    `;

  } else if (
    level === "medium"
  ) {

    instruction = `
    Describe the image as if it were a dream.
    Preserve some original elements but
    reinterpret their meaning.
    Introduce unexpected objects,
    atmosphere and symbolism.
    Hallucination strength:${strength}/10.
    Within 20 words.
    `;

  } else {

    instruction = `
    Ignore literal reality.
    Treat the image as a trigger for a
    completely imagined scene.
    Transform objects into new forms.
    Invent creatures, architecture,
    narratives and impossible events.
    Make the description surreal.
    Hallucination strength:${strength}/10.
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
                  text: instruction
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageData
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

  console.log(
    "Fal response:",
    data
  );

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
          prompt: caption
        })
      }
    );

  const data =
    await response.json();

  return data.images[0].url;
}

async function imageUrlToFile(
  url
) {

  const response =
    await fetch(url);

  const blob =
    await response.blob();

  return new File(
    [blob],
    "generated.png",
    {
      type: "image/png"
    }
  );
}

async function runHallucinationChain(
  file
) {

  let currentFile = file;

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const caption =
      await generateInitialCaption(
        currentFile,
        i
      );

    const imageURL =
      await generateImage(
        caption
      );

    addArtworkToMuseum({
      round: i + 1,
      imageURL,
      caption
    });

    currentFile =
      await imageUrlToFile(
        imageURL
      );
  }
}

function addArtworkToMuseum(
  artwork
) {

  const card =
    document.createElement("div");

  card.className =
    "artwork";

  const img =
    document.createElement("img");

  img.src =
    artwork.imageURL;

  const caption =
    document.createElement("p");

  caption.innerHTML =
    `<strong>Iteration ${artwork.round}</strong><br>${artwork.caption}`;

  card.appendChild(img);

  card.appendChild(caption);

  museumGrid.appendChild(card);
}

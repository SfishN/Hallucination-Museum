const imageInput = document.getElementById("imageInput");
const startButton = document.getElementById("startButton");
const originalImage = document.getElementById("originalImage");
const museumGrid = document.getElementById("museumGrid");

const WORKER_URL =
  "https://hallucination-museum.xind981.workers.dev";

let uploadedImageURL = null;

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) return;

  uploadedImageURL = URL.createObjectURL(file);

  originalImage.src = uploadedImageURL;
  originalImage.style.display = "block";
});

startButton.addEventListener("click", async function () {

  const file = imageInput.files[0];

  if (!file) {
    alert("Please upload an image first.");
    return;
  }

  museumGrid.innerHTML = "";

  try {

    const initialCaption =
      await generateInitialCaption(file);

    await runHallucinationChain(
      uploadedImageURL,
      initialCaption
    );

  } catch (error) {

    console.error(error);

    alert(
      "Failed to connect to GPT. Check console."
    );
  }
});

function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });
}

async function generateInitialCaption(file) {

  const imageData =
    await fileToBase64(file);

  const response = await fetch(
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
                  "Describe this image in a detailed and objective way."
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

  return data.choices[0]
    .message.content;
}

async function distortMemory(
  previousMemory,
  iteration
) {

  const prompt = `
You are an unreliable memory system.

The following text is a memory being recalled repeatedly.

Iteration ${iteration}.

Keep approximately 80% of the memory.

Change 20%.

Introduce:
- uncertainty
- omissions
- mistaken details
- false associations

Memory:

${previousMemory}

Return only the rewritten memory.
`;

  const response = await fetch(
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
            content: prompt
          }
        ]
      })
    }
  );

  const data =
    await response.json();

  return data.choices[0]
    .message.content;
}

async function runHallucinationChain(
  imageURL,
  initialCaption
) {

  let memory = initialCaption;

  addArtworkToMuseum({
    round: 0,
    imageURL,
    caption: memory
  });

  for (let i = 1; i <= 10; i++) {

    memory =
      await distortMemory(
        memory,
        i
      );

    addArtworkToMuseum({
      round: i,
      imageURL,
      caption: memory
    });
  }
}

function addArtworkToMuseum(
  artwork
) {

  const card =
    document.createElement("div");

  card.className = "artwork";

  const img =
    document.createElement("img");

  img.src =
    artwork.imageURL;

  const caption =
    document.createElement("p");

  caption.textContent =
    `Iteration ${artwork.round}: ${artwork.caption}`;

  card.appendChild(img);

  card.appendChild(caption);

  museumGrid.appendChild(card);
}

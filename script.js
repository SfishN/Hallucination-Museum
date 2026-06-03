const imageInput = document.getElementById("imageInput");
const startButton = document.getElementById("startButton");
const originalImage = document.getElementById("originalImage");
const museumGrid = document.getElementById("museumGrid");

const WORKER_URL =
  "https://hallucination-museum.xind981.workers.dev";

const FLASK_URL =
  "http://127.0.0.1:5000/generate";

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
  file
) {

  const imageData =
    await fileToBase64(file);

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
                    "Describe the most important visual elements in one concise sentence. No more than 30 words."
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

  return data
    .choices[0]
    .message.content;
}

async function generateImage(
  caption
) {

  const response =
    await fetch(
      FLASK_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          prompt: caption
        })
      }
    );

  const data =
    await response.json();

  return (
    "data:image/png;base64,"
    + data.image_base64
  );
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
        currentFile
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

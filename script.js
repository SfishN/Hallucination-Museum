const imageInput = document.getElementById("imageInput");
const startButton = document.getElementById("startButton");
const originalImage = document.getElementById("originalImage");
const museumGrid = document.getElementById("museumGrid");

let uploadedImageURL = null;

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  uploadedImageURL = URL.createObjectURL(file);
  originalImage.src = uploadedImageURL;
  originalImage.style.display = "block";
});

startButton.addEventListener("click", function () {
  if (!uploadedImageURL) {
    alert("Please upload an image first.");
    return;
  }

  museumGrid.innerHTML = "";

  runHallucinationChain(uploadedImageURL);
});

function runHallucinationChain(imageURL) {
  let caption = "A clear description of the uploaded image.";

  for (let i = 1; i <= 10; i++) {
    caption = makeCaptionMoreVague(caption, i);

    addArtworkToMuseum({
      round: i,
      imageURL: imageURL,
      caption: caption
    });
  }
}

function makeCaptionMoreVague(previousCaption, round) {
  const vaguePhrases = [
    "something familiar but difficult to identify",
    "a scene with uncertain objects and unclear context",
    "an image that may contain a figure, a place, or a memory",
    "a strange arrangement of shapes, textures, and possible meanings",
    "a dreamlike scene where the subject is no longer certain",
    "an ambiguous visual fragment from an imagined archive",
    "a museum object from a reality that may not exist",
    "a distorted memory of something once recognizable",
    "a visual hallucination with unstable details",
    "an artifact generated from repeated misinterpretation"
  ];

  return vaguePhrases[round - 1];
}

function addArtworkToMuseum(artwork) {
  const card = document.createElement("div");
  card.className = "artwork";

  const img = document.createElement("img");
  img.src = artwork.imageURL;

  const caption = document.createElement("p");
  caption.textContent = `Iteration ${artwork.round}: ${artwork.caption}`;

  card.appendChild(img);
  card.appendChild(caption);

  museumGrid.appendChild(card);
}

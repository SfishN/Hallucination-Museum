const hallContainer =
  document.getElementById(
    "hallContainer"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const hallId =
  Number(
    params.get("id")
  );

const museumHistory =
  JSON.parse(
    localStorage.getItem(
      "museumHistory"
    )
  ) || [];

const hall =
  museumHistory.find(
    h =>
      h.hallId === hallId
  );

if (!hall) {

  hallContainer.innerHTML =
    "<h2>Hall not found.</h2>";

} else {

  renderHall(
    hall
  );
}

function renderHall(
  hall
) {

  hallContainer.innerHTML =
    `
    <h1>
      Hall ${hall.hallId}
    </h1>

    <h2>
      Original
    </h2>

    <img
      class="original"
      src="${hall.originalImage}"
    >
  `;

  hall.artworks.forEach(
    artwork => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "artwork";

      div.innerHTML =
        `
        <img
            src="${
                artwork.imageBase64 ||
                artwork.imageURL
            }"
        >

        <p>
          Iteration
          ${artwork.round}
        </p>

        <p>
          ${artwork.caption}
        </p>
      `;

      hallContainer.appendChild(
        div
      );
    }
  );
}
const WORKER_URL =
  "https://hallucination-museum.xind981.workers.dev";

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

loadHall();

async function loadHall() {

  try {

    const response =
      await fetch(
        `${WORKER_URL}?action=special`
      );

    const hall =
      await response.json();

    if (!hall) {

      hallContainer.innerHTML =
        `
        <h1>
          Hall Not Found
        </h1>
        `;

      return;
    }

    renderHall(
      hall
    );

  } catch (error) {

    console.error(
      error
    );

    hallContainer.innerHTML =
      `
      <h1>
        Failed to Load Hall
      </h1>
      `;
  }
}

function renderHall(
  hall
) {

  const date =
    hall.createdAt
      ? new Date(
          hall.createdAt
        ).toLocaleDateString(
          "en-GB",
          {
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        )
      : "Unknown";

  hallContainer.innerHTML =
    `
    <h1>
      Hall
    </h1>

    <p>
      Created:
      ${date}
    </p>

    <p>
      Hallucination Level:
      ${
        hall.level
          ? hall.level.toUpperCase()
          : "UNKNOWN"
      }
    </p>

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

        <h3>
          Iteration
          ${artwork.round}
        </h3>

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
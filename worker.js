export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    try {

      // =========================
      // GET REQUESTS
      // =========================

      if (request.method === "GET") {

        const url =
          new URL(request.url);

        const action =
          url.searchParams.get(
            "action"
          );

        // Get all halls

        if (
          action === "getHalls"
        ) {

          // const list =
          //   await env.MUSEUM.list({
          //     limit: 50
          //   });

          const index =
            await env.MUSEUM.get(
              "hallIndex",
              "json"
            );

          if (!index) {

            return new Response(
              JSON.stringify([]),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type":
                    "application/json"
                }
              }
            );
          }

          const halls = [];

          for (
            const hallId of index
          ) {

            const hall =
              await env.MUSEUM.get(
                `hall:${hallId}`,
                "json"
              );

            if (hall) {

              halls.push(
                hall
              );
            }
          }

          return new Response(
            JSON.stringify(
              halls
            ),
            {
              headers: {
                ...corsHeaders,
                "Content-Type":
                  "application/json"
              }
            }
          );

          // const halls = [];

          // for (
          //   const key of list.keys
          // ) {

          //   const hall =
          //     await env.MUSEUM.get(
          //       key.name,
          //       "json"
          //     );

          //   if (hall) {

          //     halls.push(
          //       hall
          //     );
          //   }
          // }

          // halls.sort(
          //   (a, b) =>
          //     b.hallId -
          //     a.hallId
          // );

          // return new Response(
          //   JSON.stringify(
          //     halls
          //   ),
          //   {
          //     headers: {
          //       ...corsHeaders,
          //       "Content-Type":
          //         "application/json"
          //     }
          //   }
          // );
        }

        // Get one hall

        if (
          action === "getHall"
        ) {

          const hallId =
            url.searchParams.get(
              "id"
            );

          const hall =
            await env.MUSEUM.get(
              `hall:${hallId}`,
              "json"
            );

          return new Response(
            JSON.stringify(
              hall
            ),
            {
              headers: {
                ...corsHeaders,
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        if (
          action === "special"
        ) {

          const index =
            await env.MUSEUM.get(
              "hallIndex",
              "json"
            );

          const randomHallId =
            index[
              Math.floor(
                Math.random() *
                index.length
              )
            ];

          const hall =
            await env.MUSEUM.get(
              `hall:${randomHallId}`,
              "json"
            );

          return new Response(
            JSON.stringify(
              hall
            ),
            {
              headers: {
                ...corsHeaders,
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            error:
              "Invalid GET request"
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json"
            }
          }
        );
      }

      // =========================
      // POST REQUESTS
      // =========================

      const body =
        await request.json();

      console.log(body);

      // Save Hall

      // if (
      //   body.type ===
      //   "saveHall"
      // ) {

      //   const list =
      //     await env.MUSEUM.list({
      //       limit: 50
      //     });

      //   if (
      //     list.keys.length >= 50
      //   ) {

      //     const halls = [];

      //     for (
      //       const key of list.keys
      //     ) {

      //       const hall =
      //         await env.MUSEUM.get(
      //           key.name,
      //           "json"
      //         );

      //       if (hall) {

      //         halls.push({
      //           key:
      //             key.name,

      //           hallId:
      //             hall.hallId
      //         });
      //       }
      //     }

      //     halls.sort(
      //       (a, b) =>
      //         a.hallId -
      //         b.hallId
      //     );

      //     const oldest =
      //       halls[0];

      //     if (oldest) {

      //       await env.MUSEUM.delete(
      //         oldest.key
      //       );
      //     }
      //   }

      //   await env.MUSEUM.put(
      //     `hall:${body.hall.hallId}`,
      //     JSON.stringify(
      //       body.hall
      //     )
      //   );

      //   const verify =
      //     await env.MUSEUM.get(
      //       `hall:${body.hall.hallId}`,
      //       "json"
      //     );

      //   console.log(
      //     "saved hall verify",
      //     verify?.hallId
      //   );

      //   return new Response(
      //     JSON.stringify({
      //       success: true
      //     }),
      //     {
      //       headers: {
      //         ...corsHeaders,
      //         "Content-Type":
      //           "application/json"
      //       }
      //     }
      //   );
      // }

      if (
        body.type ===
        "saveHall"
      ) {

        await env.MUSEUM.put(
          `hall:${body.hall.hallId}`,
          JSON.stringify(
            body.hall
          )
        );

        let index =
          await env.MUSEUM.get(
            "hallIndex",
            "json"
          );

        if (!index) {

          index = [];
        }

        index = [
          body.hall.hallId,
          ...index.filter(
            id =>
              id !==
              body.hall.hallId
          )
        ];

        if (
          index.length > 50
        ) {

          const removed =
            index.pop();

          await env.MUSEUM.delete(
            `hall:${removed}`
          );
        }

        await env.MUSEUM.put(
          "hallIndex",
          JSON.stringify(
            index
          )
        );

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json"
            }
          }
        );
      }

      // Generate Image

      if (
        body.type ===
        "image"
      ) {

        const falResponse =
          await fetch(
            "https://fal.run/fal-ai/fast-sdxl",
            {
              method: "POST",
              headers: {
                "Authorization":
                  `Key ${env.FAL_KEY}`,
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                prompt:
                  body.prompt,
                image_size:
                  "square"
              })
            }
          );

        const result =
          await falResponse.json();

        return new Response(
          JSON.stringify(
            result
          ),
          {
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json"
            }
          }
        );
      }

      // OpenAI Caption

      const openaiResponse =
        await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization":
                `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              body
            )
          }
        );

      const data =
        await openaiResponse.text();

      return new Response(
        data,
        {
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json"
          }
        }
      );

    } catch (error) {

      console.error(error);

      return new Response(
        JSON.stringify({
          error:
            error.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json"
          }
        }
      );
    }
  }
};

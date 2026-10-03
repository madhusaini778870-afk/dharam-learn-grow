import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stream/lecture")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const batchId = url.searchParams.get("batchId") || "";
        const subjectId = url.searchParams.get("subjectId") || "";
        const childId =
          url.searchParams.get("childId") ||
          url.searchParams.get("lessonId") ||
          url.searchParams.get("videoId") ||
          "";

        if (!batchId || !subjectId || !childId) {
          return new Response(JSON.stringify({ error: "Missing batchId, subjectId, or childId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const res = await fetch(
            `https://pw.gemtara.in/api/get-video-with-keys?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&childId=${encodeURIComponent(childId)}`,
            {
              headers: {
                Accept: "application/json",
                Referer: "https://pw.gemtara.in/study/batches",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              },
              signal: AbortSignal.timeout(6000),
            },
          );

          if (res.ok) {
            const json = (await res.json()) as {
              url?: string;
              signedUrl?: string;
              clearKeys?: Record<string, string>;
            };
            if (json?.url) {
              const fullUrl = json.signedUrl ? `${json.url}${json.signedUrl}` : json.url;
              return new Response(
                JSON.stringify({
                  status: "ok",
                  videoUrl: fullUrl,
                  clearKeys: json.clearKeys ?? null,
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                  },
                },
              );
            }
          }
        } catch {
          // fallback error below
        }

        return new Response(
          JSON.stringify({ error: "Video stream not available from authorized source." }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});

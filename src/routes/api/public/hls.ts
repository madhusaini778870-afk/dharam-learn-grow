import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hls")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      },
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const targetUrl = reqUrl.searchParams.get("url");

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: "Missing url parameter" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        const range = request.headers.get("range");
        const isMp4 = targetUrl.toLowerCase().includes(".mp4");

        // 1. Try Vidyaverse upstream proxy for HLS (.m3u8 and .ts)
        if (!isMp4) {
          try {
            const vvProxyUrl = `https://vidya-verse.ai.studio/api/public/hls?url=${encodeURIComponent(targetUrl)}`;
            const vvRes = await fetch(vvProxyUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                ...(range ? { Range: range } : {}),
              },
              signal: AbortSignal.timeout(8000),
            });

            if (vvRes.ok || vvRes.status === 206) {
              const contentType =
                vvRes.headers.get("content-type") ||
                (targetUrl.includes(".m3u8")
                  ? "application/vnd.apple.mpegurl; charset=utf-8"
                  : targetUrl.includes(".ts")
                    ? "video/mp2t"
                    : "application/octet-stream");

              const responseHeaders = new Headers();
              responseHeaders.set("Content-Type", contentType);
              responseHeaders.set("Access-Control-Allow-Origin", "*");
              responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
              responseHeaders.set("Access-Control-Allow-Headers", "*");
              responseHeaders.set("Cache-Control", "no-cache, no-store");
              const cl = vvRes.headers.get("content-length");
              if (cl) {
                responseHeaders.set("Content-Length", cl);
              }
              const cr = vvRes.headers.get("content-range");
              if (cr) {
                responseHeaders.set("Content-Range", cr);
              }

              return new Response(vvRes.body, {
                status: vvRes.status,
                headers: responseHeaders,
              });
            }
          } catch {
            // fallback to direct upstream below
          }
        }

        // 2. Direct upstream fetch with CORS injection
        try {
          const directRes = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              ...(range ? { Range: range } : {}),
            },
            signal: AbortSignal.timeout(12000),
          });

          if (directRes.ok || directRes.status === 206) {
            let body: BodyInit | null = directRes.body;
            let contentType =
              directRes.headers.get("content-type") ||
              (targetUrl.includes(".m3u8")
                ? "application/vnd.apple.mpegurl; charset=utf-8"
                : targetUrl.includes(".ts")
                  ? "video/mp2t"
                  : "application/octet-stream");

            // If it's an m3u8 playlist, rewrite relative URLs to pass through /api/public/hls
            if (targetUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
              const text = await directRes.text();
              const base = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
              const rewritten = text
                .split("\n")
                .map((line) => {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed.startsWith("#")) return line;
                  let full = trimmed;
                  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                    try {
                      full = new URL(trimmed, base).href;
                    } catch {
                      full = trimmed;
                    }
                  }
                  return `/api/public/hls?url=${encodeURIComponent(full)}`;
                })
                .join("\n");

              body = rewritten;
              contentType = "application/vnd.apple.mpegurl; charset=utf-8";
            }

            const responseHeaders = new Headers();
            responseHeaders.set("Content-Type", contentType);
            responseHeaders.set("Access-Control-Allow-Origin", "*");
            responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            responseHeaders.set("Access-Control-Allow-Headers", "*");
            responseHeaders.set("Cache-Control", "no-cache, no-store");
            const cr = directRes.headers.get("content-range");
            if (cr) {
              responseHeaders.set("Content-Range", cr);
            }

            return new Response(body, {
              status: directRes.status,
              headers: responseHeaders,
            });
          }
        } catch (err) {
          return new Response(
            JSON.stringify({ error: "Stream fetch error", message: String(err) }),
            {
              status: 502,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            },
          );
        }

        return new Response(JSON.stringify({ error: "Failed to load stream" }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});

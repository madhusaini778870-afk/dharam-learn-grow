/**
 * Comprehensive Video Streaming & Vidyaverse Integration Test Suite
 * Tests all components of the lecture video pipeline:
 * - Upstream Vidyaverse course API
 * - Class & topic video resolution
 * - HLS master playlist fetching & syntax
 * - Local /api/public/hls proxy streaming
 * - Upstream vidya-verse.ai.studio /api/public/hls proxy streaming
 * - Video transport stream chunks (.ts)
 * - MP4 multi-resolution streams (720p, 480p, 360p, 240p)
 * - HTML5 player formatTime edge cases
 */

const http = require("http");
const https = require("https");

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "*/*",
          ...(options.headers || {}),
        },
        timeout: options.timeout || 10000,
      },
      (res) => {
        const chunks = [];
        let totalBytes = 0;
        res.on("data", (chunk) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (options.maxBytes && totalBytes >= options.maxBytes) {
            req.destroy();
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks),
              truncated: true,
            });
          }
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
            truncated: false,
          });
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout after ${options.timeout || 10000}ms`));
    });
  });
}

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return "00:00";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

async function runTests() {
  console.log("=================================================");
  console.log("  VIDYAVERSE LECTURE VIDEO TEST SUITE");
  console.log("  Source: https://vidya-verse.ai.studio/");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: formatTime player validation
  console.log("1. Testing Video Player formatTime Logic:");
  try {
    assert(formatTime(0) === "00:00", "formatTime(0) returns 00:00");
    assert(formatTime(45) === "00:45", "formatTime(45) returns 00:45");
    assert(formatTime(65) === "01:05", "formatTime(65) returns 01:05");
    assert(formatTime(3599) === "59:59", "formatTime(3599) returns 59:59");
    assert(formatTime(3600) === "1:00:00", "formatTime(3600) returns 1:00:00 (no crash)");
    assert(
      formatTime(4922) === "1:22:02",
      "formatTime(4922) returns 1:22:02 (Gagan sir lecture duration)",
    );
    assert(formatTime(NaN) === "00:00", "formatTime(NaN) returns 00:00 without throw");
    assert(formatTime(-10) === "00:00", "formatTime(-10) returns 00:00 without throw");
  } catch (err) {
    assert(false, `formatTime threw error: ${err.message}`);
  }

  // TEST 2: Vidyaverse Catalog API
  console.log("\n2. Testing Vidyaverse Course Catalog API:");
  let sampleCourse = null;
  try {
    const res = await fetchUrl("https://vidya-verse.ai.studio/api/sw/courses");
    assert(res.statusCode === 200, `Vidyaverse /api/sw/courses returned HTTP ${res.statusCode}`);
    const json = JSON.parse(res.body.toString("utf-8"));
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    assert(list.length > 0, `Catalog contains ${list.length} courses`);
    sampleCourse =
      list.find((c) => c.title.includes("Maths") || c.id === "6ab25570b2d758e23476cd66") || list[0];
    assert(
      Boolean(sampleCourse?.id),
      `Found sample course: "${sampleCourse?.title}" (${sampleCourse?.id})`,
    );
  } catch (err) {
    assert(false, `Failed to fetch catalog: ${err.message}`);
  }

  // TEST 3: Vidyaverse Classes & Topics API
  console.log("\n3. Testing Vidyaverse Course Classes & Topics API:");
  let sampleClass = null;
  const courseId = sampleCourse?.id || "6ab25570b2d758e23476cd66";
  try {
    const res = await fetchUrl(`https://vidya-verse.ai.studio/api/sw/courses/${courseId}/classes`);
    assert(res.statusCode === 200, `Vidyaverse classes endpoint returned HTTP ${res.statusCode}`);
    const json = JSON.parse(res.body.toString("utf-8"));
    const classes = json?.data?.classes || json?.classes || [];
    assert(classes.length > 0, `Course has ${classes.length} topics`);

    // Find class with class_link
    for (const t of classes) {
      if (t.classes && t.classes.length > 0) {
        sampleClass =
          t.classes.find((c) => c.class_link && c.class_link.includes(".m3u8")) || t.classes[0];
        if (sampleClass) break;
      }
    }
    assert(Boolean(sampleClass), `Found lecture class: "${sampleClass?.title}"`);
    assert(
      Boolean(sampleClass?.class_link),
      `Class has direct stream link: ${sampleClass?.class_link}`,
    );
  } catch (err) {
    assert(false, `Failed to fetch classes: ${err.message}`);
  }

  // TEST 4: HLS Master Playlist
  console.log("\n4. Testing Direct HLS Master Playlist (.m3u8):");
  const m3u8Url =
    sampleClass?.class_link ||
    "https://selectionwaylive.hranker.com/561/696cc469719de161eeed8120/playlist-mpl-vod.m3u8";
  try {
    const res = await fetchUrl(m3u8Url, {
      headers: { Origin: "https://vidya-verse.ai.studio" },
    });
    assert(res.statusCode === 200, `Master playlist returned HTTP ${res.statusCode}`);
    const text = res.body.toString("utf-8");
    assert(text.includes("#EXTM3U"), "Playlist contains #EXTM3U tag");
    assert(
      text.includes("#EXT-X-STREAM-INF"),
      "Playlist contains multi-bitrate streams (#EXT-X-STREAM-INF)",
    );
    const cors = res.headers["access-control-allow-origin"];
    assert(Boolean(cors), `Cloudflare CORS header present: access-control-allow-origin: ${cors}`);
  } catch (err) {
    assert(false, `Failed to load master playlist: ${err.message}`);
  }

  // TEST 5: Upstream Vidyaverse HLS Proxy
  console.log("\n5. Testing Upstream Vidyaverse HLS Proxy (vidya-verse.ai.studio/api/public/hls):");
  try {
    const proxyUrl = `https://vidya-verse.ai.studio/api/public/hls?url=${encodeURIComponent(m3u8Url)}`;
    const res = await fetchUrl(proxyUrl);
    assert(res.statusCode === 200, `Upstream proxy returned HTTP ${res.statusCode}`);
    const text = res.body.toString("utf-8");
    assert(text.includes("#EXTM3U"), "Proxy response contains #EXTM3U");
    assert(text.includes("/api/public/hls?url="), "Proxy rewrote stream URLs to /api/public/hls");
  } catch (err) {
    assert(false, `Failed upstream proxy test: ${err.message}`);
  }

  // TEST 6: Local Applet HLS Proxy
  console.log("\n6. Testing Local Applet HLS Proxy (localhost:3000/api/public/hls):");
  try {
    const localProxyUrl = `http://localhost:3000/api/public/hls?url=${encodeURIComponent(m3u8Url)}`;
    const res = await fetchUrl(localProxyUrl);
    assert(res.statusCode === 200, `Local /api/public/hls returned HTTP ${res.statusCode}`);
    const text = res.body.toString("utf-8");
    assert(text.includes("#EXTM3U"), "Local proxy response contains #EXTM3U");
    const cors = res.headers["access-control-allow-origin"];
    assert(cors === "*", `Local proxy injects CORS header: access-control-allow-origin: ${cors}`);
  } catch (err) {
    assert(false, `Local proxy test failed: ${err.message}`);
  }

  // TEST 7: HLS Sub-Playlist and Video Segment (.ts chunk)
  console.log("\n7. Testing HLS Sub-Playlist and Video Transport Stream (.ts):");
  try {
    const subPlaylistUrl =
      "https://selectionwaylive.hranker.com/561/696cc469719de161eeed8120/0/playlist-vod.m3u8";
    const subRes = await fetchUrl(
      `http://localhost:3000/api/public/hls?url=${encodeURIComponent(subPlaylistUrl)}`,
    );
    assert(subRes.statusCode === 200, `Sub-playlist returned HTTP ${subRes.statusCode}`);
    const subText = subRes.body.toString("utf-8");
    assert(subText.includes("#EXTINF"), "Sub-playlist has media segments (#EXTINF)");

    const segmentUrl =
      "https://selectionwaylive.hranker.com/561/696cc469719de161eeed8120/0/segment_0.ts";
    const segRes = await fetchUrl(
      `http://localhost:3000/api/public/hls?url=${encodeURIComponent(segmentUrl)}`,
      {
        maxBytes: 100000,
      },
    );
    assert(
      segRes.statusCode === 200,
      `Video segment segment_0.ts returned HTTP ${segRes.statusCode}`,
    );
    const contentType = segRes.headers["content-type"];
    assert(
      contentType === "video/mp2t" || contentType === "application/octet-stream",
      `Video segment content-type is valid: ${contentType}`,
    );
    assert(segRes.body.length > 0, `Received ${segRes.body.length} bytes of video data`);
  } catch (err) {
    assert(false, `Segment streaming failed: ${err.message}`);
  }

  // TEST 8: Multi-Resolution MP4 Streams
  console.log("\n8. Testing Multi-Resolution MP4 Streams (720p, 480p, 360p, 240p):");
  const recordings = sampleClass?.mp4Recordings || [
    {
      quality: "720p",
      url: "https://selectionwayrecorded.hranker.com/696cc469719de161eeed8120/output_720p.mp4",
    },
    {
      quality: "480p",
      url: "https://selectionwayrecorded.hranker.com/696cc469719de161eeed8120/output_480p.mp4",
    },
    {
      quality: "360p",
      url: "https://selectionwayrecorded.hranker.com/696cc469719de161eeed8120/output_360p.mp4",
    },
    {
      quality: "240p",
      url: "https://selectionwayrecorded.hranker.com/696cc469719de161eeed8120/output_240p.mp4",
    },
  ];

  for (const rec of recordings) {
    try {
      // Test range request for fast buffering
      const res = await fetchUrl(rec.url, {
        headers: { Range: "bytes=0-1024" },
        maxBytes: 2048,
      });
      const ok = res.statusCode === 200 || res.statusCode === 206;
      assert(
        ok,
        `MP4 [${rec.quality}] returned HTTP ${res.statusCode} (URL: ${rec.url.split("/").pop()})`,
      );
      const contentType = res.headers["content-type"];
      assert(
        contentType === "video/mp4",
        `MP4 [${rec.quality}] content-type is video/mp4 (${contentType})`,
      );
    } catch (err) {
      assert(false, `MP4 [${rec.quality}] failed: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

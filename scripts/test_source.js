async function main() {
  try {
    console.log("Fetching /study/batches...");
    const htmlRes = await fetch("https://pw.gemtara.in/study/batches");
    console.log("Status:", htmlRes.status);
    const html = await htmlRes.text();
    console.log("HTML length:", html.length);

    // Test known API endpoints
    const testEndpoints = [
      "https://pw.gemtara.in/api/AllBatches",
      "https://pw.gemtara.in/api/allbatches",
      "https://pw.gemtara.in/api/batches",
      "https://pw.gemtara.in/api/study/batches",
      "https://pw.gemtara.in/api/BatchInfo",
      "https://pw.gemtara.in/api/SubjectInfo",
      "https://pw.gemtara.in/api/TopicInfo",
      "https://pw.gemtara.in/api/get-video-with-keys",
    ];

    for (const ep of testEndpoints) {
      try {
        const res = await fetch(ep, {
          headers: {
            referer: "https://pw.gemtara.in/study/batches",
            origin: "https://pw.gemtara.in",
          },
        });
        const contentType = res.headers.get("content-type") || "";
        console.log(`Endpoint: ${ep} => status: ${res.status}, type: ${contentType}`);
        if (contentType.includes("json")) {
          const json = await res.json();
          console.log(`  Preview:`, JSON.stringify(json).slice(0, 200));
        } else {
          const t = await res.text();
          console.log(`  Text snippet:`, t.slice(0, 150));
        }
      } catch (e) {
        console.log(`Endpoint ${ep} failed:`, e.message);
      }
    }
  } catch (err) {
    console.error("Error in main:", err);
  }
}

main();

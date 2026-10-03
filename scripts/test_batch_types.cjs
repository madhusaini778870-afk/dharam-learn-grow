async function test() {
  const base = "https://pw.gemtara.in";
  const batchId = "698ad3519549b300a5e1cc6a";
  const types = ["subjects", "details", "subject", "all", "announcement", "schedule", "classes"];

  for (const t of types) {
    try {
      const url = `${base}/api/BatchInfo?BatchId=${batchId}&Type=${t}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      console.log(`Type=${t}: Status=${res.status}, keys:`, Object.keys(data));
      if (data.data) {
        console.log(
          `Type=${t} data preview:`,
          Array.isArray(data.data) ? `Array length ${data.data.length}` : typeof data.data,
        );
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log(`Type=${t} first item:`, JSON.stringify(data.data[0]).slice(0, 300));
        }
      }
    } catch (e) {
      console.error(`Type=${t} failed:`, e.message);
    }
  }
}
test();

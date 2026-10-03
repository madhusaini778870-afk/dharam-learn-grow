const fs = require("fs");

async function inspect() {
  const res = await fetch("https://pw.gemtara.in/study/batches");
  const html = await res.text();
  fs.writeFileSync("scripts/page.html", html);
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
  console.log("Found scripts count:", scripts.length);

  for (const s of scripts) {
    const url = s.startsWith("http") ? s : "https://pw.gemtara.in" + s;
    try {
      const sRes = await fetch(url);
      const code = await sRes.text();
      const apis = [...code.matchAll(/\/api\/[a-zA-Z0-9_\-\/]+/g)].map((m) => m[0]);
      if (apis.length) {
        console.log(s, "apis:", [...new Set(apis)]);
      }
      const domains = [
        ...code.matchAll(/https?:\/\/[a-zA-Z0-9\.\-_:]+\/[a-zA-Z0-9_\-\/\?&=]+/g),
      ].map((m) => m[0]);
      const interesting = domains.filter(
        (d) => !d.includes("w3.org") && !d.includes("github.com") && !d.includes("t.me"),
      );
      if (interesting.length) {
        console.log(s, "interesting domains/urls:", [...new Set(interesting)].slice(0, 10));
      }
    } catch (e) {
      console.error("Error on script", s, e.message);
    }
  }
}
inspect().catch(console.error);

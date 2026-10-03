const fs = require("fs");
const code = fs.readFileSync("scripts/batches_page.js", "utf8");
console.log("Size:", code.length);
const urls = [...code.matchAll(/\/api\/[a-zA-Z0-9_\-\/]+/g)].map((m) => m[0]);
console.log("API endpoints:", [...new Set(urls)]);
const fetches = [...code.matchAll(/fetch\([`"']([^`"']+)`?["']/g)].map((m) => m[1]);
console.log("Fetches:", [...new Set(fetches)]);
const studyMatches = [...code.matchAll(/\/study\/[a-zA-Z0-9_\-\/]+/g)].map((m) => m[0]);
console.log("Study links:", [...new Set(studyMatches)]);

// Find all occurrences of "http" or "api" or queries
const allQuotes = [...code.matchAll(/"([^"]{3,100})"/g)].map((m) => m[1]);
const candidateAPIs = allQuotes.filter(
  (q) =>
    q.includes("batch") ||
    q.includes("api") ||
    q.includes("search") ||
    q.includes("penpencil") ||
    q.includes("class"),
);
console.log("Candidate strings:", [...new Set(candidateAPIs)].slice(0, 30));

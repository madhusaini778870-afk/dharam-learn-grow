import urllib.request
import re
import json

url = 'https://vidya-verse.ai.studio/assets/index-C6SHn-E0.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Search for snippets mentioning /api/nt or /api/sw
for api in ['/api/nt', '/api/sw', '/api/public', 'batches', 'classes', 'video']:
    print(f"=== Matches for {api} ===")
    matches = [m.start() for m in re.finditer(re.escape(api), js)]
    for idx in matches[:10]:
        start = max(0, idx - 150)
        end = min(len(js), idx + 250)
        print("---")
        print(js[start:end])

import urllib.request
import re
import json

url = 'https://vidya-verse.ai.studio/assets/index-C6SHn-E0.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        print(f'Length of JS: {len(content)}')
        
        urls = set(re.findall(r'https?://[^\s"\'`<>]+', content))
        print('URLs found:')
        for u in sorted(urls):
            if any(k in u.lower() for k in ['api', 'pw', 'batch', 'gemtara', 'vidya', 'stream', 'm3u8', 'video', 'embed', 'player', 'youtube', 'cloudfront', 'study', 'penpencil', 'test', 'course']):
                print('  ', u)
        
        api_paths = set(re.findall(r'[\'\"`](/(?:api|study|batches|courses|lessons|batch)[^\'\"`]+)[\'\"`]', content))
        print('API paths found:')
        for p in sorted(api_paths):
            print('  ', p)
            
        # Also check for course titles, batch names, subjects, data objects
        matches = re.findall(r'([A-Za-z0-9_-]+(?:batch|course|lecture|subject|chapter|lesson)[A-Za-z0-9_-]*)', content, re.I)
        print('Sample identifiers:', list(set(matches))[:30])

except Exception as e:
    print('Error:', e)

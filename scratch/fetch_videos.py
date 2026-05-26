import urllib.request
import json

try:
    url = "https://valorant-api.com/v1/weapons/skins"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        count = 0
        for s in res['data']:
            for lvl in s.get('levels', []):
                video = lvl.get('streamedVideo')
                if video:
                    print(f'"{s["displayName"]}": "{video}",')
                    count += 1
                    if count >= 10:
                        break
            if count >= 10:
                break
except Exception as e:
    print("Error:", e)

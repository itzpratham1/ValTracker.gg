import urllib.request
import json

try:
    url = "https://valorant-api.com/v1/maps"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        for m in res['data']:
            name = m['displayName'].lower()
            icon = m.get('displayIcon')
            if icon:
                print(f'"{name}": "{icon}",')
except Exception as e:
    print("Error:", e)

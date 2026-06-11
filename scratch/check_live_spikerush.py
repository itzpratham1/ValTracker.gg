import requests
import urllib.parse

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"
mode = "spikerush"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"https://valtracker-gg.onrender.com/api/v3/matches/{region}/{enc_name}/{enc_tag}?mode={mode}&_nocache=true"

print(f"Querying live Render deployment: {url}")
try:
    r = requests.get(url, timeout=25)
    print("Status Code:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        matches = data.get('data', [])
        print(f"Total matches returned: {len(matches)}")
        for i, m in enumerate(matches[:3]):
            meta = m.get('metadata', {}) or {}
            print(f"  [{i+1}] ID: {meta.get('matchid')}, Mode: '{meta.get('mode')}', Map: '{meta.get('map')}', Game Start: {meta.get('game_start')}")
    else:
        print("Error:", r.status_code, r.text)
except Exception as e:
    print("Request failed:", e)

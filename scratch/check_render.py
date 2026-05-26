import requests
import urllib.parse
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"https://valtracker-gg.onrender.com/api/v3/matches/{region}/{enc_name}/{enc_tag}?mode=competitive"
print("Querying LIVE RENDER URL:", url)

try:
    r = requests.get(url, timeout=20)
    print("Status code:", r.status_code)
    if r.status_code == 200:
        res = r.json()
        matches = res.get("data", [])
        print("Total matches returned by live Render API:", len(matches))
        for i, m in enumerate(matches):
            meta = m.get("metadata", {})
            print(f"[{i+1}] ID: {meta.get('matchid') or meta.get('match_id')}, Map: {meta.get('map')}, GameStart: {meta.get('game_start')}")
    else:
        print("Error content:", r.text)
except Exception as e:
    print("Failed with exception:", e)

import requests
import urllib.parse
import sys

# Set output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

name = "ItzPrathamエース"
tag = "GEWin"
enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"https://valtracker-gg.onrender.com/api/v3/matches/ap/{enc_name}/{enc_tag}?mode=competitive"
print(f"Fetching matches from: {url}")
try:
    r = requests.get(url, timeout=10)
    print(f"Status Code: {r.status_code}")
    data = r.json().get("data", [])
    print(f"Total matches returned: {len(data)}")
    for idx, match in enumerate(data[:5]):
        meta = match.get("metadata", {})
        game_start = meta.get("game_start") or meta.get("gameStart")
        game_start_patched = meta.get("game_start_patched")
        print(f"Match {idx+1}:")
        print(f"  game_start: {game_start} (type: {type(game_start)})")
        print(f"  game_start_patched: {game_start_patched}")
        print(f"  map: {meta.get('map')}")
        print(f"  mode: {meta.get('mode')}")
except Exception as e:
    print(f"Error: {e}")

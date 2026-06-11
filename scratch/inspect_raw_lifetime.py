import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")

url = "https://api.henrikdev.xyz/valorant/v1/lifetime/matches/ap/ItzPratham%E3%82%A8%E3%83%BC%E3%82%B9/GEWin"
headers = {"Authorization": API_KEY}
r = requests.get(url, headers=headers, params={"mode": "spikerush", "size": 1})
if r.status_code == 200:
    data = r.json()
    matches = data.get("data", [])
    if matches:
        import json
        print(json.dumps(matches[0], indent=2))
    else:
        print("No matches returned.")
else:
    print("Error:", r.status_code, r.text)

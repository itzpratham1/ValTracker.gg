import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")
match_id = "99f88369-32a3-4f51-abd4-eb15ad37d69b"

url = f"https://api.henrikdev.xyz/valorant/v2/match/{match_id}"
headers = {"Authorization": API_KEY}

r = requests.get(url, headers=headers)
if r.status_code == 200:
    data = r.json()
    match = data.get("data", {})
    rounds = match.get("rounds", [])
    if rounds:
        for i, rd in enumerate(rounds):
            if rd.get("bomb_defused"):
                print(f"Round {i+1} bomb_defused is True")
                defuse = rd.get("defuse_events", {})
                print("defuse_events keys:", list(defuse.keys()) if defuse else "None")
                print("defused_by keys:", list(defuse.get("defused_by", {}).keys()) if defuse.get("defused_by") else "None")
                break
else:
    print("Error:", r.text)

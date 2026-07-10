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
    kills = match.get("kills", [])
    if kills:
        print("damage_weapon_assets:", kills[0].get("damage_weapon_assets"))
else:
    print("Error:", r.text)

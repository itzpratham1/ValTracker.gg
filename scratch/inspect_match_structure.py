import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
params = {
    "select": "stripped_raw_match",
    "limit": "5"
}

r = requests.get(url, headers=headers, params=params)
if r.status_code == 200:
    rows = r.json()
    for row in rows:
        match = row.get("stripped_raw_match")
        if match:
            print("MATCH METADATA:", match.get("metadata"))
            rounds = match.get("rounds", [])
            print("ROUND COUNT:", len(rounds))
            if rounds:
                first_round = rounds[0]
                print("ROUND KEYS:", list(first_round.keys()))
                print("PLANT EVENTS KEYS:", list(first_round.get("plant_events", {}).keys()) if first_round.get("plant_events") else "No plant_events")
                print("PLANT EVENTS FULL:", first_round.get("plant_events"))
                print("DEFUSE EVENTS KEYS:", list(first_round.get("defuse_events", {}).keys()) if first_round.get("defuse_events") else "No defuse_events")
                print("DEFUSE EVENTS FULL:", first_round.get("defuse_events"))
            break
else:
    print("Error:", r.text)

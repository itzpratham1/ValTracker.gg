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

puuid = "beac9167-cb20-5dba-9127-bf962cc9bdec"
mode = "competitive"

# Test exact same query app.py does
m_url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
m_params = {
    "puuid": f"eq.{puuid}",
    "mode": f"eq.{mode}",
    "order": "game_start.desc",
    "limit": "100"
}
mr = requests.get(m_url, headers=headers, params=m_params)
print("Status code:", mr.status_code)
if mr.status_code == 200:
    matches = mr.json()
    print("Matches count with eq.mode:", len(matches))
    for m in matches:
        print(" - ", m["match_id"], m["map_name"], m["game_start"], m["mode"])
else:
    print("Error:", mr.text)

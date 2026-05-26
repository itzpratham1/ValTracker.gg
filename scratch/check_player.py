import requests
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

sys.stdout.reconfigure(encoding='utf-8')

# Query players_cache table
url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/players_cache"
params = {
    "name": "ilike.ItzPrathamエース",
    "tag": "ilike.GEWin"
}

r = requests.get(url, headers=headers, params=params)
print("Status code:", r.status_code)
if r.status_code == 200:
    players = r.json()
    print("Found players in cache:")
    for p in players:
        print(p)
        puuid = p["puuid"]
        # Fetch matches_cache for this puuid
        m_url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
        m_params = {
            "puuid": f"eq.{puuid}",
            "select": "puuid,match_id,map_name,game_start"
        }
        mr = requests.get(m_url, headers=headers, params=m_params)
        if mr.status_code == 200:
            matches = mr.json()
            print(f"Matches count for {p['name']}#{p['tag']}: {len(matches)}")
            for m in matches:
                print(" - ", m["match_id"], m["map_name"], m["game_start"])
        else:
            print("Error matches:", mr.text)
else:
    print("Error:", r.text)

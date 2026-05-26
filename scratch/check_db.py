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

print("SUPABASE URL:", SUPABASE_URL)

# Query matches_cache table
url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
params = {
    "select": "puuid,match_id,mode,map_name,game_start",
    "order": "game_start.desc",
    "limit": "100"
}

r = requests.get(url, headers=headers, params=params)
print("Status code:", r.status_code)
if r.status_code == 200:
    rows = r.json()
    print("Total rows fetched:", len(rows))
    print("First few rows:")
    for row in rows[:15]:
        print(row)
else:
    print("Error:", r.text)

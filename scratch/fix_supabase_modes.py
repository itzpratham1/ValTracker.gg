import requests
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabase credentials missing!")
    sys.exit(1)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def normalize_mode(raw_mode):
    if not raw_mode:
        return ""
    m = raw_mode.lower().replace(" ", "").replace("-", "")
    if m == "teamdm":
        return "teamdeathmatch"
    return m

# Fetch all rows from matches_cache
url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
params = {
    "select": "puuid,match_id,mode,stripped_raw_match"
}

print("Fetching all matches from Supabase...")
r = requests.get(url, headers=headers, params=params)
if r.status_code != 200:
    print(f"Error fetching matches: {r.status_code} {r.text}")
    sys.exit(1)

rows = r.json()
print(f"Total matches found in database cache: {len(rows)}")

fixed_count = 0
for i, row in enumerate(rows):
    puuid = row["puuid"]
    match_id = row["match_id"]
    mode_db = row["mode"]
    stripped = row.get("stripped_raw_match") or {}
    
    actual_mode_raw = stripped.get("metadata", {}).get("mode", "")
    actual_mode = normalize_mode(actual_mode_raw)
    
    if actual_mode and actual_mode != mode_db:
        print(f"[{i+1}] Match {match_id}: DB mode is '{mode_db}', but actual is '{actual_mode}' (raw: '{actual_mode_raw}'). Fixing...")
        
        # Update row in Supabase
        update_url = f"{url}?puuid=eq.{puuid}&match_id=eq.{match_id}"
        update_data = {"mode": actual_mode}
        
        up_res = requests.patch(update_url, headers=headers, json=update_data)
        if up_res.status_code in [200, 204]:
            fixed_count += 1
        else:
            print(f"  FAILED to update Match {match_id}: {up_res.status_code} {up_res.text}")

print(f"Database cache cleanup completed. Fixed {fixed_count} records.")

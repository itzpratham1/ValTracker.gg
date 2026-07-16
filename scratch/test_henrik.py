import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("HENRIKDEV_API_KEY", "")
print("API Key:", api_key[:10] + "..." if api_key else "None")

# Fetch recent matches for HARSH#khel (ap region)
url = "https://api.henrikdev.xyz/valorant/v3/matches/ap/HARSH/khel"
headers = {}
if api_key:
    headers["Authorization"] = api_key

r = requests.get(url, headers=headers, timeout=10)
print("Status Code:", r.status_code)
if r.status_code == 200:
    data = r.json()
    matches = data.get("data", [])
    if matches:
        first_match = matches[0]
        players = first_match.get("players", {}).get("all_players", [])
        if players:
            print("Keys of first player in all_players:")
            print(list(players[0].keys()))
            print("\nFirst player sample data:")
            for k in ["name", "tag", "party_id", "partyId", "puuid"]:
                if k in players[0]:
                    print(f"  {k}: {players[0][k]}")
        else:
            print("No players found in matches[0]['players']['all_players']")
    else:
        print("No matches returned in data['data']")
else:
    print("Response:", r.text[:200])

import requests
import urllib.parse
import os
import sys
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

# Fetch matches for the player without mode filter to see all recent matches and their metadata.mode values
url = f"https://api.henrikdev.xyz/valorant/v3/matches/{region}/{enc_name}/{enc_tag}"
headers = {
    "Authorization": API_KEY,
    "Content-Type": "application/json"
}

print("Fetching recent matches without filter from HenrikDev...")
r = requests.get(url, headers=headers)
print("Status Code:", r.status_code)
if r.status_code == 200:
    data = r.json()
    matches = data.get("data", [])
    print(f"Fetched {len(matches)} matches.")
    for i, m in enumerate(matches):
        meta = m.get("metadata", {})
        print(f"[{i+1}] ID: {meta.get('matchid')}, Mode: '{meta.get('mode')}', Queue: '{meta.get('queue')}'")
else:
    print("Error:", r.text)

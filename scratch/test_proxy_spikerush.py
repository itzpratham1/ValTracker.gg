import requests
import os
import sys
import urllib.parse
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

from app import app, normalize_mode

client = app.test_client()

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"
mode = "spikerush"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"/api/v3/matches/{region}/{enc_name}/{enc_tag}?mode={mode}&_nocache=true"

print(f"Querying local test client: {url}")
r = client.get(url)
print("Status Code:", r.status_code)
if r.status_code == 200:
    data = r.get_json()
    matches = data.get('data', [])
    print(f"Total matches returned by proxy: {len(matches)}")
    for i, m in enumerate(matches):
        meta = m.get('metadata', {}) or {}
        print(f"  [{i+1}] ID: {meta.get('matchid')}, Mode: '{meta.get('mode')}', Map: '{meta.get('map')}', Game Start: {meta.get('game_start')}")
else:
    print("Error:", r.text)

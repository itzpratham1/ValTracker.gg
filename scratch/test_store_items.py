import requests
import os
import json
from dotenv import load_dotenv

load_dotenv("c:/Users/prath/Downloads/VALSTATS/v8/.env")
api_key = os.environ.get("HENRIKDEV_API_KEY")

headers = {
    "Authorization": api_key,
    "Content-Type": "application/json"
}

try:
    url = "https://api.henrikdev.xyz/valorant/v2/store-featured"
    r = requests.get(url, headers=headers, timeout=8)
    if r.status_code == 200:
        data = r.json()
        print(json.dumps(data['data'][0], indent=2))
except Exception as e:
    print("Error:", e)

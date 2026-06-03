import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("HENRIKDEV_API_KEY", "")
headers = {"Authorization": api_key}
r = requests.get("https://api.henrikdev.xyz/valorant/v2/store-featured", headers=headers)
print("Store Status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    print("Bundle UUIDs:")
    for b in data.get("data", []):
        print("Bundle:", b.get("bundle_uuid"), "Expires in:", b.get("seconds_remaining"))
else:
    print(r.text)

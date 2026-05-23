import requests
import urllib.parse
import json

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

base_url = "http://127.0.0.1:5000"
url = base_url + f"/api/v3/mmr/{region}/pc/{enc_name}/{enc_tag}"

try:
    r = requests.get(url, timeout=10)
    data = r.json()
    mmr_data = data.get("data", {})
    print("MMR data keys:", list(mmr_data.keys()))
    if "current" in mmr_data:
        print("current keys and values:")
        print(json.dumps(mmr_data["current"], indent=2))
    if "peak" in mmr_data:
        print("peak keys and values:")
        print(json.dumps(mmr_data["peak"], indent=2))
except Exception as e:
    print(f"Failed with exception: {e}")

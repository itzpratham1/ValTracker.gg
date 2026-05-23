import os
import urllib.parse
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("HENRIKDEV_API_KEY", "")
print("API Key loaded:", api_key[:10] + "..." if api_key else "None")

name = "ItzPrathamエース"
tag = "GEWin"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

# Test account fetch
url = f"https://api.henrikdev.xyz/valorant/v1/account/{enc_name}/{enc_tag}"
headers = {"Authorization": api_key}
r = requests.get(url, headers=headers)
print("Account Status:", r.status_code)
try:
    print("Account Data (truncated):", r.text[:300])
except Exception as e:
    print(e)

# Test MMR fetch (v3 mmr API)
url_mmr = f"https://api.henrikdev.xyz/valorant/v3/mmr/ap/pc/{enc_name}/{enc_tag}"
r_mmr = requests.get(url_mmr, headers=headers)
print("MMR Status:", r_mmr.status_code)
try:
    print("MMR Data (truncated):", r_mmr.text[:300])
except Exception as e:
    print(e)

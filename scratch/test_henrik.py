import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("HENRIKDEV_API_KEY", "")

headers = {
    "Authorization": api_key,
    "Content-Type": "application/json"
}

# Test 1: Account Query for Harsh#KHEL
url_acc_harsh = "https://api.henrikdev.xyz/valorant/v1/account/Harsh/KHEL"
print(f"Querying Harsh account: {url_acc_harsh}")
try:
    r = requests.get(url_acc_harsh, headers=headers, timeout=10)
    print("Harsh account status:", r.status_code)
    print("Harsh account content:", r.text[:200])
except Exception as e:
    print("Harsh account failed:", e)

# Test 2: Account Query for ItzPrathamエース#GEWin
url_acc_pratham = "https://api.henrikdev.xyz/valorant/v1/account/ItzPratham%E3%82%A8%E3%83%BC%E3%82%B9/GEWin"
print(f"Querying Pratham account: {url_acc_pratham}")
try:
    r = requests.get(url_acc_pratham, headers=headers, timeout=10)
    print("Pratham account status:", r.status_code)
    print("Pratham account content:", r.text[:200])
except Exception as e:
    print("Pratham account failed:", e)

# Test 3: Matches Query for Harsh#KHEL
url_matches_harsh = "https://api.henrikdev.xyz/valorant/v3/matches/ap/Harsh/KHEL?mode=competitive"
print(f"Querying Harsh matches: {url_matches_harsh}")
try:
    r = requests.get(url_matches_harsh, headers=headers, timeout=10)
    print("Harsh matches status:", r.status_code)
    print("Harsh matches data length:", len(r.content))
except Exception as e:
    print("Harsh matches failed:", e)

import requests

url = "https://valtracker-gg.onrender.com/overlay.js"
print(f"Checking deployment status at: {url}")
try:
    r = requests.get(url, headers={"Cache-Control": "no-cache"}, timeout=10)
    if r.status_code == 200:
        if "lossStreak" in r.text:
            print("[SUCCESS] Latest commit containing loss streaks is deployed and live!")
        else:
            print("[BUILDING] Old version is still active. Waiting for Render deployment...")
    else:
        print(f"[ERROR] Live URL returned status code: {r.status_code}")
except Exception as e:
    print(f"[ERROR] Fetch failed: {e}")

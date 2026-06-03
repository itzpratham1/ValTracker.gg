import requests
import time

# Render cache busts static assets, but we check if the html page or public/index.css is updated
url = "https://valtracker-gg.onrender.com/index.css"
print(f"Checking deployment status for overscroll fixes at: {url}")

for i in range(15):  # try for up to 2.5 minutes
    try:
        r = requests.get(url, headers={"Cache-Control": "no-cache"}, timeout=10)
        if r.status_code == 200:
            if "overscroll-behavior: none;" in r.text:
                print("\n[SUCCESS] Overscroll behavior and theme color adjustments are deployed and live!")
                break
            else:
                print(f"[{i+1}/15] Old version is still active. Waiting for Render deployment...")
        else:
            print(f"[ERROR] Live URL returned status code: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Fetch failed: {e}")
    
    time.sleep(10)
else:
    print("\n[TIMEOUT] Deployment check timed out. Render may still be building the project.")

import requests

url = "https://valtracker-gg.onrender.com/"
try:
    r = requests.get(url, timeout=20, allow_redirects=True)
    has_landing = "Stop Guessing" in r.text or "landing" in r.text or "Track Your Stats" in r.text
    has_old = "landing-lookup-form" in r.text or "Look up a player" in r.text
    print(f"Status:      {r.status_code}")
    print(f"Final URL:   {r.url}")
    print(f"New landing: {has_landing}")
    print(f"Old app:     {has_old}")
    if has_landing:
        print("\n✅ Landing page is LIVE on Render!")
    elif has_old:
        print("\n⏳ Still serving old app — Render is still deploying, wait ~1 min")
    else:
        print("\n❓ Unknown content — check manually")
except Exception as e:
    print(f"Error: {e}")

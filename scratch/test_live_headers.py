import requests

urls = [
    "https://valtracker-gg.onrender.com/overlay",
    "https://valtracker-gg.onrender.com/overlay.js",
    "https://valtracker-gg.onrender.com/overlay.css"
]

for url in urls:
    print(f"Checking: {url}")
    try:
        r = requests.get(url, timeout=10)
        print(f"  Status: {r.status_code}")
        print(f"  Cache-Control: {r.headers.get('Cache-Control')}")
        print(f"  Pragma: {r.headers.get('Pragma')}")
        print(f"  Expires: {r.headers.get('Expires')}")
    except Exception as e:
        print(f"  Error: {e}")
    print("-" * 50)

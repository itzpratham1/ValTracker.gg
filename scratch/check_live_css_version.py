import requests

url = "https://valtracker-gg.onrender.com/index.html"
print(f"Fetching: {url}")
try:
    r = requests.get(url, headers={"Cache-Control": "no-cache"}, timeout=10)
    print(f"Status Code: {r.status_code}")
    for line in r.text.split("\n"):
        if "index.css?v=" in line:
            print(f"Found line: {line.strip()}")
except Exception as e:
    print(f"Error: {e}")

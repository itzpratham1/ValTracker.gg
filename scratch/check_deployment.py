import requests
import urllib.parse
import sys

sys.stdout.reconfigure(encoding='utf-8')

name = "ItzPrathamエース"
tag = "GEWin"
region = "ap"

enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"https://valtracker-gg.onrender.com/api/v1/live-match/{region}/{enc_name}/{enc_tag}"
print("Querying /api/v1/live-match on Render:", url)

try:
    r = requests.get(url, timeout=20)
    print("Status code:", r.status_code)
    print("Response text:", r.text[:200])
except Exception as e:
    print("Failed with exception:", e)

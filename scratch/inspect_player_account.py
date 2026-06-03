import requests
import urllib.parse
import sys

# Set output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

name = "ItzPrathamエース"
tag = "GEWin"
enc_name = urllib.parse.quote(name)
enc_tag = urllib.parse.quote(tag)

url = f"https://valtracker-gg.onrender.com/api/v1/account/{enc_name}/{enc_tag}"
try:
    r = requests.get(url, timeout=10)
    data = r.json().get("data", {})
    print(f"Region: {data.get('region')}")
    print(f"Name: {data.get('name')}")
    print(f"Tag: {data.get('tag')}")
except Exception as e:
    print(f"Error: {e}")

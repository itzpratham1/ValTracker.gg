import urllib.request
import json

try:
    res = urllib.request.urlopen("http://127.0.0.1:5000/api/esports/live", timeout=2)
    print(res.read().decode('utf-8')[:100])
except Exception as e:
    print(f"Server error: {e}")

import urllib.request
import sys

print("--- Testing /overlay endpoint ---")
try:
    res = urllib.request.urlopen("http://127.0.0.1:5000/overlay", timeout=5)
    content = res.read().decode('utf-8')
    print(f"Status Code: {res.status}")
    
    if "overlay.css" in content and "overlay.js" in content:
        print("[SUCCESS] /overlay served successfully and loads style and script assets!")
        sys.exit(0)
    else:
        print("[FAILURE] /overlay did not contain expected stylesheet or script references.")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Failed to query /overlay: {e}")
    sys.exit(1)

import urllib.request
import sys

print("=== Testing Local Server Response ===")
try:
    # 1. Fetch overlay HTML
    html_res = urllib.request.urlopen("http://127.0.0.1:5000/overlay?name=ItzPratham&tag=GEWin", timeout=5)
    html_content = html_res.read().decode('utf-8')
    print("HTML Status:", html_res.status)
    print("HTML Headers:")
    for k, v in html_res.getheaders():
        print(f"  {k}: {v}")
    
    # 2. Fetch overlay JS
    js_res = urllib.request.urlopen("http://127.0.0.1:5000/overlay.js", timeout=5)
    js_content = js_res.read().decode('utf-8')
    print("\nJS Status:", js_res.status)
    print("JS Headers:")
    for k, v in js_res.getheaders():
        print(f"  {k}: {v}")
    
    print("\nCheck if JS contains the isToday filter:")
    if "isToday" in js_content:
        print("[OK] JS contains the new isToday filter!")
    else:
        print("[FAIL] JS does NOT contain the new isToday filter.")

except Exception as e:
    print(f"[ERROR] Failed to query local server: {e}")

import requests
try:
    r = requests.get("http://127.0.0.1:5000/api/store/featured", timeout=5)
    print("Status:", r.status_code)
    print("JSON keys:", r.json().keys() if r.status_code == 200 else "N/A")
    print("Data length:", len(r.json().get("data", [])) if r.status_code == 200 else "N/A")
except Exception as e:
    print("Error:", e)

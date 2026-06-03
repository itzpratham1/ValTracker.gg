import requests
r = requests.get("https://valorant-api.com/v1/bundles/602900ed-4e10-d214-acc5-8883ed2430f5")
print(r.status_code)
if r.status_code == 200:
    print(r.json().get("data", {}).get("displayName"))
else:
    print(r.text)

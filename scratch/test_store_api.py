import requests
import os
from dotenv import load_dotenv

load_dotenv("c:/Users/prath/Downloads/VALSTATS/v8/.env")
api_key = os.environ.get("HENRIKDEV_API_KEY")

headers = {
    "Authorization": api_key,
    "Content-Type": "application/json"
}

try:
    print("Fetching featured store from HenrikDev...")
    url = "https://api.henrikdev.xyz/valorant/v2/store-featured"
    r = requests.get(url, headers=headers, timeout=8)
    print("v2 Status Code:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print("Success! Response keys:", data.keys())
        if 'data' in data:
            print(f"Parsed {len(data['data'])} bundles.")
            for i, bundle in enumerate(data['data']):
                print(f"\nBundle {i+1}:")
                # print some keys of the bundle
                for k, v in bundle.items():
                    if k not in ['items']:
                        print(f"  {k}: {v}")
                    else:
                        print(f"  items count: {len(v)}")
                        for item in v[:3]:
                            print(f"    - Type: {item.get('type')}, Name: '{item.get('name')}', Price: {item.get('price')}")
except Exception as e:
    print("Error:", e)

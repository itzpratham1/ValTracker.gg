import requests
import json
r = requests.get("http://127.0.0.1:5000/api/store/featured")
print(json.dumps(r.json(), indent=2))

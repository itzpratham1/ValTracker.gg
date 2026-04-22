import os
import time
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

# In-memory cache to prevent rate-limits and load data instantly
# Format: URL -> { "data": response_json, "timestamp": time_fetched }
cache = {}
CACHE_TTL = 300  # 5 minutes caching

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

import urllib.parse

@app.route("/api/<path:subpath>", methods=["GET", "POST"])
def proxy_api(subpath):
    # Proxy requests to henrikdev API
    encoded_subpath = urllib.parse.quote(subpath, safe='/')
    target_url = f"https://api.henrikdev.xyz/valorant/{encoded_subpath}"
    
    # Include query parameters in cache key so different modes don't collide
    cache_key = f"{target_url}?{request.query_string.decode('utf-8')}"
    
    # Check cache for GET requests
    if request.method == "GET" and cache_key in cache:
        cache_entry = cache[cache_key]
        if time.time() - cache_entry["timestamp"] < CACHE_TTL:
            print("[CACHE HIT] Serving from memory")
            return jsonify(cache_entry["data"])
            
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }
    
    # Forward query parameters
    params = request.args.to_dict()
    
    try:
        print(f"[{request.method}] Fetching from {target_url}")
        if request.method == "GET":
            response = requests.get(target_url, headers=headers, params=params)
        else:
            response = requests.post(target_url, headers=headers, json=request.json)
        
        # If API returns a standard 200, but isn't JSON, handle it
        if response.status_code != 200:
            try:
                err_data = response.json()
            except:
                err_data = {"status": response.status_code, "error": "Unknown API error"}
            return jsonify(err_data), response.status_code
            
        data = response.json()
        
        # Save to cache if successful
        if response.status_code == 200 and request.method == "GET":
            cache[cache_key] = {
                "data": data,
                "timestamp": time.time()
            }
            
        return jsonify(data), response.status_code
    except Exception as e:
        return jsonify({"status": 500, "errors": [{"message": str(e)}]}), 500

if __name__ == "__main__":
    if not API_KEY:
        print("\n[WARNING] API Key missing in .env file! Requests to HenrikDev might fail.\n")
    print("\n[SUCCESS] Backend Server starting on http://127.0.0.1:5000")
    print("-> Open your browser to http://127.0.0.1:5000 to view your app\n")
    app.run(port=5000, debug=True)

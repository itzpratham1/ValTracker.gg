import os
import time
import requests
import firebase_admin
from firebase_admin import credentials, firestore
import json
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

# Initialize Firebase Admin
try:
    cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "firebase-key.json"))
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("[SUCCESS] Firebase initialized successfully!")
except Exception as e:
    print(f"[ERROR] Failed to initialize Firebase: {e}")
    db = None

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

import urllib.parse

@app.route("/api/db/save", methods=["POST"])
def db_save():
    payload = request.json
    if not payload or 'matches' not in payload:
        return jsonify({"success": False, "error": "Invalid payload"}), 400
    
    matches_list = payload['matches']
    player_name = payload.get('player_name', '')
    player_tag = payload.get('player_tag', '')
    mode = payload.get('mode', 'competitive')
    
    saved = 0
    if db is None:
        return jsonify({"success": False, "error": "Database not initialized"}), 500
        
    batch = db.batch()
    batch_count = 0
    
    for m in matches_list:
        mid = None
        if "metadata" in m:
            mid = m["metadata"].get("matchid") or m["metadata"].get("match_id")
        if not mid:
            continue
            
        store_key = f"{player_name}#{player_tag}|{mode}|{mid}"
        game_start = m.get("metadata", {}).get("game_start", int(time.time()))
        
        doc_ref = db.collection('matches').document(store_key)
        batch.set(doc_ref, {
            'store_key': store_key,
            'date': game_start,
            'data': json.dumps(m)
        }, merge=True)
        
        saved += 1
        batch_count += 1
        if batch_count >= 400: # Firestore batch limit
            try:
                batch.commit()
            except Exception as e:
                print(f"Firestore batch error: {e}")
            batch = db.batch()
            batch_count = 0
            
    if batch_count > 0:
        try:
            batch.commit()
        except Exception as e:
            print(f"Firestore batch error: {e}")
            
    return jsonify({"success": True, "saved": saved})

@app.route("/api/db/matches", methods=["GET"])
def db_get_matches():
    player_name = request.args.get('name', '')
    player_tag = request.args.get('tag', '')
    mode = request.args.get('mode', 'competitive')
    
    if db is None:
        return jsonify({"success": False, "error": "Database not initialized"}), 500
        
    prefix = f"{player_name}#{player_tag}|{mode}|"
    
    try:
        # Prefix search in Firestore
        docs = db.collection('matches') \
                 .where('store_key', '>=', prefix) \
                 .where('store_key', '<', prefix + '\uf8ff') \
                 .order_by('store_key') \
                 .get()
                 
        parsed = []
        for doc in docs:
            d = doc.to_dict()
            try:
                parsed.append((d.get('date', 0), json.loads(d['data'])))
            except:
                pass
                
        parsed.sort(key=lambda x: x[0], reverse=True)
        matches = [x[1] for x in parsed]
                
        return jsonify({"success": True, "matches": matches})
    except Exception as e:
        print(f"Firestore get error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/db/clear", methods=["POST"])
def db_clear():
    if db is None:
        return jsonify({"success": False, "error": "Database not initialized"}), 500
        
    try:
        docs = db.collection('matches').limit(500).get()
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Firestore clear error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

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

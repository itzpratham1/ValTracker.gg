import os
import time
import requests
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

# In-memory cache to prevent rate-limits and load data instantly
# Format: URL -> { "data": response_json, "timestamp": time_fetched }
cache = {}
CACHE_TTL = 60  # 1 minute caching — keeps data fresh between fetches

@app.route("/")
def index():
    resp = make_response(send_from_directory(app.static_folder, "index.html"))
    # Never cache the HTML — ensures browser always loads latest JS
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp

@app.route("/api/clear-cache", methods=["POST"])
def clear_server_cache():
    """Wipes the server-side in-memory cache so next fetch is always live."""
    cache.clear()
    return jsonify({"status": "ok", "message": "Server cache cleared"})

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
    
    # Forward query parameters — strip internal _nocache param so HenrikDev doesn't see it
    params = request.args.to_dict()
    params.pop('_nocache', None)
    
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

# --- ESPORTS ROUTES ---

def get_henrik_schedule():
    cache_key = "henrik_schedule"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 120:
        return cache[cache_key]["data"]
        
    try:
        url = "https://api.henrikdev.xyz/valorant/v1/esports/schedule"
        headers = {"Authorization": API_KEY}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json().get("data", [])
            cache[cache_key] = {"data": data, "timestamp": time.time()}
            return data
    except Exception as e:
        print("[ERROR] Henrik schedule fetch failed:", e)
    return []

@app.route("/api/esports/live")
def esports_live():
    data = get_henrik_schedule()
    live = [m for m in data if m.get("state") == "inProgress"]
    return jsonify({"data": live})

@app.route("/api/esports/results")
def esports_results():
    data = get_henrik_schedule()
    results = [m for m in data if m.get("state") == "completed"]
    return jsonify({"data": results})

@app.route("/api/esports/upcoming")
def esports_upcoming():
    data = get_henrik_schedule()
    upcoming = [m for m in data if m.get("state") == "unstarted"]
    return jsonify({"data": upcoming})

@app.route("/api/esports/news")
def esports_news():
    cache_key = "vlr_news"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 600:
        return jsonify({"data": cache[cache_key]["data"]})
        
    try:
        from bs4 import BeautifulSoup
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        r = requests.get('https://www.vlr.gg/news', headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        news_items = []
        for item in soup.find_all('a', class_='wf-module-item')[:15]:
            title_el = item.find('div', style=lambda v: v and 'font-weight: 700' in v)
            date_author_el = item.find('div', class_='ge-text-light')
            
            if title_el:
                date_str = "Recent"
                author_str = "VLR.gg"
                if date_author_el:
                    parts = date_author_el.text.strip().split('•')
                    if len(parts) >= 2:
                        date_str = parts[0].strip()
                        author_str = parts[1].strip()
                
                news_items.append({
                    "title": title_el.text.strip(),
                    "description": "",
                    "date": date_str,
                    "author": author_str,
                    "url_path": item.get('href', '')
                })
        cache[cache_key] = {"data": news_items, "timestamp": time.time()}
        return jsonify({"data": news_items})
    except Exception as e:
        print("[ERROR] VLR News scraping failed:", e)
        return jsonify({"error": str(e), "data": []}), 500

@app.route("/api/esports/standings/<region>")
def esports_standings(region):
    # region can be na, eu, ap, la, kr, cn, or all
    cache_key = f"vlr_standings_{region}"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 3600:
        return jsonify({"data": cache[cache_key]["data"]})
        
    try:
        from bs4 import BeautifulSoup
        headers = {'User-Agent': 'Mozilla/5.0'}
        url_region = region
        if region == "all": url_region = "north-america"
        elif region == "na": url_region = "north-america"
        elif region == "eu": url_region = "europe"
        elif region == "ap": url_region = "asia-pacific"
        elif region == "la": url_region = "latin-america"
        
        r = requests.get(f'https://www.vlr.gg/rankings/{url_region}', headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        standings = []
        rows = soup.find_all('tr')
        rank = 1
        for row in rows[1:51]: # skip header, take top 50
            tds = row.find_all('td')
            if len(tds) >= 2:
                team_name = tds[0].text.replace('\t', '').replace('\n', ' ').strip().split('  ')[0].strip()
                standings.append({
                    "rank": rank,
                    "team": team_name,
                    "wins": 0, "losses": 0, "streak": "-", "country": region.upper()
                })
                rank += 1
                
        cache[cache_key] = {"data": standings, "timestamp": time.time()}
        return jsonify({"data": standings})
    except Exception as e:
        print(f"[ERROR] VLR Standings scraping failed:", e)
        return jsonify({"error": str(e), "data": []}), 500

if __name__ == "__main__":
    if not API_KEY:
        print("\n[WARNING] API Key missing in .env file! Requests to HenrikDev might fail.\n")
    print("\n[SUCCESS] Backend Server starting on http://127.0.0.1:5000")
    print("-> Open your browser to http://127.0.0.1:5000 to view your app\n")
    app.run(port=5000, debug=True)

import os
import time
import requests
import base64
import urllib3
import urllib.parse
import concurrent.futures
import gzip
import io
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import builtins

def safe_print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except (UnicodeEncodeError, AttributeError, TypeError):
        try:
            safe_args = [
                str(arg).encode('ascii', errors='replace').decode('ascii')
                for arg in args
            ]
            builtins.print(*safe_args, **kwargs)
        except:
            pass

print = safe_print

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# ── SUPABASE PostgREST HELPER FUNCTIONS ──

def supabase_request(method, table, data=None, params=None, headers=None):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table}"
    default_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    if headers:
        default_headers.update(headers)
        
    try:
        if method.upper() == "GET":
            r = requests.get(url, headers=default_headers, params=params, timeout=4)
        elif method.upper() == "POST":
            r = requests.post(url, headers=default_headers, json=data, timeout=4)
        elif method.upper() == "PATCH":
            r = requests.patch(url, headers=default_headers, json=data, params=params, timeout=4)
        elif method.upper() == "DELETE":
            r = requests.delete(url, headers=default_headers, params=params, timeout=4)
        else:
            return None
        return r
    except Exception as e:
        print(f"[SUPABASE ERROR] {method} {table} failed: {e}")
        return None

def extract_player_params(subpath):
    parts = [urllib.parse.unquote(p) for p in subpath.split("/")]
    
    # v1/account/<name>/<tag>
    if len(parts) >= 4 and parts[0] == "v1" and parts[1] == "account":
        return parts[2], parts[3]
        
    # v3/mmr/<region>/pc/<name>/<tag>
    if len(parts) >= 6 and parts[0] == "v3" and parts[1] == "mmr":
        return parts[4], parts[5]
        
    # v3/matches/<region>/<name>/<tag>
    if len(parts) >= 5 and parts[0] == "v3" and parts[1] == "matches":
        return parts[3], parts[4]
        
    # v1/stored-mmr-history/<region>/<name>/<tag>
    if len(parts) >= 5 and parts[0] == "v1" and parts[1] == "stored-mmr-history":
        return parts[3], parts[4]
        
    return None, None

def get_cached_player(name, tag):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
        
    params = {
        "name": f"ilike.{name}",
        "tag": f"ilike.{tag}"
    }
    r = supabase_request("GET", "players_cache", params=params)
    if r and r.status_code == 200:
        players = r.json()
        if players and len(players) > 0:
            return players[0]
    return None

def is_player_fresh(cached_player, ttl_seconds=900): # 15 minutes
    if not cached_player:
        return False
    last_updated_str = cached_player.get("last_updated")
    if not last_updated_str:
        return False
    try:
        clean_str = last_updated_str.split(".")[0].rstrip("Z")
        if "+" in clean_str:
            clean_str = clean_str.split("+")[0]
        
        dt = datetime.strptime(clean_str, "%Y-%m-%dT%H:%M:%S")
        import calendar
        timestamp = calendar.timegm(dt.utctimetuple())
        return (time.time() - timestamp) < ttl_seconds
    except Exception as e:
        print(f"[CACHE TIMESTAMP ERROR] {e}")
        return False

def upsert_player(puuid, name, tag, region, level=None, card_id=None, current_tier=None, current_tier_patched=None, peak_tier_patched=None, rr=None, peak_tier=None, peak_rr=None, elo=None, cache_key=None, cache_val=None):
    if not SUPABASE_URL or not SUPABASE_KEY or not puuid:
        return
        
    # Check if player already exists to preserve other elements of stats_cache
    existing = None
    params = {"puuid": f"eq.{puuid}"}
    r = supabase_request("GET", "players_cache", params=params)
    if r and r.status_code == 200:
        players = r.json()
        if players and len(players) > 0:
            existing = players[0]
            
    stats_cache = (existing.get("stats_cache") or {}) if existing else {}
    if cache_key and cache_val:
        stats_cache[cache_key] = cache_val
        
    payload = {
        "puuid": puuid,
        "name": name,
        "tag": tag,
        "region": region,
        "level": level if level is not None else (existing.get("level") if existing else None),
        "card_id": card_id if card_id is not None else (existing.get("card_id") if existing else None),
        "current_tier": current_tier if current_tier is not None else (existing.get("current_tier") if existing else 0),
        "current_tier_patched": current_tier_patched if current_tier_patched is not None else (existing.get("current_tier_patched") if existing else "Unranked"),
        "peak_tier_patched": peak_tier_patched if peak_tier_patched is not None else (existing.get("peak_tier_patched") if existing else "Unranked"),
        "rr": rr if rr is not None else (existing.get("rr") if existing else 0),
        "peak_tier": peak_tier if peak_tier is not None else (existing.get("peak_tier") if existing else 0),
        "peak_rr": peak_rr if peak_rr is not None else (existing.get("peak_rr") if existing else 0),
        "elo": elo if elo is not None else (existing.get("elo") if existing else 0),
        "stats_cache": stats_cache,
        "last_updated": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }
    
    headers = {"Prefer": "resolution=merge-duplicates"}
    supabase_request("POST", "players_cache", data=payload, headers=headers)

def compress_match_json(match_data):
    if not match_data:
        return {}
    
    # 1. Clean Metadata
    raw_meta = match_data.get("metadata", {}) or {}
    metadata = {
        "map": raw_meta.get("map"),
        "game_start": raw_meta.get("game_start") or raw_meta.get("gameStart"),
        "matchid": raw_meta.get("matchid") or raw_meta.get("match_id"),
        "mode": raw_meta.get("mode"),
        "queue": raw_meta.get("queue"),
        "season": raw_meta.get("season"),
        "rounds_played": raw_meta.get("rounds_played")
    }
    
    # 2. Clean Players
    players_data = match_data.get("players", {}) or {}
    all_players = []
    
    raw_players = []
    if isinstance(players_data, dict):
        raw_players = players_data.get("all_players", []) or players_data.get("allPlayers", [])
    elif isinstance(players_data, list):
        raw_players = players_data
        
    for p in raw_players:
        if not p: continue
        raw_stats = p.get("stats", {}) or {}
        stats = {
            "score": raw_stats.get("score"),
            "kills": raw_stats.get("kills"),
            "deaths": raw_stats.get("deaths"),
            "assists": raw_stats.get("assists"),
            "headshots": raw_stats.get("headshots"),
            "bodyshots": raw_stats.get("bodyshots"),
            "legshots": raw_stats.get("legshots")
        }
        all_players.append({
            "puuid": p.get("puuid"),
            "name": p.get("name"),
            "tag": p.get("tag"),
            "team": p.get("team"),
            "character": p.get("character") or p.get("agent", {}).get("name"),
            "currenttier": p.get("currenttier"),
            "currenttier_patched": p.get("currenttier_patched") or p.get("currenttierpatched"),
            "stats": stats
        })
        
    # 3. Clean Teams
    teams = {}
    raw_teams = match_data.get("teams", {}) or {}
    for team_color in ["red", "blue"]:
        t = raw_teams.get(team_color) or {}
        teams[team_color] = {
            "has_won": t.get("has_won") or t.get("hasWon"),
            "rounds_won": t.get("rounds_won") or t.get("roundsWon")
        }
        
    # 4. Clean Rounds (to fit green/red win dots under the free tier limit!)
    rounds = []
    raw_rounds = match_data.get("rounds", []) or []
    for r in raw_rounds:
        if not r: continue
        rounds.append({
            "winning_team": r.get("winning_team") or r.get("winningTeam")
        })
        
    return {
        "metadata": metadata,
        "players": {
            "all_players": all_players
        },
        "teams": teams,
        "rounds": rounds
    }


app = Flask(__name__, static_folder="public", static_url_path="")

# Allow dynamic CORS origins from environment variable or standard defaults
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
allowed_origins = [o.strip() for o in allowed_origins if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "https://valtracker-gg.onrender.com",
        "https://valtracker.gg",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ]
CORS(app, origins=allowed_origins)

# Enable high-performance HTTP Cache-Control header injection & on-the-fly Gzip compression
@app.after_request
def optimize_response(response):
    path = request.path.lower()
    
    # 1. Apply premium Caching Headers
    if path.startswith('/api/v3/meta-comps') or path.startswith('/api/v2/') or path.endswith('.json'):
        response.headers['Cache-Control'] = 'public, max-age=600' # 10 minutes
    elif path.endswith('.css') or path.endswith('.js'):
        # Client-side static assets are immutable and cache-busted, cache for 1 year
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    elif path.endswith('.html') or path.endswith('.svg') or path.endswith('.png') or path.endswith('.jpg'):
        response.headers['Cache-Control'] = 'public, max-age=86400' # 24 hours
        
    # 2. Apply on-the-fly Gzip compression to compressible text resources
    if response.status_code < 200 or response.status_code >= 300:
        return response
        
    accept_encoding = request.headers.get("Accept-Encoding", "")
    if "gzip" not in accept_encoding.lower():
        return response
        
    content_type = response.headers.get("Content-Type", "")
    compressible = [
        "text/html",
        "text/css",
        "application/javascript",
        "application/json",
        "text/javascript"
    ]
    is_compressible = False
    for mime in compressible:
        if mime in content_type:
            is_compressible = True
            break
            
    if not is_compressible:
        return response
        
    response.direct_passthrough = False
    data = response.get_data()
    
    # Don't compress very small responses
    if len(data) < 500:
        return response
        
    gzip_buffer = io.BytesIO()
    with gzip.GzipFile(mode="wb", fileobj=gzip_buffer) as gzip_file:
        gzip_file.write(data)
        
    response.set_data(gzip_buffer.getvalue())
    response.headers["Content-Encoding"] = "gzip"
    response.headers["Content-Length"] = len(response.get_data())
    response.headers["Vary"] = "Accept-Encoding"
    
    return response

# Simple custom zero-dependency in-memory rate limiter
rate_limit_records = {}

def rate_limit(requests_per_minute=30):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
            if "," in ip:
                ip = ip.split(",")[0].strip()
            
            # Bypass rate limiter for localhost and local network subnets to preserve dev stability
            if ip in ["127.0.0.1", "localhost", "::1"] or ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
                return f(*args, **kwargs)
            
            now = time.time()
            if ip not in rate_limit_records:
                rate_limit_records[ip] = []
            
            # Filter timestamps to keep only requests in the last 60 seconds
            rate_limit_records[ip] = [t for t in rate_limit_records[ip] if now - t < 60]
            
            if len(rate_limit_records[ip]) >= requests_per_minute:
                print(f"[RATE LIMIT] Blocked IP {ip} - exceeded {requests_per_minute}/min")
                return jsonify({
                    "status": 429,
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Maximum {requests_per_minute} requests per minute."
                }), 429
                
            rate_limit_records[ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Allowed endpoints for the HenrikDev API proxy
ALLOWED_PROXY_PREFIXES = [
    "v3/mmr/",
    "v3/matches/",
    "v1/account/",
    "v1/stored-mmr-history/",
    "v2/match/",
    "v1/leaderboard/"
]

# In-memory cache to prevent rate-limits and load data instantly
# Format: URL -> { "data": response_json, "timestamp": time_fetched }
cache = {}
CACHE_TTL = 60  # 1 minute caching — keeps data fresh between fetches

# In-memory player rank cache to respect HenrikDev API limits
# PUUID -> { "tier": tier_num, "tier_name": tier_name }
player_rank_cache = {}

AGENT_UUID_MAP = {
    "f29c42c6-418b-9f3c-a836-ab9f050c2962": "Jett",
    "85ca954a-41f2-bfd4-9d36-ab897212e1e2": "Reyna",
    "eb93336a-449b-9c1b-eb1a-9c87aa44efe6": "Phoenix",
    "bb2a482f-46e4-490e-8c8b-619d532851b9": "Neon",
    "9f0d7965-4f7d-ac01-53a2-92a11b94d6e6": "Viper",
    "a3a50cd3-417b-44a8-212e-ab310190738e": "Sage",
    "569fdd95-4d4b-ae83-ab13-ab993c123df0": "Sage",
    "1e58de9c-4950-5125-9345-ab08ae615a15": "Deadlock",
    "117ed9e3-49f3-6512-3ccf-00ad7c33d8b9": "Omen",
    "deddb639-4949-a7e5-4f7f-38a37f59d57a": "Breach",
    "320b2a48-4d9b-a075-30f1-1e93a9b63a23": "Sova",
    "1d2a13f4-402f-410b-1143-7f1544b368b6": "Killjoy",
    "ecc3b1de-40d3-1934-7d40-4f9c34d6ee31": "Clove",
    "707e2893-4724-034b-5c54-32a35c755a80": "Clove",
    "22697a3d-45bf-8dd7-4f4a-9a98e3295985": "Sova",
    "601dbbe7-43ce-be57-2a40-4bbc24365324": "Sage",
    "6f2a04ca-43e0-be94-ab12-ab7923485ab9": "Breach",
    "4102db2a-4685-3d5a-2802-f0a656d56d78": "Omen",
    "add95a50-415b-ac0f-2e55-8798e983416e": "Jett",
    "b527735d-415b-ac0f-2e55-8798e983416e": "Fade",
    "e33e1630-4dba-e366-be0c-ab9473b8ca7f": "Sova",
    "ade7735d-415b-ac0f-2e55-8798e983416e": "Sova",
    "4dbdf2ba-433b-e1f2-ab97-ab9927b38b93": "Vyse",
    "601dbbe7-43ce-be57-2a40-4bbc24365324": "Sage"
}

@app.route("/")
def index():
    resp = make_response(send_from_directory(app.static_folder, "index.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp

@app.errorhandler(404)
def page_not_found(e):
    resp = make_response(send_from_directory(app.static_folder, "404.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp, 404

@app.route("/api/feedback", methods=["POST"])
@rate_limit(requests_per_minute=20)
def submit_feedback():
    try:
        data = request.get_json() or {}
        feedback_text = data.get("feedback", "").strip()
        contact = data.get("contact", "").strip()
        
        if not feedback_text:
            return jsonify({"status": "error", "message": "Feedback content is empty"}), 400
            
        import json
        feedback_record = {
            "timestamp": datetime.now().isoformat(),
            "feedback": feedback_text,
            "contact": contact,
            "ip": request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
        }
        
        filepath = os.path.join(os.path.dirname(__file__), "feedback.json")
        records = []
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except:
                records = []
                
        records.append(feedback_record)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
            
        print(f"[FEEDBACK SUBMITTED] Successfully stored feedback from contact: {contact}")
        return jsonify({"status": "ok", "message": "Feedback submitted successfully! Thank you agent."})
    except Exception as e:
        print(f"[FEEDBACK ERROR] Failed to save feedback: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/admin/feedback", methods=["GET"])
def get_feedback():
    # Simple security token verification (configurable via environment variable)
    token = request.args.get("secret")
    expected_token = os.getenv("ADMIN_SECRET", "valtracker_admin_secret_2026")
    
    if not token or token != expected_token:
        print(f"[SECURITY] Unauthorized access attempt to get_feedback API prefix")
        return jsonify({"status": 403, "message": "Forbidden: Invalid or missing secret token"}), 403
        
    filepath = os.path.join(os.path.dirname(__file__), "feedback.json")
    if not os.path.exists(filepath):
        return jsonify([])
        
    try:
        import json
        with open(filepath, "r", encoding="utf-8") as f:
            records = json.load(f)
        return jsonify(records)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/clear-cache", methods=["POST"])
def clear_server_cache():
    cache.clear()
    return jsonify({"status": "ok", "message": "Server cache cleared"})

@app.route("/api/image")
@rate_limit(requests_per_minute=300)
def proxy_image():
    url = request.args.get("url")
    if not url:
        return "No url provided", 400
    try:
        import io
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.vlr.gg/'})
        return send_file(
            io.BytesIO(r.content),
            mimetype=r.headers.get('Content-Type', 'image/png')
        )
    except Exception as e:
        return str(e), 500

# --- PREMIUM SOCIAL FLEX CARD SHARING API ---
import uuid
import json

@app.route("/api/share-card", methods=["POST"])
def share_card_api():
    try:
        data = request.get_json() or {}
        image_data_url = data.get("image", "")
        player_name = data.get("playerName", "Unknown Player")
        player_tag = data.get("playerTag", "000")
        agent_name = data.get("agentName", "Unknown Agent")
        map_name = data.get("mapName", "Unknown Map")
        won = data.get("won", False)
        score = data.get("score", "0-0")
        
        if not image_data_url or not (image_data_url.startswith("data:image/png;base64,") or image_data_url.startswith("data:image/jpeg;base64,")):
            return jsonify({"status": "error", "message": "Invalid base64 image data"}), 400
            
        # Decode base64
        header, encoded = image_data_url.split(",", 1)
        ext = "jpg" if "image/jpeg" in header or "image/jpg" in header else "png"
        import base64
        binary_data = base64.b64decode(encoded)
        
        # Ensure shared directory exists
        shared_dir = os.path.join(app.static_folder, "shared")
        if not os.path.exists(shared_dir):
            os.makedirs(shared_dir, exist_ok=True)
            
        # Generate unique ID
        share_id = str(uuid.uuid4())[:8]
        filename = f"{share_id}.{ext}"
        filepath = os.path.join(shared_dir, filename)
        
        # Save PNG locally
        with open(filepath, "wb") as f:
            f.write(binary_data)
            
        # Save metadata to local metadata database
        meta_filepath = os.path.join(os.path.dirname(__file__), "shared_meta.json")
        meta_records = {}
        if os.path.exists(meta_filepath):
            try:
                with open(meta_filepath, "r", encoding="utf-8") as f:
                    meta_records = json.load(f)
            except:
                meta_records = {}
                
        meta_records[share_id] = {
            "playerName": player_name,
            "playerTag": player_tag,
            "agentName": agent_name,
            "mapName": map_name,
            "won": won,
            "score": score,
            "timestamp": time.time()
        }
        
        with open(meta_filepath, "w", encoding="utf-8") as f:
            json.dump(meta_records, f, indent=2, ensure_ascii=False)
            
        # Determine host url dynamically
        host_url = request.host_url
        
        return jsonify({
            "status": "ok",
            "share_id": share_id,
            "share_url": f"{host_url}share/{share_id}"
        })
    except Exception as e:
        print(f"[SHARE API ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/<path:subpath>", methods=["GET", "POST"])
@rate_limit(requests_per_minute=120)
def proxy_api(subpath):
    # Security check: Allowlist proxy paths to prevent open proxy exploitation
    allowed = False
    for prefix in ALLOWED_PROXY_PREFIXES:
        if subpath.startswith(prefix):
            allowed = True
            break
            
    if not allowed:
        print(f"[SECURITY] Blocked proxy request to unauthorized subpath: {subpath}")
        return jsonify({"status": 403, "errors": [{"message": "Forbidden: Path not allowed by API proxy"}]}), 403

    # 1. Extract Player Details & Interception Flags
    name, tag = extract_player_params(subpath)
    
    is_profile_route = False
    cache_key_type = None
    if name and tag and request.method == "GET":
        if subpath.startswith("v1/account/"):
            is_profile_route = True
            cache_key_type = "account"
        elif subpath.startswith("v3/mmr/"):
            is_profile_route = True
            cache_key_type = "mmr"
        elif subpath.startswith("v1/stored-mmr-history/"):
            is_profile_route = True
            cache_key_type = "stored_mmr_history"

    # 2. Database Caching Interception for Profiles (Sub-second reads)
    if is_profile_route:
        cached_player = get_cached_player(name, tag)
        if cached_player and is_player_fresh(cached_player, ttl_seconds=900): # 15 minutes TTL
            stats_cache = cached_player.get("stats_cache") or {}
            cached_data = stats_cache.get(cache_key_type)
            if cached_data:
                print(f"[DB CACHE HIT] Serving {cache_key_type} for {name}#{tag} instantly from Supabase!")
                return jsonify(cached_data)

    # 3. Database Caching & Merging Interception for Matches
    is_matches_route = False
    if name and tag and request.method == "GET" and subpath.startswith("v3/matches/"):
        is_matches_route = True

    if is_matches_route:
        # A. Check memory cache first to prevent redundant slow API fetches
        encoded_subpath = urllib.parse.quote(subpath, safe='/')
        target_url = f"https://api.henrikdev.xyz/valorant/{encoded_subpath}"
        bypass_cache = "true" in request.args.get("_nocache", "").lower() or len(request.args.get("_nocache", "")) > 0
        
        # Build normalized memory cache key
        params_cache = request.args.to_dict()
        params_cache.pop('_nocache', None)
        qs = urllib.parse.urlencode(sorted(params_cache.items()))
        cache_key = f"{target_url}?{qs}" if qs else target_url
        
        if not bypass_cache and cache_key in cache:
            cache_entry = cache[cache_key]
            if time.time() - cache_entry["timestamp"] < CACHE_TTL:
                print(f"[MEMORY CACHE HIT] Serving matches for {name}#{tag} instantly from memory cache!")
                return jsonify(cache_entry["data"])

        params = request.args.to_dict()
        params.pop('_nocache', None)
        mode = params.get("mode", "competitive").lower()
        
        # A. Fetch latest 20 matches from HenrikDev API
        live_matches_data = None
        try:
            print(f"[MATCH INTERCEPT] Fetching live matches for {name}#{tag} from HenrikDev...")
            encoded_subpath = urllib.parse.quote(subpath, safe='/')
            target_url = f"https://api.henrikdev.xyz/valorant/{encoded_subpath}"
            headers = {
                "Authorization": API_KEY,
                "Content-Type": "application/json"
            }
            response = requests.get(target_url, headers=headers, params=params, timeout=8)
            if response.status_code == 200:
                live_matches_data = response.json()
        except Exception as e:
            print(f"[MATCH INTERCEPT ERROR] Failed to fetch live matches: {e}")
            
        # B. Resolve player PUUID
        puuid = None
        cached_player = get_cached_player(name, tag)
        if cached_player:
            puuid = cached_player.get("puuid")
            
        # Fallback: Extract PUUID from live matches list if not in players_cache yet
        if not puuid and live_matches_data and isinstance(live_matches_data.get("data"), list):
            for m in live_matches_data["data"]:
                if not m: continue
                players = m.get("players", {})
                raw_players = []
                if isinstance(players, dict):
                    raw_players = players.get("all_players", []) or players.get("allPlayers", [])
                elif isinstance(players, list):
                    raw_players = players
                for p in raw_players:
                    if p.get("name", "").lower() == name.lower() and p.get("tag", "").lower() == tag.lower():
                        puuid = p.get("puuid")
                        break
                if puuid:
                    break
            
            # If resolved, cache this minimal player entry
            if puuid:
                region = subpath.split("/")[2] if len(subpath.split("/")) >= 3 else "ap"
                upsert_player(puuid, name, tag, region)

        # C. Compress & archive matches into matches_cache
        if puuid and live_matches_data and isinstance(live_matches_data.get("data"), list):
            for m in live_matches_data["data"]:
                if not m: continue
                match_id = m.get("metadata", {}).get("matchid") or m.get("metadata", {}).get("match_id")
                if not match_id: continue
                
                # Locate player stats in this match
                me = None
                players = m.get("players", {})
                raw_players = []
                if isinstance(players, dict):
                    raw_players = players.get("all_players", []) or players.get("allPlayers", [])
                elif isinstance(players, list):
                    raw_players = players
                for p in raw_players:
                    if p.get("puuid") == puuid or (p.get("name", "").lower() == name.lower() and p.get("tag", "").lower() == tag.lower()):
                        me = p
                        break
                        
                if me:
                    map_name = m.get("metadata", {}).get("map", "Unknown")
                    game_start = m.get("metadata", {}).get("game_start") or m.get("metadata", {}).get("gameStart") or int(time.time())
                    agent_name = me.get("character") or me.get("agent", {}).get("name", "Unknown")
                    kills = me.get("stats", {}).get("kills", 0)
                    deaths = me.get("stats", {}).get("deaths", 0)
                    assists = me.get("stats", {}).get("assists", 0)
                    score = me.get("stats", {}).get("score", 0)
                    team = me.get("team", "Red")
                    
                    my_team_color = team.lower()
                    opp_team_color = "blue" if my_team_color == "red" else "red"
                    raw_teams = m.get("teams", {}) or {}
                    
                    my_team_info = raw_teams.get(my_team_color) or {}
                    opp_team_info = raw_teams.get(opp_team_color) or {}
                    
                    won = my_team_info.get("has_won") or my_team_info.get("hasWon") or False
                    if won is None:
                        my_rounds = my_team_info.get("rounds_won") or my_team_info.get("roundsWon") or 0
                        opp_rounds = opp_team_info.get("rounds_won") or opp_team_info.get("roundsWon") or 0
                        won = my_rounds > opp_rounds
                        
                    rounds_str = f"{my_team_info.get('rounds_won', 0) or my_team_info.get('roundsWon', 0)}-{opp_team_info.get('rounds_won', 0) or opp_team_info.get('roundsWon', 0)}"
                    stripped_raw_match = compress_match_json(m)
                    
                    match_payload = {
                        "puuid": puuid,
                        "match_id": match_id,
                        "mode": mode,
                        "map_name": map_name,
                        "game_start": game_start,
                        "agent_name": agent_name,
                        "kills": kills,
                        "deaths": deaths,
                        "assists": assists,
                        "score": score,
                        "won": won,
                        "team": team,
                        "rounds_summary": rounds_str,
                        "stripped_raw_match": stripped_raw_match
                    }
                    supabase_request("POST", "matches_cache", data=match_payload, headers={"Prefer": "resolution=merge-duplicates"})

        # D. Fetch all archived matches from the database
        db_matches = []
        if puuid:
            params_db = {
                "puuid": f"eq.{puuid}",
                "mode": f"eq.{mode}",
                "order": "game_start.desc",
                "limit": "100"
            }
            r_db = supabase_request("GET", "matches_cache", params=params_db)
            if r_db and r_db.status_code == 200:
                rows = r_db.json()
                db_matches = [row["stripped_raw_match"] for row in rows if "stripped_raw_match" in row]

        # E. Merge & Deduplicate
        merged_map = {}
        for dm in db_matches:
            m_id = dm.get("metadata", {}).get("matchid") or dm.get("metadata", {}).get("match_id")
            if m_id:
                merged_map[m_id] = dm
                
        if live_matches_data and isinstance(live_matches_data.get("data"), list):
            for lm in live_matches_data["data"]:
                m_id = lm.get("metadata", {}).get("matchid") or lm.get("metadata", {}).get("match_id")
                if m_id:
                    merged_map[m_id] = compress_match_json(lm)
                    
        def get_game_start(m_obj):
            meta = m_obj.get("metadata", {})
            return int(meta.get("game_start") or meta.get("gameStart") or 0)
            
        merged_list = list(merged_map.values())
        merged_list.sort(key=get_game_start, reverse=True)
        
        if merged_list:
            print(f"[MERGE SUCCESS] Serving {len(merged_list)} matches (live + archive) for {name}#{tag}!")
            res_data = {"status": 200, "data": merged_list}
            if not bypass_cache:
                cache[cache_key] = {
                    "data": res_data,
                    "timestamp": time.time()
                }
            return jsonify(res_data)
        elif live_matches_data:
            if not bypass_cache:
                cache[cache_key] = {
                    "data": live_matches_data,
                    "timestamp": time.time()
                }
            return jsonify(live_matches_data)

    # Fallback to standard memory caching if database is offline/unconfigured
    encoded_subpath = urllib.parse.quote(subpath, safe='/')
    target_url = f"https://api.henrikdev.xyz/valorant/{encoded_subpath}"
    cache_key = f"{target_url}?{request.query_string.decode('utf-8')}"
    
    # Immutable historic match details can be cached in memory for 24 hours (86400s) to maximize speeds
    is_detail_route = subpath.startswith("v2/match/") or subpath.startswith("v3/match/")
    detail_ttl = 86400  # 24 hours
    
    if request.method == "GET" and cache_key in cache:
        cache_entry = cache[cache_key]
        ttl = detail_ttl if is_detail_route else CACHE_TTL
        if time.time() - cache_entry["timestamp"] < ttl:
            print(f"[CACHE HIT] Serving detailed match {subpath} instantly from memory cache!")
            return jsonify(cache_entry["data"])
            
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }
    
    params = request.args.to_dict()
    params.pop('_nocache', None)
    
    try:
        print(f"[{request.method}] Fetching from {target_url}")
        if request.method == "GET":
            response = requests.get(target_url, headers=headers, params=params)
        else:
            response = requests.post(target_url, headers=headers, json=request.json)
        
        if response.status_code != 200:
            try:
                err_data = response.json()
            except:
                err_data = {"status": response.status_code, "error": "Unknown API error"}
            return jsonify(err_data), response.status_code
            
        data = response.json()
        
        # Save to database cache if successful GET on a profile route
        if response.status_code == 200 and request.method == "GET" and is_profile_route:
            try:
                if cache_key_type == "account":
                    a = data.get("data", {})
                    puuid = a.get("puuid")
                    p_name = a.get("name")
                    p_tag = a.get("tag")
                    p_region = a.get("region") or subpath.split("/")[2] if len(subpath.split("/")) >= 3 else "ap"
                    p_level = a.get("account_level")
                    p_card_id = a.get("card", {}).get("id") or (a.get("card") if isinstance(a.get("card"), str) else None)
                    if puuid:
                        print(f"[WRITE THROUGH] Caching account details for {p_name}#{p_tag} to database...")
                        upsert_player(puuid, p_name, p_tag, p_region, level=p_level, card_id=p_card_id, cache_key="account", cache_val=data)
                elif cache_key_type == "mmr":
                    d = data.get("data", {})
                    puuid = d.get("puuid")
                    p_name = d.get("name")
                    p_tag = d.get("tag")
                    p_region = subpath.split("/")[2] if len(subpath.split("/")) >= 3 else "ap"
                    current_tier = d.get("current", {}).get("tier", {}).get("id", 0)
                    current_tier_patched = d.get("current", {}).get("tier", {}).get("name", "Unranked")
                    peak_tier_patched = d.get("peak", {}).get("tier", {}).get("name", "Unranked")
                    peak_tier = d.get("peak", {}).get("tier", {}).get("id", 0)
                    rr = d.get("current", {}).get("rr", 0)
                    elo = d.get("current", {}).get("elo", 0)
                    if puuid:
                        print(f"[WRITE THROUGH] Caching MMR details for {p_name}#{p_tag} to database...")
                        upsert_player(puuid, p_name, p_tag, p_region, current_tier=current_tier, current_tier_patched=current_tier_patched, peak_tier_patched=peak_tier_patched, peak_tier=peak_tier, rr=rr, elo=elo, cache_key="mmr", cache_val=data)
                elif cache_key_type == "stored_mmr_history":
                    cached_p = get_cached_player(name, tag)
                    if cached_p:
                        puuid = cached_p.get("puuid")
                        p_region = subpath.split("/")[2] if len(subpath.split("/")) >= 3 else "ap"
                        print(f"[WRITE THROUGH] Caching MMR stored history for {name}#{tag} to database...")
                        upsert_player(puuid, name, tag, p_region, cache_key="stored_mmr_history", cache_val=data)
            except Exception as e_write:
                print(f"[WRITE THROUGH ERROR] Failed to cache profile: {e_write}")

        # Save to memory cache
        if response.status_code == 200 and request.method == "GET":
            cache[cache_key] = {
                "data": data,
                "timestamp": time.time()
            }
            
        return jsonify(data), response.status_code
    except Exception as e:
        print(f"[ERROR] Proxy API failure: {e}")
        return jsonify({"status": 500, "errors": [{"message": "Internal server error"}]}), 500


# --- ESPORTS ROUTES ---

def parse_vlr_time(date_str, time_str, eta_str=""):
    import datetime
    if eta_str:
        try:
            eta_lower = eta_str.lower()
            if 'live' in eta_lower:
                return datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            hours = 0
            minutes = 0
            days = 0
            
            parts = eta_lower.replace('upcoming', '').replace('completed', '').strip().split()
            for p in parts:
                if 'd' in p:
                    days = int(p.replace('d', ''))
                elif 'h' in p:
                    hours = int(p.replace('h', ''))
                elif 'm' in p:
                    minutes = int(p.replace('m', ''))
                    
            if days or hours or minutes:
                delta = datetime.timedelta(days=days, hours=hours, minutes=minutes)
                if 'completed' in eta_lower:
                    utc_time = datetime.datetime.now(datetime.timezone.utc) - delta
                else:
                    utc_time = datetime.datetime.now(datetime.timezone.utc) + delta
                return utc_time.isoformat()
        except:
            pass

    if time_str == "TBD" or not time_str:
        return f"{date_str} {time_str}"
    try:
        now = datetime.datetime.now()
        time_clean = time_str.replace(" ET", "").strip()
        
        if "Today" in date_str:
            dt_date = now.date()
            date_clean = dt_date.strftime("%b %d, %Y")
        elif "Tomorrow" in date_str:
            dt_date = now.date() + datetime.timedelta(days=1)
            date_clean = dt_date.strftime("%b %d, %Y")
        elif "Yesterday" in date_str:
            dt_date = now.date() - datetime.timedelta(days=1)
            date_clean = dt_date.strftime("%b %d, %Y")
        else:
            clean_date = date_str.split(',')[1].strip() if ',' in date_str else date_str.strip()
            date_clean = f"{clean_date}, {now.year}"
            
        return f"{date_clean} {time_clean}"
    except Exception as e:
        return f"{date_str} {time_str}"

def scrape_vlr_matches():
    import re
    import json
    from bs4 import BeautifulSoup
    cache_key = "vlr_scraped_matches"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 600:
        return cache[cache_key]["data"]
        
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        r = requests.get('https://www.vlr.gg/matches', headers=headers, timeout=10)
        if r.status_code != 200:
            if cache_key in cache:
                print("[VLR MATCHES CLOUDFLARE FALLBACK] Serving expired memory cache.")
                return cache[cache_key]["data"]
            try:
                with open("vlr_matches_backup.json", "r", encoding="utf-8") as f:
                    print("[VLR MATCHES PERSISTENT FALLBACK] Serving VLR matches backup file.")
                    backup_data = json.load(f)
                    cache[cache_key] = {"data": backup_data, "timestamp": time.time()}
                    return backup_data
            except Exception as e_back:
                print("Failed to load matches backup:", e_back)
            return []
            
        soup = BeautifulSoup(r.text, 'html.parser')
        matches = []
        cards = soup.find_all('div', class_='wf-card')
        current_date = "Today"
        
        for card in cards:
            date_el = card.find_previous_sibling('div', class_='wf-label')
            if date_el and 'mod-large' in date_el.get('class', []):
                current_date = date_el.text.strip()
                
            match_items = card.find_all('a', class_='match-item')
            for item in match_items:
                href = item.get('href', '')
                match_id = re.search(r'/(\d+)/', href)
                match_id = match_id.group(1) if match_id else href
                
                time_el = item.find('div', class_='match-item-time')
                time_str = time_el.text.strip() if time_el else "00:00"
                
                teams_divs = item.find_all('div', class_='match-item-vs-team')
                teams_data = []
                for t_div in teams_divs:
                    name_el = t_div.find('div', class_='text-of')
                    name = name_el.text.strip() if name_el else "TBD"
                    
                    score_el = t_div.find('div', class_='match-item-vs-team-score')
                    score_str = score_el.text.strip() if score_el else "0"
                    try:
                        score = int(score_str)
                    except ValueError:
                        score = 0
                    
                    teams_data.append({
                        "name": name,
                        "game_wins": score,
                        "has_won": False
                    })
                
                if len(teams_data) < 2:
                    teams_data = [{"name": "TBD", "game_wins": 0, "has_won": False}, {"name": "TBD", "game_wins": 0, "has_won": False}]
                    
                eta_el = item.find('div', class_='match-item-eta')
                status_text = eta_el.text.strip().upper() if eta_el else "UPCOMING"
                
                date_meta = parse_vlr_time(current_date, time_str, status_text)
                
                state = "unstarted"
                if "LIVE" in status_text:
                    state = "in_progress"
                elif "FINAL" in status_text or "COMPLETED" in status_text:
                    state = "completed"
                    
                if state == "completed":
                    s1 = teams_data[0]["game_wins"]
                    s2 = teams_data[1]["game_wins"]
                    if s1 > s2:
                        teams_data[0]["has_won"] = True
                    elif s2 > s1:
                        teams_data[1]["has_won"] = True
                        
                event_el = item.find('div', class_='match-item-event')
                event_name = "VCT"
                stage_name = ""
                if event_el:
                    parts = [p.strip() for p in event_el.text.strip().split('\n') if p.strip()]
                    stage_name = parts[0] if len(parts) >= 1 else ""
                    event_name = parts[1] if len(parts) >= 2 else stage_name
                    
                matches.append({
                    "id": match_id,
                    "date": date_meta,
                    "state": state,
                    "vlr_path": href,
                    "league": {
                        "name": event_name,
                        "region": stage_name
                    },
                    "match": {
                        "id": match_id,
                        "teams": teams_data
                    },
                    "vod": None
                })
        try:
            with open("vlr_matches_backup.json", "w", encoding="utf-8") as f:
                json.dump(matches, f, indent=2)
        except Exception as ef:
            print("Failed to save matches backup file:", ef)
            
        cache[cache_key] = {"data": matches, "timestamp": time.time()}
        return matches
    except Exception as e:
        print("[ERROR] fetch_vlr_matches failed:", e)
        if cache_key in cache:
            print("[VLR MATCHES MEMORY FALLBACK] Serving expired memory cache.")
            return cache[cache_key]["data"]
        try:
            with open("vlr_matches_backup.json", "r", encoding="utf-8") as f:
                print("[VLR MATCHES PERSISTENT FALLBACK] Serving VLR matches backup file.")
                backup_data = json.load(f)
                cache[cache_key] = {"data": backup_data, "timestamp": time.time()}
                return backup_data
        except Exception as e_back:
            print("Failed to load matches backup:", e_back)
        return []

def scrape_vlr_results():
    import re
    import json
    from bs4 import BeautifulSoup
    cache_key = "vlr_scraped_results"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 600:
        return cache[cache_key]["data"]
        
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        r = requests.get('https://www.vlr.gg/matches/results', headers=headers, timeout=10)
        if r.status_code != 200:
            if cache_key in cache:
                print("[VLR RESULTS CLOUDFLARE FALLBACK] Serving expired memory cache.")
                return cache[cache_key]["data"]
            try:
                with open("vlr_results_backup.json", "r", encoding="utf-8") as f:
                    print("[VLR RESULTS PERSISTENT FALLBACK] Serving VLR results backup file.")
                    backup_data = json.load(f)
                    cache[cache_key] = {"data": backup_data, "timestamp": time.time()}
                    return backup_data
            except Exception as e_back:
                print("Failed to load results backup:", e_back)
            return []
            
        soup = BeautifulSoup(r.text, 'html.parser')
        matches = []
        cards = soup.find_all('div', class_='wf-card')
        current_date = "Recent"
        
        for card in cards:
            date_el = card.find_previous_sibling('div', class_='wf-label')
            if date_el and 'mod-large' in date_el.get('class', []):
                current_date = date_el.text.strip()
                
            match_items = card.find_all('a', class_='match-item')
            for item in match_items:
                href = item.get('href', '')
                match_id = re.search(r'/(\d+)/', href)
                match_id = match_id.group(1) if match_id else href
                
                time_el = item.find('div', class_='match-item-time')
                time_str = time_el.text.strip() if time_el else "00:00"
                if time_str and "TBD" not in time_str.upper() and "ET" not in time_str:
                    time_str += " ET"
                
                teams_divs = item.find_all('div', class_='match-item-vs-team')
                teams_data = []
                for t_div in teams_divs:
                    name_el = t_div.find('div', class_='text-of')
                    name = name_el.text.strip() if name_el else "TBD"
                    
                    score_el = t_div.find('div', class_='match-item-vs-team-score')
                    score_str = score_el.text.strip() if score_el else "0"
                    try:
                        score = int(score_str)
                    except ValueError:
                        score = 0
                    
                    teams_data.append({
                        "name": name,
                        "game_wins": score,
                        "has_won": False
                    })
                
                if len(teams_data) < 2:
                    continue
                    
                state = "completed"
                s1 = teams_data[0]["game_wins"]
                s2 = teams_data[1]["game_wins"]
                if s1 > s2:
                    teams_data[0]["has_won"] = True
                elif s2 > s1:
                    teams_data[1]["has_won"] = True
                    
                event_el = item.find('div', class_='match-item-event')
                event_name = "VCT"
                stage_name = ""
                if event_el:
                    parts = [p.strip() for p in event_el.text.strip().split('\n') if p.strip()]
                    stage_name = parts[0] if len(parts) >= 1 else ""
                    event_name = parts[1] if len(parts) >= 2 else stage_name
                    
                eta_el = item.find('div', class_='match-item-eta')
                status_text = eta_el.text.strip().upper() if eta_el else "COMPLETED"
                date_meta = parse_vlr_time(current_date, time_str, status_text)
                
                matches.append({
                    "id": match_id,
                    "date": date_meta,
                    "state": state,
                    "vlr_path": href,
                    "league": {
                        "name": event_name,
                        "region": stage_name
                    },
                    "match": {
                        "id": match_id,
                        "teams": teams_data
                    },
                    "vod": None
                })
        try:
            with open("vlr_results_backup.json", "w", encoding="utf-8") as f:
                json.dump(matches, f, indent=2)
        except Exception as ef:
            print("Failed to save results backup file:", ef)
            
        cache[cache_key] = {"data": matches, "timestamp": time.time()}
        return matches
    except Exception as e:
        print("[ERROR] fetch_vlr_results failed:", e)
        if cache_key in cache:
            print("[VLR RESULTS MEMORY FALLBACK] Serving expired memory cache.")
            return cache[cache_key]["data"]
        try:
            with open("vlr_results_backup.json", "r", encoding="utf-8") as f:
                print("[VLR RESULTS PERSISTENT FALLBACK] Serving VLR results backup file.")
                backup_data = json.load(f)
                cache[cache_key] = {"data": backup_data, "timestamp": time.time()}
                return backup_data
        except Exception as e_back:
            print("Failed to load results backup:", e_back)
        return []

@app.route("/api/esports/live")
@rate_limit(requests_per_minute=30)
def esports_live():
    data = scrape_vlr_matches()
    live = [m for m in data if m.get("state") in ("in_progress", "inProgress")]
    return jsonify({"data": live})

@app.route("/api/esports/results")
@rate_limit(requests_per_minute=30)
def esports_results():
    results = scrape_vlr_results()
    return jsonify({"data": results})

@app.route("/api/esports/upcoming")
@rate_limit(requests_per_minute=30)
def esports_upcoming():
    data = scrape_vlr_matches()
    upcoming = [m for m in data if m.get("state") == "unstarted"]
    return jsonify({"data": upcoming})

@app.route("/api/esports/news")
@rate_limit(requests_per_minute=30)
def esports_news():
    cache_key = "vlr_news"
    # Serve cached news if it's less than 24 hours old
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 86400:
        return jsonify({"data": cache[cache_key]["data"]})
        
    news_items = []
    
    # 1. Try local BeautifulSoup scraper FIRST (extremely fast and reliable locally)
    try:
        print("[INFO] Attempting local BeautifulSoup scraping for VLR news...")
        from bs4 import BeautifulSoup
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        r = requests.get('https://www.vlr.gg/news', headers=headers, timeout=6)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            items = soup.find_all('a', class_='wf-module-item')
            if items:
                for item in items[:15]:
                    title_el = item.find('div', style=lambda v: v and 'font-weight: 700' in v)
                    desc_el = item.find('div', style=lambda v: v and 'font-size: 13px' in v)
                    date_author_el = item.find('div', class_='ge-text-light')
                    
                    if title_el:
                        description = desc_el.text.strip() if desc_el else ""
                        raw_txt = date_author_el.text.strip() if date_author_el else "Recent"
                        raw_txt = raw_txt.replace('\n', ' ').replace('\t', ' ')
                        
                        parts = [p.strip() for p in raw_txt.split('by') if p.strip()]
                        date_str = "Recent"
                        author_str = "VLR.gg"
                        if len(parts) >= 1:
                            date_str = parts[0].strip(' \u2022\u00a0\u2014-')
                            author_str = parts[1].strip() if len(parts) > 1 else "VLR.gg"
                        
                        news_items.append({
                            "title": title_el.text.strip(),
                            "description": description,
                            "date": date_str,
                            "author": author_str,
                            "url_path": item.get('href', '')
                        })
                if news_items:
                    try:
                        import json
                        with open("vlr_news_backup.json", "w", encoding="utf-8") as f:
                            json.dump(news_items, f, indent=2)
                    except Exception as ef:
                        print("Failed to save news backup:", ef)
                    cache[cache_key] = {"data": news_items, "timestamp": time.time()}
                    print(f"[SUCCESS] Esports News successfully scraped {len(news_items)} items from VLR.gg directly.")
                    return jsonify({"data": news_items})
    except Exception as e:
        print("[WARNING] Local VLR scraper failed:", e)
        
    # 2. Try public unauthenticated edge API as fallback
    try:
        print("[INFO] News scraper fallback: Attempting to fetch from public vlrggapi...")
        r = requests.get('https://vlrggapi.vercel.app/news', timeout=5)
        if r.status_code == 200:
            data = r.json()
            segments = data.get('data', {}).get('segments', [])
            if segments:
                news_items = []
                for s in segments[:15]:
                    url = s.get('url_path', '') or s.get('url', '')
                    url_path = url.replace('https://www.vlr.gg', '').replace('http://www.vlr.gg', '').replace('https://vlr.gg', '').replace('http://vlr.gg', '')
                    news_items.append({
                        "title": s.get('title', '').strip(),
                        "description": s.get('description', '').strip(),
                        "date": s.get('date', '').strip(),
                        "author": s.get('author', '').strip(),
                        "url_path": url_path
                    })
                if news_items:
                    try:
                        import json
                        with open("vlr_news_backup.json", "w", encoding="utf-8") as f:
                            json.dump(news_items, f, indent=2)
                    except Exception as ef:
                        print("Failed to save news backup:", ef)
                    cache[cache_key] = {"data": news_items, "timestamp": time.time()}
                    print(f"[SUCCESS] Esports News successfully fetched {len(news_items)} items from vlrggapi backup.")
                    return jsonify({"data": news_items})
    except Exception as e:
        print("[WARNING] Backup public vlrggapi news fetch failed:", e)
        
    # 3. Emergency Cache Fallback: If both fail, return cached news regardless of age
    if cache_key in cache:
        print("[INFO] Returning expired VLR news cache as emergency fallback.")
        return jsonify({"data": cache[cache_key]["data"]})
        
    # 3.5. Persistent Backup File Fallback
    try:
        import json
        with open("vlr_news_backup.json", "r", encoding="utf-8") as f:
            print("[VLR NEWS PERSISTENT FALLBACK] Serving VLR news backup file.")
            backup_news = json.load(f)
            cache[cache_key] = {"data": backup_news, "timestamp": time.time()}
            return jsonify({"data": backup_news})
    except Exception as e_back:
        print("Failed to load news backup file:", e_back)
        
    # 4. Offline Mock News Fallback
    mock_news = [
        {
            "title": "VCT Masters London: Qualifiers and Contenders locked in",
            "description": "With Stage 1 concluding across all regions, the 12 teams representing Pacific, Americas, EMEA, and China are set for the London LAN.",
            "date": "1 day ago",
            "author": "ValTracker News",
            "url_path": ""
        },
        {
            "title": "Nongshim RedForce make history as first Ascended team to win Masters",
            "description": "After a phenomenal deep run in Chile, the ascended squad swept Paper Rex in the grand final to lift the Masters Santiago trophy.",
            "date": "2 days ago",
            "author": "ValTracker News",
            "url_path": ""
        },
        {
            "title": "VCT pacific franchise teams list updated for 2026 season",
            "description": "Full Sense joins as partner team for 2026, alongside Nongshim RedForce and Varrel as ascended contenders.",
            "date": "3 days ago",
            "author": "ValTracker News",
            "url_path": ""
        }
    ]
    print("[INFO] Returning offline mock news headlines.")
    return jsonify({"data": mock_news})


@app.route("/api/esports/standings/<region>")
@rate_limit(requests_per_minute=30)
def esports_standings(region):
    import re
    cache_key = f"vlr_standings_{region}"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 3600:
        return jsonify({"data": cache[cache_key]["data"]})
        
    try:
        from bs4 import BeautifulSoup
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        url_region = region
        if region == "all": url_region = "north-america"
        elif region == "na": url_region = "north-america"
        elif region == "eu": url_region = "europe"
        elif region == "ap": url_region = "asia-pacific"
        elif region == "la": url_region = "latin-america"
        elif region == "mn": url_region = "china"
        
        r = requests.get(f'https://www.vlr.gg/rankings/{url_region}', headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        standings = []
        rank_items = soup.find_all('div', class_='rank-item')
        
        for item in rank_items[:50]: # top 50
            rank_el = item.find('div', class_='rank-item-rank-num')
            rank_num = rank_el.text.strip() if rank_el else "1"
            
            team_a = item.find('a', class_='rank-item-team')
            if not team_a:
                continue
                
            team_name = ""
            ge_text_el = team_a.find('div', class_='ge-text')
            if ge_text_el:
                texts = [t for t in ge_text_el.find_all(text=True, recursive=False) if t.strip()]
                team_name = texts[0].strip() if texts else ge_text_el.text.strip()
                team_name = team_name.split('#')[0].strip()
                
            img_el = team_a.find('img')
            logo_url = ""
            if img_el and img_el.get('src'):
                src = img_el.get('src')
                logo_url = "https:" + src if src.startswith('//') else src
                
            country_el = team_a.find('div', class_='rank-item-team-country')
            country = country_el.text.strip() if country_el else region.upper()
            
            rating_el = item.find('div', class_='rank-item-rating')
            rating_str = "1000"
            if rating_el:
                rating_str = rating_el.text.strip()
                rating_str = [r.strip() for r in rating_str.split('\n') if r.strip()][0]
                
            streak_el = item.find('div', class_='rank-item-streak')
            streak = streak_el.text.strip() if streak_el else "-"
            
            record_el = item.find('div', class_='rank-item-record')
            wins, losses = 0, 0
            if record_el:
                rec_txt = record_el.text.strip()
                digits = re.findall(r'\d+', rec_txt)
                if len(digits) >= 2:
                    wins = int(digits[0])
                    losses = int(digits[1])
            
            standings.append({
                "rank": int(rank_num) if rank_num.isdigit() else 1,
                "team": team_name,
                "logo": logo_url,
                "country": country,
                "rating": rating_str,
                "wins": wins,
                "losses": losses,
                "streak": streak
            })
            
        if standings:
            cache[cache_key] = {"data": standings, "timestamp": time.time()}
        return jsonify({"data": standings})
    except Exception as e:
        print(f"[ERROR] Esports Standings fetch failed:", e)
        return jsonify({"error": "Internal server error", "data": []}), 500

@app.route("/api/esports/event/<event_id>")
@rate_limit(requests_per_minute=30)
def esports_event_teams(event_id):
    cache_key = f"vlr_event_teams_{event_id}"
    if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < 86400:
        return jsonify({"data": cache[cache_key]["data"]})
        
    try:
        from bs4 import BeautifulSoup
        import re
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        r = requests.get(f'https://www.vlr.gg/event/{event_id}', headers=headers, timeout=10)
        if r.status_code != 200:
            return jsonify({"error": "Failed to load VLR event page", "data": []}), 500
            
        soup = BeautifulSoup(r.text, 'html.parser')
        teams = []
        seen_ids = set()
        
        for a in soup.find_all('a'):
            href = a.get('href', '')
            if '/team/' in href:
                match = re.search(r'/team/(\d+)/([^/]+)', href)
                if match:
                    team_id = match.group(1)
                    team_slug = match.group(2)
                    
                    team_name = a.text.strip().split('\n')[0].strip()
                    if not team_name or team_id in seen_ids:
                        continue
                        
                    seen_ids.add(team_id)
                    
                    img_el = a.find('img')
                    logo_url = ""
                    if img_el and img_el.get('src'):
                        src = img_el.get('src')
                        if src.startswith('//'):
                            logo_url = "https:" + src
                        elif src.startswith('/'):
                            logo_url = "https://www.vlr.gg" + src
                        else:
                            logo_url = src
                        
                    local_id = team_slug.replace('-', '_')
                    if "paper_rex" in local_id: local_id = "paper_rex"
                    elif "sentinels" in local_id: local_id = "sentinels"
                    elif "gen_g" in local_id: local_id = "gen_g"
                    elif "fnatic" in local_id: local_id = "fnatic"
                    elif "edward_gaming" in local_id or "edg" in local_id: local_id = "edg"
                    elif "drx" in local_id: local_id = "drx"
                    elif "global_esports" in local_id or "ge" in local_id: local_id = "global_esports"
                    elif "team_secret" in local_id: local_id = "team_secret"
                    elif "detonation" in local_id: local_id = "detonation_focusme"
                    elif "full_sense" in local_id: local_id = "full_sense"
                    elif "varrel" in local_id: local_id = "varrel"
                    elif "zeta" in local_id: local_id = "zeta_division"
                    elif "g2" in local_id: local_id = "g2_esports"
                    elif "leviatan" in local_id: local_id = "leviatan"
                    elif "heretics" in local_id: local_id = "team_heretics"
                    
                    teams.append({
                        "id": team_id,
                        "name": team_name,
                        "slug": team_slug,
                        "logo": logo_url,
                        "local_id": local_id
                    })
                    
        if teams:
            cache[cache_key] = {"data": teams, "timestamp": time.time()}
        return jsonify({"data": teams})
    except Exception as e:
        print("[ERROR] Esports Event Teams fetch failed:", e)
        return jsonify({"error": "Internal server error", "data": []}), 500

@app.route("/api/store/featured")
@rate_limit(requests_per_minute=30)
def store_featured():
    import json
    backup_file = "store_featured_backup.json"
    cache_duration = 86400  # 24 hours in seconds

    def bundles_have_expired(data):
        """Return True if any bundle in the cached data has 0 or negative seconds_remaining."""
        try:
            bundles = data.get("data", [])
            if not bundles:
                return False
            for b in bundles:
                secs = b.get("seconds_remaining", 1)
                if secs is not None and secs <= 0:
                    return True
            return False
        except Exception:
            return False

    # 0. Serve from in-memory cache if available and not expired
    mem_store = cache.get("store_featured")
    if mem_store:
        mem_age = time.time() - mem_store.get("timestamp", 0)
        if mem_age < cache_duration and not bundles_have_expired(mem_store.get("data", {})):
            return jsonify(mem_store["data"])

    # 1. Serve from fresh persistent file cache if available and bundles haven't expired
    if os.path.exists(backup_file):
        try:
            file_age = time.time() - os.path.getmtime(backup_file)
            if file_age < cache_duration:
                with open(backup_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # If bundles have expired (countdown hit 0), bust cache and refetch
                if bundles_have_expired(data):
                    print("[STORE] Cached bundles have expired — busting cache and refetching.")
                else:
                    cache["store_featured"] = {"data": data, "timestamp": time.time()}
                    return jsonify(data)
        except Exception as e:
            print("[WARNING] Failed to read store_featured_backup.json:", e)

    # 2. Cache is stale, missing, or bundles expired: fetch fresh data from HenrikDev API
    try:
        headers = {"Authorization": API_KEY}
        r = requests.get("https://api.henrikdev.xyz/valorant/v2/store-featured", headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data and isinstance(data, dict) and "data" in data:
                # Store in memory cache
                cache["store_featured"] = {"data": data, "timestamp": time.time()}
                try:
                    with open(backup_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
                except Exception as cache_err:
                    print("[WARNING] Failed to write store_featured_backup.json:", cache_err)
                return jsonify(data)
            else:
                print("[WARNING] HenrikDev API returned unexpected store data structure")
        else:
            print(f"[WARNING] HenrikDev API returned store status {r.status_code}")
    except Exception as e:
        print("[ERROR] HenrikDev Store Featured fetch failed:", e)

    # 3. Graceful Fallback: read existing store_featured_backup.json even if older than 24 hours
    if os.path.exists(backup_file):
        try:
            with open(backup_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            print("[INFO] Serving store from older backup_file fallback")
            return jsonify(data)
        except Exception as e:
            print("[ERROR] Failed to load older store_featured_backup.json:", e)

    return jsonify({"status": 500, "error": "Failed to retrieve store offers"}), 500

@app.route("/api/v3/meta-comps")
@rate_limit(requests_per_minute=60)
def api_meta_comps():
    import json
    map_param = request.args.get("map", "").strip().lower()
    patch_param = request.args.get("patch", "").strip()
    
    # 1. Load the database file
    db_file = "public/vct_pro_comps.json"
    if not os.path.exists(db_file):
        return jsonify({
            "map": map_param,
            "patch": "latest",
            "agent_stats": {},
            "most_played_comp": {"agents": [], "picks": 0, "win_rate": 0},
            "highest_winrate_comp": {"agents": [], "picks": 0, "win_rate": 0},
            "total_matches": 0,
            "message": "Scraper database has not been initialized yet."
        })
        
    try:
        with open(db_file, "r", encoding="utf-8") as f:
            records = json.load(f)
    except Exception as e:
        print("[ERROR] Failed to load JSON database inside API:", e)
        return jsonify({"error": "Failed to read database"}), 500
        
    # 2. Filter by map (if provided)
    if map_param:
        records = [r for r in records if r.get("map_name", "").lower() == map_param]
        
    if not records:
        return jsonify({
            "map": map_param,
            "patch": "latest",
            "agent_stats": {},
            "most_played_comp": {"agents": [], "picks": 0, "win_rate": 0},
            "highest_winrate_comp": {"agents": [], "picks": 0, "win_rate": 0},
            "total_matches": 0,
            "message": f"No pro compositions found for map: {map_param}"
        })
        
    # 3. Dynamic patch filtering
    # Find all available patches in filtered records
    available_patches = sorted(list({r.get("patch_version", "12.08") for r in records if r.get("patch_version")}), reverse=True)
    
    selected_patch = patch_param
    if not selected_patch or selected_patch.lower() == "latest":
        selected_patch = available_patches[0] if available_patches else "12.08"
        
    # Filter by selected patch
    patch_records = [r for r in records if r.get("patch_version") == selected_patch]
    
    # If the active patch has less than 5 records, fall back to the previous patch automatically!
    if len(patch_records) < 5 and len(available_patches) > 1:
        fallback_patch = available_patches[1]
        print(f"[API PATCH FALLBACK] Sparse data for patch {selected_patch} (only {len(patch_records)} comps). Falling back to previous patch: {fallback_patch}")
        selected_patch = fallback_patch
        patch_records = [r for r in records if r.get("patch_version") == selected_patch]
        
    # If still empty, use all records for that map
    if not patch_records:
        patch_records = records
        selected_patch = "all"
        
    # 4. Aggregate Pick & Win Rates for individual Agents
    agent_appearances = {}  # agent -> count
    agent_wins = {}         # agent -> win_count
    total_compositions = len(patch_records)
    
    for r in patch_records:
        has_won = r.get("has_won", False)
        for agent in r.get("agents", []):
            agent_appearances[agent] = agent_appearances.get(agent, 0) + 1
            if has_won:
                agent_wins[agent] = agent_wins.get(agent, 0) + 1
                
    agent_stats = {}
    for agent, count in agent_appearances.items():
        pick_rate = round((count / total_compositions) * 100, 1) if total_compositions > 0 else 0
        win_rate = round((agent_wins.get(agent, 0) / count) * 100, 1) if count > 0 else 0
        agent_stats[agent] = {
            "pick_rate": pick_rate,
            "win_rate": win_rate,
            "raw_picks": count,
            "raw_wins": agent_wins.get(agent, 0)
        }
        
    # 5. Aggregate unique Compositions (lineups of 5 sorted agents)
    comp_stats = {} # tuple of 5 agents -> {"picks": X, "wins": Y}
    for r in patch_records:
        agents_tuple = tuple(sorted(r.get("agents", [])))
        if len(agents_tuple) != 5:
            continue
        if agents_tuple not in comp_stats:
            comp_stats[agents_tuple] = {"picks": 0, "wins": 0}
        comp_stats[agents_tuple]["picks"] += 1
        if r.get("has_won", False):
            comp_stats[agents_tuple]["wins"] += 1
            
    most_played_comp = []
    highest_winrate_comp = []
    
    if comp_stats:
        # Most played: sort by picks desc, then wins desc
        sorted_by_played = sorted(comp_stats.items(), key=lambda x: (x[1]["picks"], x[1]["wins"]), reverse=True)
        most_played_comp = list(sorted_by_played[0][0])
        most_played_meta = {
            "agents": most_played_comp,
            "picks": sorted_by_played[0][1]["picks"],
            "win_rate": round((sorted_by_played[0][1]["wins"] / sorted_by_played[0][1]["picks"]) * 100, 1) if sorted_by_played[0][1]["picks"] > 0 else 0
        }
        
        # Highest winrate: filter to comps with at least 2 picks if possible, sort by winrate desc, then picks desc
        min_picks = 2
        wr_candidates = [x for x in comp_stats.items() if x[1]["picks"] >= min_picks]
        if not wr_candidates:
            wr_candidates = list(comp_stats.items())
            
        sorted_by_wr = sorted(wr_candidates, key=lambda x: (x[1]["wins"]/x[1]["picks"] if x[1]["picks"] > 0 else 0, x[1]["picks"]), reverse=True)
        highest_winrate_comp = list(sorted_by_wr[0][0])
        highest_winrate_meta = {
            "agents": highest_winrate_comp,
            "picks": sorted_by_wr[0][1]["picks"],
            "win_rate": round((sorted_by_wr[0][1]["wins"] / sorted_by_wr[0][1]["picks"]) * 100, 1) if sorted_by_wr[0][1]["picks"] > 0 else 0
        }
    else:
        most_played_meta = {"agents": [], "picks": 0, "win_rate": 0}
        highest_winrate_meta = {"agents": [], "picks": 0, "win_rate": 0}
        
    return jsonify({
        "map": map_param,
        "patch": selected_patch,
        "total_comps_parsed": total_compositions,
        "agent_stats": agent_stats,
        "most_played_comp": most_played_meta,
        "highest_winrate_comp": highest_winrate_meta
    })



@app.route("/share/<share_id>", methods=["GET"])
def get_share_page(share_id):
    meta_filepath = os.path.join(os.path.dirname(__file__), "shared_meta.json")
    meta = {}
    if os.path.exists(meta_filepath):
        try:
            with open(meta_filepath, "r", encoding="utf-8") as f:
                records = json.load(f)
                meta = records.get(share_id, {})
        except:
            meta = {}
            
    p_name = f"{meta.get('playerName', 'ValTracker Player')}#{meta.get('playerTag', 'GG')}"
    agent = meta.get('agentName', 'VALORANT Agent')
    v_map = meta.get('mapName', 'VALORANT Map')
    outcome = "VICTORY" if meta.get('won', False) else "DEFEAT"
    score = meta.get('score', '')
    score_lbl = f"({score})" if score else ""
    
    # Custom, premium Spotify-style meta headers
    og_title = f"{p_name} secured a huge {outcome} {score_lbl} as {agent.upper()} on {v_map.upper()}!"
    og_desc = f"💥 Combat ACS & Stats diagnosed automatically. See the full Performance Infographic Card live on ValTracker!"
    host_url = request.host_url
    if "localhost" not in host_url and "127.0.0.1" not in host_url:
        host_url = host_url.replace("http://", "https://")
    
    # Check if we have .jpg or .png saved
    shared_dir = os.path.join(app.static_folder, "shared")
    ext = "png"
    if os.path.exists(os.path.join(shared_dir, f"{share_id}.jpg")):
        ext = "jpg"
    elif os.path.exists(os.path.join(shared_dir, f"{share_id}.jpeg")):
        ext = "jpeg"
        
    image_url = f"{host_url}shared/{share_id}.{ext}"
    share_url = f"{host_url}share/{share_id}"
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ValTracker — Performance Flex Card</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z' fill='%23ff4655'/%3E%3Cpolygon points='12,2 15.5,6 12,10 8.5,6' fill='%23e8ff47'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Barlow+Condensed:wght@800;900&family=DM+Mono:wght@500&display=swap" rel="stylesheet">
  
  <!-- Twitter Card (First for timeline rendering compatibility) -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@itzpratham01">
  <meta name="twitter:creator" content="@itzpratham01">
  <meta name="twitter:url" content="{share_url}">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{image_url}">
  <meta name="twitter:image:alt" content="VALORANT Match Infographic Card">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="{share_url}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{image_url}">
  <meta property="og:image:secure_url" content="{image_url}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="900">
  <meta property="og:image:height" content="535">
  <meta property="og:site_name" content="ValTracker">

  <style>
    :root {{
      --surface: #0b0b0e;
      --border: rgba(255, 70, 85, 0.3);
      --win: #3ecf8e;
      --loss: #ff4655;
    }}
    body {{
      margin: 0;
      padding: 0;
      background: #060608;
      color: #fff;
      font-family: 'Rajdhani', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      overflow-x: hidden;
    }}
    .container {{
      max-width: 900px;
      width: 95%;
      margin: 20px auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }}
    .card-preview {{
      width: 100%;
      max-width: 850px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 16px 48px rgba(0,0,0,0.8), 0 0 15px rgba(255, 70, 85, 0.15);
      background: var(--surface);
      display: block;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .card-preview:hover {{
      transform: scale(1.01) translateY(-2px);
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      margin-bottom: 5px;
    }}
    .brand svg {{
      width: 24px;
      height: 24px;
      fill: none;
      filter: drop-shadow(0 0 6px rgba(255, 70, 85, 0.6));
    }}
    .brand span {{
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #fff;
      text-transform: uppercase;
    }}
    .btn {{
      background: linear-gradient(135deg, #ff4655 0%, #e8ff47 100%);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 12px 28px;
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 900;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(255, 70, 85, 0.3);
      transition: all 0.2s;
      margin-top: 10px;
    }}
    .btn:hover {{
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 70, 85, 0.4), 0 0 10px rgba(232, 255, 71, 0.2);
      filter: brightness(1.05);
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      background: rgba(255, 70, 85, 0.12);
      border: 1px solid rgba(255, 70, 85, 0.3);
      color: #ff4655;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="brand">
      <svg viewBox="0 0 24 24">
        <path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655" />
        <polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47" />
      </svg>
      <span>ValTracker</span>
    </a>
    
    <div class="badge">Match Flex Card</div>
    
    <img src="{image_url}" class="card-preview" alt="Valorant Performance Flex Card">
    
    <a href="/?player={meta.get('playerName', '')}%23{meta.get('playerTag', '')}" class="btn">
      🎮 View Full Performance Telemetry
    </a>
  </div>
</body>
</html>"""
    return html

if __name__ == "__main__":
    if not API_KEY:
        print("\n[WARNING] API Key missing in .env file! Requests to HenrikDev might fail.\n")
    port = int(os.environ.get("PORT", 5000))
    print(f"\n[SUCCESS] Backend Server starting on http://0.0.0.0:{port}")
    print(f"-> Open your browser to http://127.0.0.1:{port} to view your app\n")
    app.run(host="0.0.0.0", port=port, debug=False)


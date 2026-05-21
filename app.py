import os
import time
import requests
import base64
import urllib3
import urllib.parse
import concurrent.futures
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()
API_KEY = os.getenv("HENRIKDEV_API_KEY", "")

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

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

def get_player_rank(puuid, region):
    if puuid in player_rank_cache:
        return player_rank_cache[puuid]["tier"], player_rank_cache[puuid]["tier_name"]
    
    try:
        url = f"https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/{region}/{puuid}"
        headers = {"Authorization": API_KEY}
        r = requests.get(url, headers=headers, timeout=3)
        if r.status_code == 200:
            res_data = r.json()
            data = res_data.get("data", {})
            current_tier = data.get("currenttier", 0)
            current_tier_patched = data.get("currenttierpatched", "Unranked")
            player_rank_cache[puuid] = {
                "tier": current_tier,
                "tier_name": current_tier_patched
            }
            return current_tier, current_tier_patched
    except Exception as e:
        print(f"[RANK FETCH ERROR] PUUID {puuid}: {e}")
        
    return 0, "Unranked"

def get_player_ranks_batch(puuids, region):
    ranks = {}
    puuids_to_fetch = []
    
    for puuid in puuids:
        if puuid in player_rank_cache:
            ranks[puuid] = (player_rank_cache[puuid]["tier"], player_rank_cache[puuid]["tier_name"])
        else:
            puuids_to_fetch.append(puuid)
            
    if not puuids_to_fetch:
        return ranks
        
    def fetch_one(puuid):
        try:
            url = f"https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/{region}/{puuid}"
            headers = {"Authorization": API_KEY}
            r = requests.get(url, headers=headers, timeout=2.5)
            if r.status_code == 200:
                res_data = r.json()
                data = res_data.get("data", {})
                current_tier = data.get("currenttier", 0)
                current_tier_patched = data.get("currenttierpatched", "Unranked")
                player_rank_cache[puuid] = {
                    "tier": current_tier,
                    "tier_name": current_tier_patched
                }
                return puuid, current_tier, current_tier_patched
        except Exception as e:
            print(f"[RANK FETCH BATCH ERROR] PUUID {puuid}: {e}")
        return puuid, 0, "Unranked"

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(fetch_one, puuids_to_fetch)
        for puuid, tier, tier_name in results:
            ranks[puuid] = (tier, tier_name)
            
    return ranks

def resolve_puuids(puuids, region, remote_headers):
    shard = "ap"
    if region.lower() in ["na", "latam", "br"]:
        shard = "na"
    elif region.lower() == "eu":
        shard = "eu"
    elif region.lower() == "kr":
        shard = "kr"
        
    url = f"https://pd.{shard}.a.pvp.net/name-service/v2/players"
    try:
        r = requests.put(url, headers=remote_headers, json=puuids, verify=False, timeout=3)
        if r.status_code == 200:
            resolver = {}
            for item in r.json():
                resolver[item.get("Subject")] = {
                    "name": item.get("GameName"),
                    "tag": item.get("TagLine")
                }
            return resolver
    except Exception as e:
        print("[PUUID RESOLUTION ERROR]", e)
    return {}

def format_local_pregame(match_data, region, resolver):
    players = []
    ally_players = match_data.get("AllyTeam", {}).get("Players", [])
    enemy_players = match_data.get("EnemyTeam", {}).get("Players", [])
    
    all_puuids = [p.get("Subject") for p in ally_players + enemy_players if p.get("Subject")]
    ranks_map = get_player_ranks_batch(all_puuids, region)
    
    for p in ally_players:
        puuid = p.get("Subject")
        identity = resolver.get(puuid, {"name": "Teammate", "tag": "Lobby"})
        agent_uuid = p.get("CharacterID", "").lower()
        agent_name = AGENT_UUID_MAP.get(agent_uuid, "Unknown")
        level = p.get("PlayerIdentity", {}).get("AccountLevel", 0)
        tier, tier_name = ranks_map.get(puuid, (0, "Unranked"))
        players.append({
            "name": identity["name"],
            "tag": identity["tag"],
            "character": agent_name,
            "currenttier": tier,
            "currenttierpatched": tier_name,
            "account_level": level,
            "team": "Blue"
        })
        
    for p in enemy_players:
        puuid = p.get("Subject")
        identity = resolver.get(puuid, {"name": "Enemy", "tag": "Lobby"})
        agent_uuid = p.get("CharacterID", "").lower()
        agent_name = AGENT_UUID_MAP.get(agent_uuid, "Unknown")
        level = p.get("PlayerIdentity", {}).get("AccountLevel", 0)
        tier, tier_name = ranks_map.get(puuid, (0, "Unranked"))
        players.append({
            "name": identity["name"],
            "tag": identity["tag"],
            "character": agent_name,
            "currenttier": tier,
            "currenttierpatched": tier_name,
            "account_level": level,
            "team": "Red"
        })
    return {"players": players}

def format_local_coregame(match_data, region, resolver):
    players = []
    raw_players = match_data.get("Players", [])
    
    all_puuids = [p.get("Subject") for p in raw_players if p.get("Subject")]
    ranks_map = get_player_ranks_batch(all_puuids, region)
    
    for p in raw_players:
        puuid = p.get("Subject")
        identity = resolver.get(puuid, {"name": "Player", "tag": "Lobby"})
        agent_uuid = p.get("CharacterID", "").lower()
        agent_name = AGENT_UUID_MAP.get(agent_uuid, "Unknown")
        level = p.get("PlayerIdentity", {}).get("AccountLevel", 0)
        tier, tier_name = ranks_map.get(puuid, (0, "Unranked"))
        
        team_id = p.get("TeamID", "")
        is_blue = (team_id.lower() == "blue" or team_id == "9b03d89d-4d49-411a-ba2b-be2edbe45ef3")
        team_name = "Blue" if is_blue else "Red"
        
        players.append({
            "name": identity["name"],
            "tag": identity["tag"],
            "character": agent_name,
            "currenttier": tier,
            "currenttierpatched": tier_name,
            "account_level": level,
            "team": team_name
        })
    return {"players": players}

def format_history_match_for_live(match):
    players = []
    raw_players = match.get("players", [])
    if isinstance(raw_players, dict):
        raw_players = raw_players.get("all_players", [])
        
    for p in raw_players:
        team = p.get("team", "Red")
        stats = p.get("stats", {})
        players.append({
            "name": p.get("name"),
            "tag": p.get("tag"),
            "character": p.get("character"),
            "currenttier": p.get("currenttier", 0),
            "currenttierpatched": p.get("currenttierpatched", "Unranked"),
            "account_level": p.get("account_level", 0),
            "team": team,
            "stats": {
                "kills": stats.get("kills", 0),
                "deaths": stats.get("deaths", 0),
                "assists": stats.get("assists", 0),
                "score": stats.get("score", 0)
            }
        })
    return {"players": players}

@app.route("/")
def index():
    resp = make_response(send_from_directory(app.static_folder, "index.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp

@app.route("/api/clear-cache", methods=["POST"])
def clear_server_cache():
    cache.clear()
    return jsonify({"status": "ok", "message": "Server cache cleared"})

@app.route("/api/v1/live-match/<region>/<name>/<tag>", methods=["GET"])
def live_match(region, name, tag):
    # 1. Try local active match scan via lockfile
    localappdata = os.getenv("LOCALAPPDATA")
    lockfile_path = os.path.join(localappdata, "Riot Games", "Riot Client", "Config", "lockfile") if localappdata else None
    
    if lockfile_path and os.path.exists(lockfile_path):
        print(f"[LIVE SCAN] Lockfile detected! Fetching credentials...")
        try:
            with open(lockfile_path, "r") as f:
                content = f.read().strip()
            parts = content.split(":")
            if len(parts) == 5:
                port = parts[2]
                password = parts[3]
                
                auth_str = f"riot:{password}"
                auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
                
                local_headers = {
                    "Authorization": f"Basic {auth_b64}",
                    "Content-Type": "application/json"
                }
                
                # Fetch entitlements tokens
                token_res = requests.get(f"https://127.0.0.1:{port}/entitlements/v1/token", headers=local_headers, verify=False, timeout=2)
                if token_res.status_code == 200:
                    token_data = token_res.json()
                    access_token = token_data.get("accessToken")
                    entitlements_token = token_data.get("token") or token_data.get("entitlements")
                    
                    # Fetch chat session for PUUID
                    session_res = requests.get(f"https://127.0.0.1:{port}/chat/v1/session", headers=local_headers, verify=False, timeout=2)
                    if session_res.status_code == 200:
                        session_data = session_res.json()
                        puuid = session_data.get("puuid")
                        
                        remote_headers = {
                            "Authorization": f"Bearer {access_token}",
                            "X-Riot-Entitlements-JWT": entitlements_token,
                            "Content-Type": "application/json"
                        }
                        
                        # Region routing mapping
                        shard = "ap"
                        if region.lower() in ["na", "latam", "br"]:
                            shard = "na"
                        elif region.lower() == "eu":
                            shard = "eu"
                        elif region.lower() == "kr":
                            shard = "kr"
                            
                        # A. Check pregame
                        pregame_url = f"https://glz-{region}-1.{shard}.a.pvp.net/pregame/v1/players/{puuid}"
                        pregame_res = requests.get(pregame_url, headers=remote_headers, verify=False, timeout=2)
                        
                        if pregame_res.status_code == 200:
                            pregame_match_id = pregame_res.json().get("MatchID")
                            match_url = f"https://glz-{region}-1.{shard}.a.pvp.net/pregame/v1/matches/{pregame_match_id}"
                            match_res = requests.get(match_url, headers=remote_headers, verify=False, timeout=2)
                            if match_res.status_code == 200:
                                match_data = match_res.json()
                                # Resolve PUUIDs locally or remotely
                                player_puuids = [pl.get("Subject") for pl in match_data.get("AllyTeam", {}).get("Players", []) + match_data.get("EnemyTeam", {}).get("Players", [])]
                                resolver = resolve_puuids(player_puuids, region, remote_headers)
                                return jsonify({
                                    "status": "active",
                                    "source": "local_client",
                                    "match_type": "pregame",
                                    "data": format_local_pregame(match_data, region, resolver)
                                })
                                
                        # B. Check coregame
                        coregame_url = f"https://glz-{region}-1.{shard}.a.pvp.net/core-game/v1/players/{puuid}"
                        coregame_res = requests.get(coregame_url, headers=remote_headers, verify=False, timeout=2)
                        
                        if coregame_res.status_code == 200:
                            coregame_match_id = coregame_res.json().get("MatchID")
                            match_url = f"https://glz-{region}-1.{shard}.a.pvp.net/core-game/v1/matches/{coregame_match_id}"
                            match_res = requests.get(match_url, headers=remote_headers, verify=False, timeout=2)
                            if match_res.status_code == 200:
                                match_data = match_res.json()
                                player_puuids = [pl.get("Subject") for pl in match_data.get("Players", [])]
                                resolver = resolve_puuids(player_puuids, region, remote_headers)
                                return jsonify({
                                    "status": "active",
                                    "source": "local_client",
                                    "match_type": "coregame",
                                    "data": format_local_coregame(match_data, region, resolver)
                                })
        except Exception as local_err:
            print("[LOCAL SCAN EXCEPTION - PROBABLY VALORANT CLOSED]", local_err)

    # 2. Fallback 1: Recent match history (ended within last 90 minutes)
    try:
        print(f"[LIVE SCAN FALLBACK] Scanning recent match history for {name}#{tag}...")
        url = f"https://api.henrikdev.xyz/valorant/v3/matches/{region}/{urllib.parse.quote(name)}/{urllib.parse.quote(tag)}"
        headers = {"Authorization": API_KEY}
        r = requests.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            history_data = r.json()
            matches = history_data.get("data", [])
            if matches:
                last_match = matches[0]
                metadata = last_match.get("metadata", {})
                match_start_epoch = metadata.get("game_start", 0)
                
                current_time_epoch = int(time.time())
                time_since_match_start = current_time_epoch - match_start_epoch
                
                # Check if match started within last 90 minutes
                if time_since_match_start < 5400:
                    print(f"[FALLBACK SUCCESS] Extremely recent match detected! {time_since_match_start // 60} mins ago")
                    return jsonify({
                        "status": "recent",
                        "source": "match_history",
                        "match_id": metadata.get("matchid"),
                        "time_ago_mins": max(0, time_since_match_start // 60),
                        "map": metadata.get("map"),
                        "mode": metadata.get("mode"),
                        "teams": last_match.get("teams", {}),
                        "data": format_history_match_for_live(last_match)
                    })
    except Exception as history_err:
        print("[HISTORY SCAN FALLBACK EXCEPTION]", history_err)

    # 3. Fallback 2: Simulation Demo
    return jsonify({
        "status": "demo",
        "source": "simulator",
        "message": "No active match found."
    })

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


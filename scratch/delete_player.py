import sys
import os
import requests
from dotenv import load_dotenv

# Load database configuration
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] SUPABASE_URL or SUPABASE_KEY not found in .env file.")
    sys.exit(1)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def delete_player(name, tag):
    name_lower = name.lower()
    tag_lower = tag.lower()
    
    print(f"\n[1/3] Searching for player {name}#{tag} in players_cache...")
    
    # Query player to find PUUID
    url_players = f"{SUPABASE_URL.rstrip('/')}/rest/v1/players_cache"
    params = {
        "name": f"ilike.{name}",
        "tag": f"ilike.{tag}",
        "select": "puuid,name,tag"
    }
    
    r = requests.get(url_players, headers=headers, params=params)
    if r.status_code != 200:
        print(f"[ERROR] Failed to query players table: {r.status_code} - {r.text}")
        return
        
    players = r.json()
    if not players:
        print(f"[WARNING] No player found matching {name}#{tag} in database.")
        # Try a case-insensitive search on the raw name/tag columns as fallback
        print("Running fallback query on raw name and tag...")
        params_fallback = {
            "name": f"ilike.{name}",
            "tag": f"ilike.{tag}",
            "select": "puuid,name,tag"
        }
        r_fb = requests.get(url_players, headers=headers, params=params_fallback)
        if r_fb.status_code == 200:
            players = r_fb.json()
            
    if not players:
        print(f"[FAIL] Player {name}#{tag} does not exist in the database cache.")
        return
        
    player = players[0]
    puuid = player.get("puuid")
    actual_name = player.get("name")
    actual_tag = player.get("tag")
    
    print(f"[FOUND] Resolved player PUUID: {puuid} ({actual_name}#{actual_tag})")
    
    # Confirm deletion
    confirm = input(f"\nAre you sure you want to permanently delete {actual_name}#{actual_tag} and all their match history? (y/n): ")
    if confirm.lower() != 'y':
        print("[CANCELLED] Deletion cancelled.")
        return

    # Delete from matches_cache
    print(f"\n[2/3] Deleting match history from matches_cache...")
    url_matches = f"{SUPABASE_URL.rstrip('/')}/rest/v1/matches_cache"
    params_del_matches = {
        "puuid": f"eq.{puuid}"
    }
    r_del_m = requests.delete(url_matches, headers=headers, params=params_del_matches)
    if r_del_m.status_code in [200, 204]:
        print(f"[SUCCESS] Cleaned up match history.")
    else:
        print(f"[ERROR] Failed to delete matches: {r_del_m.status_code} - {r_del_m.text}")

    # Delete from players_cache
    print(f"[3/3] Deleting player from players_cache...")
    params_del_player = {
        "puuid": f"eq.{puuid}"
    }
    r_del_p = requests.delete(url_players, headers=headers, params=params_del_player)
    if r_del_p.status_code in [200, 204]:
        print(f"[SUCCESS] Player record deleted completely.")
    else:
        print(f"[ERROR] Failed to delete player: {r_del_p.status_code} - {r_del_p.text}")
        
    print("\n[COMPLETE] Player successfully wiped from database.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("\nUsage: python scratch/delete_player.py <name> <tag>")
        name_input = input("Enter player Name: ").strip()
        tag_input = input("Enter player Tag: ").strip().replace('#', '')
        if name_input and tag_input:
            delete_player(name_input, tag_input)
        else:
            print("[ERROR] Name and Tag are required.")
    else:
        delete_player(sys.argv[1], sys.argv[2])

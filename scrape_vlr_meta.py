import os
import re
import json
import time
import random
import urllib.request
from bs4 import BeautifulSoup

# VLR.gg scraper settings
RESULTS_URL = "https://www.vlr.gg/matches/results"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
DB_PATH = "public/vct_pro_comps.json"

# List of agents for verification/normalizing
VALID_AGENTS = {
    "jett", "raze", "neon", "yoru", "phoenix", "iso", "reyna",
    "sova", "fade", "breach", "skye", "gekko", "kayo",
    "omen", "viper", "brimstone", "astra", "harbor", "clove",
    "cypher", "killjoy", "sage", "deadlock", "vyse", "veto"
}

def date_to_patch(date_str):
    """
    Map match dates to logical patch versions for 2026 match resets.
    Defaulting to recent patches.
    """
    lower = date_str.lower()
    if 'jan' in lower: return '12.00'
    elif 'feb' in lower: return '12.02'
    elif 'mar' in lower: return '12.04'
    elif 'apr' in lower: return '12.06'
    elif 'may' in lower: return '12.08'
    elif 'jun' in lower: return '12.10'
    elif 'jul' in lower: return '13.00'
    elif 'aug' in lower: return '13.02'
    elif 'sep' in lower: return '13.04'
    elif 'oct' in lower: return '13.06'
    elif 'nov' in lower: return '13.08'
    elif 'dec' in lower: return '13.10'
    return '12.08' # Standard active meta patch fallback

def normalize_agent_name(name):
    """Clean and match agent name to our internal taxonomy."""
    cleaned = name.lower().replace("kay/o", "kayo").replace(" ", "").strip()
    if cleaned in VALID_AGENTS:
        return cleaned
    # Check simple partial match
    for valid in VALID_AGENTS:
        if valid in cleaned:
            return valid
    return cleaned

def fetch_page(url):
    """Safe page downloader with user-agent and retry capability."""
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    retries = 3
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                return response.read()
        except Exception as e:
            print(f"[RETRY {attempt+1}/{retries}] Failed to fetch {url}: {e}")
            if attempt == retries - 1:
                raise e
            time.sleep(2 + random.random() * 2)

def load_existing_db():
    """Load current pro comps file if it exists."""
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[DB LOAD ERROR] Corrupt db file, starting fresh: {e}")
            return []
    return []

def save_db(data):
    """Write parsed data out to the localized JSON database."""
    # Ensure public directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    try:
        with open(DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[DB SAVED] Successfully wrote {len(data)} compositions to {DB_PATH}")
    except Exception as e:
        print(f"[DB SAVE ERROR] Failed to save JSON database: {e}")

def run_scraper(limit_new=100, max_pages=5):
    """Parse recently completed professional VCT and Challengers comps."""
    print("=== STARTING VCT META SCRAPER ===")
    existing_records = load_existing_db()
    
    # Store existing match IDs for quick skipping
    existing_match_ids = {r.get('vlr_match_id') for r in existing_records if r.get('vlr_match_id')}
    print(f"Loaded {len(existing_records)} existing comp records. Unique parsed matches: {len(existing_match_ids)}")
    
    match_cards = []
    
    # Crawl multiple pages of completed matches to gather a massive sample size!
    for page in range(1, max_pages + 1):
        url = f"{RESULTS_URL}?page={page}"
        print(f"Fetching matches results page {page}/{max_pages}: {url}")
        try:
            time.sleep(1.0 + random.random() * 0.8) # Safe politeness pause between results pages
            html = fetch_page(url)
            soup = BeautifulSoup(html, 'html.parser')
            page_cards = [a for a in soup.find_all('a', href=True) if re.search(r'^/\d+/', a['href'])]
            
            # De-duplicate page cards
            seen_hrefs = {c['href'] for c in match_cards}
            for card in page_cards:
                if card['href'] not in seen_hrefs:
                    match_cards.append(card)
                    
            print(f"  Found {len(page_cards)} completed matches on page {page}.")
        except Exception as e:
            print(f"  [ERROR] Failed to load results overview page {page}: {e}")
            break
            
    print(f"Discovered a total of {len(match_cards)} completed matches on recent logs across {max_pages} pages.")
    
    new_records = []
    processed_count = 0
    
    for card in match_cards:
        if processed_count >= limit_new:
            print(f"Reached processing limit of {limit_new} new matches. Stopping.")
            break
            
        href = card['href']
        # Extract VLR match ID
        match_id_match = re.search(r'^/(\d+)/', href)
        if not match_id_match:
            continue
        vlr_match_id = int(match_id_match.group(1))
        
        # Check if already processed
        if vlr_match_id in existing_match_ids:
            # Match is cached already, skip safely
            continue
            
        # Isolate Event Name to filter VCT / Challengers / Champions / Masters
        event_el = card.find('div', {'class': 'match-item-event'})
        event_name = event_el.text.strip() if event_el else ""
        event_name_clean = re.sub(r'\s+', ' ', event_name)
        
        # We target professional leagues
        is_pro = any(term in event_name_clean.lower() for term in [
            'vct', 'champions', 'masters', 'challengers', 'game changers', 'evolution series', 'premier'
        ])
        if not is_pro:
            # Skip non-professional or casual community tournaments
            continue
            
        print(f"\n[PARSING MATCH {vlr_match_id}] {event_name_clean}")
        match_url = f"https://www.vlr.gg{href}?map=all"
        
        # Politeness sleep delay
        time.sleep(2.0 + random.random() * 2.0)
        
        try:
            match_html = fetch_page(match_url)
            match_soup = BeautifulSoup(match_html, 'html.parser')
            
            # 1. Parse Teams
            teams_el = match_soup.find_all('div', {'class': 'match-header-link-name'})
            if len(teams_el) < 2:
                print(f"  [SKIP] Team names missing or incomplete.")
                continue
            team_names = [t.text.strip() for t in teams_el]
            
            # 2. Parse Match Date and Map Patch
            header_div = match_soup.find(class_='match-header')
            match_date = "Unknown Date"
            if header_div:
                date_div = header_div.find('div', {'class': 'match-header-date'})
                if date_div:
                    moment = date_div.find('div', {'class': 'moment-tz-convert'})
                    if moment:
                        match_date = moment.text.strip()
            
            patch_version = date_to_patch(match_date)
            print(f"  Teams: {team_names[0]} vs {team_names[1]} | Date: {match_date} | Patch: {patch_version}")
            
            # 3. Parse Played Maps List
            gamesnav = match_soup.find('div', {'class': 'vm-stats-gamesnav-container'})
            maps_played = []
            if gamesnav:
                items = gamesnav.find_all('div', {'class': 'js-map-switch'})
                for item in items:
                    classes = item.get('class', [])
                    if 'mod-all' in classes or 'mod-disabled' in classes:
                        continue
                    text = item.text.strip()
                    text = re.sub(r'\s+', ' ', text)
                    text = re.sub(r'^\d+\s*', '', text).strip().lower() # lowercase for index matching
                    maps_played.append(text)
            
            # 4. Grab Game Scoreboards & Compositions
            container = match_soup.find('div', {'class': 'vm-stats-container'})
            if not container:
                print("  [SKIP] Compositions container missing.")
                continue
                
            games = []
            for child in container.find_all('div', recursive=False):
                classes = child.get('class', [])
                if 'vm-stats-game' in classes:
                    games.append(child)
            
            # Match games div indexes (skipping all maps container games[0])
            for idx, map_name in enumerate(maps_played):
                div_idx = idx + 1
                if div_idx >= len(games):
                    continue
                game_div = games[div_idx]
                
                # Extract scoreboards
                score_divs = game_div.find_all(class_='score')
                scores = [s.text.strip() for s in score_divs]
                
                if len(scores) < 2:
                    continue
                    
                # Determine map winner
                winner_idx = -1
                for s_idx, s in enumerate(score_divs):
                    if 'mod-win' in s.get('class', []):
                        winner_idx = s_idx
                
                # Check overview tables for players and agent lists
                tables = game_div.find_all('table', {'class': 'mod-overview'})
                for t_idx, table in enumerate(tables):
                    if t_idx >= 2:
                        break
                    
                    team_name = team_names[t_idx]
                    opposing_team = team_names[1 - t_idx]
                    has_won = (t_idx == winner_idx)
                    score_str = f"{scores[t_idx]}-{scores[1 - t_idx]}"
                    
                    rows = table.find_all('tr')[1:] # Skip headers row
                    agents = []
                    for row in rows:
                        agent_td = row.find('td', {'class': 'mod-agents'})
                        if not agent_td:
                            agent_td = row.find('td', {'class': 'mod-agent'})
                        
                        agent_name = "unknown"
                        if agent_td:
                            img = agent_td.find('img')
                            if img:
                                if img.has_attr('title'):
                                    agent_name = img['title']
                                elif img.has_attr('alt'):
                                    agent_name = img['alt']
                        
                        normalized = normalize_agent_name(agent_name)
                        if normalized and normalized != "unknown":
                            agents.append(normalized)
                    
                    # Store only full 5-agent lineups
                    if len(agents) == 5:
                        comp_record = {
                            "vlr_match_id": vlr_match_id,
                            "match_date": match_date,
                            "patch_version": patch_version,
                            "map_name": map_name,
                            "team_name": team_name,
                            "opposing_team": opposing_team,
                            "agents": sorted(agents), # sorted alphabetically for unique identifiers grouping
                            "has_won": has_won,
                            "score": score_str,
                            "event_name": event_name_clean
                        }
                        new_records.append(comp_record)
                        
            processed_count += 1
            print(f"  Successfully parsed match! Appended {len(new_records)} total team compositions.")
            
        except Exception as e:
            print(f"  [ERROR] Failed to parse match details for {href}: {e}")
            continue

    # Merge and update records
    if new_records:
        all_records = existing_records + new_records
        save_db(all_records)
        print(f"=== SCRAPER SUCCESS: ADDED {len(new_records)} NEW RECS ===")
    else:
        print("=== SCRAPER SUCCESS: NO NEW RECORDS FOUND ===")

if __name__ == "__main__":
    run_scraper(limit_new=100, max_pages=5)

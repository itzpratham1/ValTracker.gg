import sys
import os
import re
import json
import time
import random
import urllib.request
from bs4 import BeautifulSoup

# Ensure UTF-8 output encoding for Windows environment
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# VLR.gg scraper settings
RESULTS_URL = "https://www.vlr.gg/matches/results"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
DB_PATH = "frontend/public/vct_pro_comps.json"

# List of agents for verification/normalizing
VALID_AGENTS = {
    "jett", "raze", "neon", "yoru", "phoenix", "iso", "reyna", "waylay",
    "sova", "fade", "breach", "skye", "gekko", "kayo", "tejo",
    "omen", "viper", "brimstone", "astra", "harbor", "clove", "miks",
    "cypher", "killjoy", "sage", "deadlock", "vyse", "veto", "chamber"
}

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
    """Load current pro comps file if it exists, prioritizing the larger dataset."""
    p1 = os.path.join(os.path.dirname(__file__), "frontend", "public", "vct_pro_comps.json")
    p2 = os.path.join(os.path.dirname(__file__), "public", "vct_pro_comps.json")
    best_recs = []
    for p in (p1, p2):
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    recs = json.load(f)
                    if len(recs) > len(best_recs):
                        best_recs = recs
            except Exception as e:
                print(f"[DB LOAD ERROR] Failed loading {p}: {e}")
    return best_recs

def save_db(data):
    """Write parsed data out to localized JSON databases."""
    if not data:
        existing = load_existing_db()
        if existing:
            print("[DB SAVE SKIPPED] Refusing to overwrite populated database with empty array.")
            return

    paths = [
        os.path.join(os.path.dirname(__file__), "frontend", "public", "vct_pro_comps.json"),
        os.path.join(os.path.dirname(__file__), "public", "vct_pro_comps.json")
    ]
    for p in paths:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"[DB SAVED] Successfully wrote {len(data)} compositions to {p}")
        except Exception as e:
            print(f"[DB SAVE ERROR] Failed to save JSON database to {p}: {e}")

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
            page_cards = soup.find_all('a', {'class': 'match-item'})
            
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
            'vct', 'champions', 'masters', 'challengers', 'game changers',
            'evolution series', 'premier', 'world cup', 'ewc', 'kickoff',
            'ascension', 'offseason', 'off//season', 'pacific', 'emea',
            'americas', 'cn', 'stage'
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
            
            # 2. Parse Match Date and Actual Patch directly from VLR.gg match HTML
            header_div = match_soup.find(class_='match-header')
            match_date = "Unknown Date"
            patch_version = "Unknown"
            if header_div:
                date_div = header_div.find('div', {'class': 'match-header-date'})
                if date_div:
                    moment = date_div.find('div', {'class': 'moment-tz-convert'})
                    if moment:
                        match_date = moment.text.strip()
                
                full_text = match_soup.get_text()
                patch_match = re.search(r'Patch\s*(\d+)\.(\d+)', full_text, re.IGNORECASE)
                if patch_match:
                    major, minor = patch_match.group(1), patch_match.group(2)
                    patch_version = f'{major}.{int(minor):02d}'
                else:
                    patch_version = "Unknown"
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
                
                # Extract scores & winner
                score_divs = game_div.find_all(class_='score')
                scores = [s.text.strip() for s in score_divs]
                winner_idx = -1
                for s_idx, s in enumerate(score_divs):
                    if 'mod-win' in s.get('class', []):
                        winner_idx = s_idx

                # Extract agent icons directly from game_div (supports modern & classic VLR layouts)
                agent_imgs = game_div.find_all('img', src=re.compile(r'/game/agents/'))
                raw_agents = []
                for img in agent_imgs:
                    name = img.get('alt') or img.get('title') or ''
                    if not name and img.has_attr('src'):
                        m = re.search(r'/agents/([^.]+)', img['src'])
                        if m: name = m.group(1)
                    normalized = normalize_agent_name(name)
                    if normalized and normalized != "unknown":
                        raw_agents.append(normalized)

                team_lineups = [raw_agents[:5], raw_agents[5:10]]
                for t_idx in range(min(2, len(team_names))):
                    agents = team_lineups[t_idx]
                    if len(agents) == 5:
                        team_name = team_names[t_idx]
                        opposing_team = team_names[1 - t_idx]
                        has_won = (t_idx == winner_idx)
                        score_str = f"{scores[t_idx]}-{scores[1 - t_idx]}" if len(scores) >= 2 else ""

                        comp_record = {
                            "vlr_match_id": vlr_match_id,
                            "match_date": match_date,
                            "patch_version": patch_version,
                            "map_name": map_name,
                            "team_name": team_name,
                            "opposing_team": opposing_team,
                            "agents": sorted(agents),
                            "has_won": has_won,
                            "score": score_str,
                            "event_name": event_name_clean
                        }
                        new_records.append(comp_record)
                        
            processed_count += 1
            print(f"  Successfully parsed match! Appended {len(new_records)} total team compositions.")
            if new_records:
                save_db(existing_records + new_records)

        except Exception as e:
            print(f"  [ERROR] Failed to parse match details for {href}: {e}")
            continue

    # Final summary log
    if new_records:
        save_db(existing_records + new_records)
        print(f"=== SCRAPER SUCCESS: ADDED {len(new_records)} NEW RECS ===")
    else:
        print("=== SCRAPER SUCCESS: NO NEW RECORDS FOUND ===")

if __name__ == "__main__":
    run_scraper(limit_new=100, max_pages=5)

import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf/?map=all"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page with ?map=all: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Teams
    teams_el = soup.find_all('div', {'class': 'match-header-link-name'})
    team_names = [t.text.strip() for t in teams_el]
    print("Teams:", team_names)
    
    # 2. Played maps
    gamesnav = soup.find('div', {'class': 'vm-stats-gamesnav-container'})
    maps_played = []
    if gamesnav:
        items = gamesnav.find_all('div', {'class': 'js-map-switch'})
        for item in items:
            classes = item.get('class', [])
            if 'mod-all' in classes or 'mod-disabled' in classes:
                continue
            text = item.text.strip()
            text = re.sub(r'\s+', ' ', text)
            text = re.sub(r'^\d+\s*', '', text).strip()
            maps_played.append(text)
    print("Played Maps:", maps_played)
    
    # 3. Stats games container
    container = soup.find('div', {'class': 'vm-stats-container'})
    if container:
        # Get only direct children with class vm-stats-game
        games = []
        for child in container.find_all('div', recursive=False):
            classes = child.get('class', [])
            if 'vm-stats-game' in classes:
                games.append(child)
                
        print(f"Total direct game divs: {len(games)}")
        
        for idx, map_name in enumerate(maps_played):
            div_idx = idx + 1
            if div_idx >= len(games):
                continue
            game_div = games[div_idx]
            print(f"\n--- Map: {map_name} ---")
            
            # Extract scores
            score_divs = game_div.find_all(class_='score')
            scores = [s.text.strip() for s in score_divs]
            
            # Check who won
            winner_idx = -1
            for s_idx, s in enumerate(score_divs):
                if 'mod-win' in s.get('class', []):
                    winner_idx = s_idx
                    
            print(f"  Scores: {scores} | Winner: {team_names[winner_idx] if winner_idx != -1 else 'Unknown'}")
            
            # Comps
            tables = game_div.find_all('table', {'class': 'mod-overview'})
            for t_idx, table in enumerate(tables):
                team_name = team_names[t_idx] if t_idx < len(team_names) else f"Team {t_idx+1}"
                
                rows = table.find_all('tr')[1:] # Skip header
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
                                agent_name = img['title'].lower()
                            elif img.has_attr('alt'):
                                agent_name = img['alt'].lower()
                    agents.append(agent_name)
                
                is_win = (t_idx == winner_idx)
                print(f"  {team_name} Comps ({'WIN' if is_win else 'LOSE'}): {agents}")
                
except Exception as e:
    print("Error:", e)

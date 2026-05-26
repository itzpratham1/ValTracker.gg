import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    games = soup.find_all('div', {'class': 'vm-stats-game'})
    print(f"Total vm-stats-game divs found: {len(games)}")
    
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
    
    # 1-to-1 zip pairing!
    for idx, map_name in enumerate(maps_played):
        if idx >= len(games):
            continue
        game_div = games[idx]
        print(f"\n--- Map: {map_name} ---")
        
        # Search inside this game div header
        header = game_div.find('div', {'class': 'vm-stats-game-header'})
        if header:
            scores = header.find_all(class_='score')
            if not scores:
                scores = header.find_all('div', {'class': re.compile(r'score')})
                
            print(f"  Header scores found: {len(scores)}")
            for s in scores:
                classes = s.get('class', [])
                print(f"    Tag: {s.name} | classes: {classes} | text: {s.text.strip()}")
                
        else:
            print("  Header NOT found!")
            
except Exception as e:
    print("Error:", e)

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
    # skip All Maps (index 0)
    for idx, game in enumerate(games[1:]):
        print(f"\n--- Map {idx+1} ---")
        
        # Let's find all divs with class containing 'score' inside this game div
        scores = game.find_all('div', {'class': re.compile(r'^score$|^score\s+|score')})
        if not scores:
            # Fallback: search for elements with class 'score'
            scores = game.find_all(class_='score')
            
        print(f"Scores found: {len(scores)}")
        for s in scores:
            classes = s.get('class', [])
            print(f"  Tag: {s.name} | classes: {classes} | text: {s.text.strip()}")
            
except Exception as e:
    print("Error:", e)

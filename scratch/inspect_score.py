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
    # Let's inspect the second game (Split map stats)
    if len(games) > 1:
        game = games[1]
        print("\n--- Inspecting Split Game Div ---")
        
        # Search for any span or div containing scores (numbers like 13, 5, 8, etc.)
        score_elements = game.find_all(class_=re.compile(r'score', re.IGNORECASE))
        print(f"Elements matching 'score' class: {len(score_elements)}")
        for el in score_elements:
            safe_el = str(el)[:150].encode('ascii', errors='replace').decode('ascii')
            print(f"  Tag: {el.name} | classes: {el.get('class', [])} | text: {el.text.strip()} | HTML: {safe_el}")
            
except Exception as e:
    print("Error:", e)

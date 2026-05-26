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
    if len(games) > 0:
        active_game = games[0] # All Maps or the active map Split!
        print(f"\n--- Direct children of active_game (Split or All Maps) ---")
        for idx, child in enumerate(active_game.find_all(recursive=False)):
            classes = child.get('class', [])
            print(f"Child {idx+1} classes: {classes} | tag: {child.name}")
            # print its text
            print(f"  Text preview: {child.text.strip()[:100]}")
            
except Exception as e:
    print("Error:", e)

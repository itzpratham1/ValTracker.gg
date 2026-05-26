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
    if len(games) > 1:
        game = games[1]
        print("\n--- Inspecting Split Game Div for Scores ---")
        
        # Find all elements containing text of score format: e.g. "13" or "8" or similar
        # Let's list all elements inside game that have text content that is a number
        # and print their surrounding layout
        for div in game.find_all(recursive=True):
            # If the div has a class like 'score' or is related to headers
            classes = div.get('class', [])
            if any('score' in c.lower() or 'team' in c.lower() for c in classes):
                safe_div = str(div)[:150].encode('ascii', errors='replace').decode('ascii')
                print(f"Tag: {div.name} | classes: {classes} | text: {div.text.strip()} | HTML: {safe_div}")
                
except Exception as e:
    print("Error:", e)

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
        # games[1] is the Split game stats div
        header = games[1].find('div', {'class': 'vm-stats-game-header'})
        if header:
            print("\n--- Split Map Header HTML ---")
            safe_header = str(header).encode('ascii', errors='replace').decode('ascii')
            print(safe_header)
except Exception as e:
    print("Error:", e)

import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    gamesnav = soup.find('div', {'class': 'vm-stats-gamesnav-container'})
    if gamesnav:
        print("Found gamesnav container!")
        items = gamesnav.find_all('div', {'class': 'js-map-switch'})
        for idx, item in enumerate(items):
            safe_item = str(item).encode('ascii', errors='replace').decode('ascii')
            print(f"\nItem {idx+1} HTML:\n{safe_item}")
    else:
        print("gamesnav not found")
except Exception as e:
    print("Error:", e)

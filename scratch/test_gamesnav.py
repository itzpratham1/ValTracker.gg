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
        # Find all divs with class "vm-stats-gamesnav-item" or similar, or all direct children
        # Usually it has items or buttons representing the maps
        items = gamesnav.find_all('div', {'class': 'js-map-switch'})
        if not items:
            items = gamesnav.find_all('div')
            
        print(f"Total items in gamesnav: {len(items)}")
        for idx, item in enumerate(items):
            classes = item.get('class', [])
            # Print text of item
            text = item.text.strip().replace('\n', ' ').replace('\t', '')
            # Clean spaces
            text = " ".join(text.split())
            print(f"Item {idx+1} classes: {classes} | text: {text}")
            
    else:
        print("gamesnav container NOT found!")
        
except Exception as e:
    print("Error:", e)

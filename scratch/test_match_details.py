import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Let's search all div elements that have some text or map-related names
    # Often, map name is listed inside <div class="map"> or inside the game buttons.
    # Let's search for text split, ascent, breeze, sunset inside the page and print their parent tags
    target_maps = ["split", "ascent", "breeze", "haven", "icebox", "lotus", "sunset", "bind", "abyss"]
    
    for tm in target_maps:
        elements = soup.find_all(text=re.compile(tm, re.IGNORECASE))
        print(f"\nMatches for '{tm}': {len(elements)}")
        for el in elements[:5]:
            parent = el.parent
            safe_parent = str(parent)[:150].encode('ascii', errors='replace').decode('ascii')
            print(f"  Parent tag: {parent.name} | classes: {parent.get('class', [])} | content: {safe_parent}")
            
except Exception as e:
    print("Error:", e)

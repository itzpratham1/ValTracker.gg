import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    scores = soup.find_all(class_=re.compile(r'^score$|^score\s+|score'))
    print(f"Total scores found: {len(scores)}")
    for idx, s in enumerate(scores):
        safe_s = str(s).encode('ascii', errors='replace').decode('ascii')
        print(f"\nScore {idx+1}: {safe_s}")
        
        # Trace parents
        parent = s.parent
        print(f"  Parent tag: {parent.name} | classes: {parent.get('class', [])}")
        
        gparent = parent.parent
        print(f"  Grandparent tag: {gparent.name} | classes: {gparent.get('class', [])}")
        
        ggparent = gparent.parent
        print(f"  Great-grandparent tag: {ggparent.name} | classes: {ggparent.get('class', [])}")
        
except Exception as e:
    print("Error:", e)

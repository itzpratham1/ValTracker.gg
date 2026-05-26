import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Let's search for elements with class names containing 'score' or text containing '13'
    # often map scores are in a structure like:
    # <div class="vm-stats-gameheader">
    #   <div class="team-score">13</div>
    # </div>
    
    elements = soup.find_all(class_=re.compile(r'score', re.IGNORECASE))
    print(f"Total elements matching class 'score' on page: {len(elements)}")
    for el in elements[:10]:
        safe_el = str(el)[:150].encode('ascii', errors='replace').decode('ascii')
        print(f"  Tag: {el.name} | classes: {el.get('class', [])} | text: {el.text.strip()} | content: {safe_el}")
        
    # Let's search for "13" text and print parents
    thirteens = soup.find_all(string=re.compile(r'^13$'))
    print(f"\nTotal elements with text '13': {len(thirteens)}")
    for el in thirteens[:10]:
        parent = el.parent
        safe_parent = str(parent)[:150].encode('ascii', errors='replace').decode('ascii')
        print(f"  Parent: {parent.name} | classes: {parent.get('class', [])} | text: {parent.text.strip()} | HTML: {safe_parent}")
        
except Exception as e:
    print("Error:", e)

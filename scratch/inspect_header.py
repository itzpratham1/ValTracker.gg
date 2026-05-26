import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf/?map=all"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print("Fetching VLR match page...")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Let's find dates and times
    print("\n--- Searching for moment-tz-convert ---")
    moments = soup.find_all(class_=re.compile('moment'))
    for m in moments[:10]:
        print(m.name, m.get('class'), m.text.strip(), m.get('data-current-ts'))
        
    print("\n--- Match Header Div Content ---")
    header_div = soup.find(class_='match-header')
    if header_div:
        # print first 500 characters of clean text
        print(re.sub(r'\s+', ' ', header_div.text.strip())[:600])
        
        # let's search for specific classes inside header_div
        print("\n--- Children of Match Header ---")
        for child in header_div.find_all(class_=True):
            print(child.name, child.get('class'), child.text.strip())
    else:
        print("match-header class not found")
            
except Exception as e:
    print("Error:", e)

import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://www.vlr.gg/681018/trace-esports-vs-titan-esports-club-china-evolution-series-2026-act-2-qf"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    print(f"Fetching match page: {url}")
    html = urllib.request.urlopen(req, timeout=10).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    vm_stats = soup.find('div', {'class': 'vm-stats'})
    if vm_stats:
        print("Found vm-stats!")
        # Print all direct children of vm-stats
        for idx, child in enumerate(vm_stats.find_all('div', recursive=False)):
            classes = child.get('class', [])
            print(f"Child {idx+1} classes: {classes}")
            
            # Let's inspect sub-children if it's games selectors
            # Usually there's a div class="vm-stats-control" or "vm-stats-gameheader"
            for sub in child.find_all('div', recursive=False):
                print(f"  Sub classes: {sub.get('class', [])}")
                
    else:
         print("vm-stats NOT found!")
         
except Exception as e:
    print("Error:", e)

import urllib.request
import re
from bs4 import BeautifulSoup

try:
    req = urllib.request.Request('https://www.vlr.gg/rankings/north-america', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    print('HTML length:', len(html))
    
    soup = BeautifulSoup(html, 'html.parser')
    teams = soup.find_all('tr')
    print('TR rows:', len(teams))
    if len(teams) > 1:
        print('First team row:', teams[1].text.strip()[:100].replace('\n', ' '))
except Exception as e:
    print('Error:', e)

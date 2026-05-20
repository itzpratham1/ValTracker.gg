import urllib.request
import re

url = 'https://www.vlr.gg/event/1998/champions-tour-2024-americas-stage-1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    print("HTML Length:", len(html))
    
    # Check for standings table
    tables = re.findall(r'<table class="wf-table[^>]*>(.*?)</table>', html, re.DOTALL)
    print("Tables found:", len(tables))
except Exception as e:
    print('Error:', e)

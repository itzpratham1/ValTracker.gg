import urllib.request
import re

url = 'https://www.vlr.gg/events'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req, timeout=10)
    print("Status:", response.status)
    html = response.read().decode('utf-8')
    print("HTML Length:", len(html))
    print("Contains 'event-item':", 'event-item' in html)
except Exception as e:
    print('Error:', e)

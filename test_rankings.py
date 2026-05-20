import requests
from bs4 import BeautifulSoup
headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://www.vlr.gg/rankings/na', headers=headers, timeout=10)
print('Rankings Status:', r.status_code)
soup = BeautifulSoup(r.text, 'html.parser')
items = soup.find_all('div', class_='rank-item')
print('Rank Items:', len(items))
if len(items) > 0:
    for item in items[:2]:
        name = item.find('div', class_='ge-text').text.strip()
        print('Team:', name)

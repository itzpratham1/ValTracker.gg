import json
import urllib.request
from bs4 import BeautifulSoup

def scrape_roster(team_id):
    url = f'https://www.vlr.gg/team/{team_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    roster = []
    name = soup.find('h1', {'class': 'wf-title'}).text.strip()
    logo = soup.find('div', {'class': 'team-header-logo'}).find('img')['src']
    if logo.startswith('//'): logo = 'https:' + logo
    for card in soup.find_all('div', {'class': 'team-roster-item'}):
        p_name = card.find('div', {'class': 'team-roster-item-name-alias'}).text.strip() if card.find('div', {'class': 'team-roster-item-name-alias'}) else ''
        real_name = card.find('div', {'class': 'team-roster-item-name-real'}).text.strip() if card.find('div', {'class': 'team-roster-item-name-real'}) else ''
        role = 'PLAYER'
        avatar = card.find('div', {'class': 'team-roster-item-img'}).find('img')['src'] if card.find('div', {'class': 'team-roster-item-img'}) else ''
        if avatar.startswith('//'): avatar = 'https:' + avatar
        if avatar == '' or 'ghost' in avatar:
            avatar = '/api/image?url=https://owcdn.net/img/65a3922c2a07e.png'
        else:
            avatar = '/api/image?url=' + avatar
        roster.append({'name': p_name, 'real_name': real_name, 'role': role, 'avatar': avatar})
    return {'id': str(team_id), 'name': name, 'logo': logo, 'roster': roster}

with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

fixes = {'17297': 474, '21093': 11181, '8185': 198, 'bleed_esports': 6646, 'titan_esports_club': 11258}

for r in d:
    for i, t in enumerate(d[r]):
        if t['id'] in fixes:
            new_id = fixes[t['id']]
            print('Fixing', t['name'], '-> ID', new_id)
            d[r][i] = scrape_roster(new_id)

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)
print('Fixed teams!')

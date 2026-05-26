import json
import urllib.request
import urllib.parse
import re
import time
from bs4 import BeautifulSoup

def get_real_vlr_id(team_name):
    if team_name == 'FunPlus Phoenix': return '4171'
    url = f'https://www.vlr.gg/search/?q={urllib.parse.quote(team_name)}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    m = re.search(r'/team/(\d+)/', html)
    if m: return m.group(1)
    return None

def scrape_roster(team_id):
    url = f'https://www.vlr.gg/team/{team_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    roster = []
    name_el = soup.find('h1', {'class': 'wf-title'})
    if not name_el: return None
    name = name_el.text.strip()
    logo_el = soup.find('div', {'class': 'team-header-logo'}).find('img')
    logo = logo_el['src'] if logo_el else ''
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

for r in ['americas', 'emea', 'pacific', 'china']:
    for i, t in enumerate(d[r]):
        if t['id'] == '6646' or t['name'] == 'BOOM Esports' or t['name'] == 'Bleed Esports':
            print('Replacing', t['name'], 'with Nongshim RedForce')
            d[r][i] = scrape_roster('11060')
            continue
        if not t.get('id', '').isdigit() or len(t.get('roster', [])) == 0:
            real_id = get_real_vlr_id(t['name'])
            if real_id:
                print('Fixing missing roster for', t['name'], '-> ID', real_id)
                new_data = scrape_roster(real_id)
                if new_data:
                    d[r][i] = new_data
            time.sleep(1)

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)
print('All missing rosters fixed!')

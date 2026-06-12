import json
import urllib.request
from bs4 import BeautifulSoup

def scrape_roster(team_id):
    url = f'https://www.vlr.gg/team/{team_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    roster = []
    name_el = soup.find('h1', {'class': 'wf-title'})
    if not name_el: return None
    name = name_el.text.strip()
    logo_div = soup.find('div', {'class': 'team-header-logo'})
    logo_el = logo_div.find('img') if logo_div else None
    logo = logo_el['src'] if logo_el and logo_el.has_attr('src') else ''
    if logo.startswith('//'): logo = 'https:' + logo
    for card in soup.find_all('div', {'class': 'team-roster-item'}):
        p_name = card.find('div', {'class': 'team-roster-item-name-alias'}).text.strip() if card.find('div', {'class': 'team-roster-item-name-alias'}) else ''
        real_name = card.find('div', {'class': 'team-roster-item-name-real'}).text.strip() if card.find('div', {'class': 'team-roster-item-name-real'}) else ''
        role = 'PLAYER'
        avatar_el = card.find('div', {'class': 'team-roster-item-img'})
        avatar_img = avatar_el.find('img') if avatar_el else None
        avatar = avatar_img['src'] if avatar_img and avatar_img.has_attr('src') else ''
        if avatar.startswith('//'): avatar = 'https:' + avatar
        if avatar == '' or 'ghost' in avatar:
            avatar = '/api/image?url=https://owcdn.net/img/65a3922c2a07e.png'
        else:
            avatar = '/api/image?url=' + avatar
        roster.append({'name': p_name, 'real_name': real_name, 'role': role, 'avatar': avatar})
    return {'id': str(team_id), 'name': name, 'logo': logo, 'roster': roster}

with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

fixes = {'Talon Esports': '8304', '0': '11328', 'JD Gaming': '13078'}

for r in d:
    for i, t in enumerate(d[r]):
        if t['name'] in fixes:
            new_id = fixes[t['name']]
            d[r][i] = scrape_roster(new_id)

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)
print('Fixed!')

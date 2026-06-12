import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import time
import sys

def scrape_roster(team_id):
    if team_id == 'xlg_esports':
        return {'id': 'xlg_esports', 'name': 'XLG Esports', 'logo': 'https://owcdn.net/img/65a3922c2a07e.png', 'roster': []}
    
    url = f'https://www.vlr.gg/team/{team_id}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=5).read()
    except Exception as e:
        print(f"Failed to fetch {team_id}: {e}")
        return {'id': str(team_id), 'name': f'Team {team_id}', 'logo': 'https://owcdn.net/img/65a3922c2a07e.png', 'roster': []}
        
    soup = BeautifulSoup(html, 'html.parser')
    roster = []
    name_el = soup.find('h1', {'class': 'wf-title'})
    if not name_el:
        return {'id': str(team_id), 'name': f'Team {team_id}', 'logo': 'https://owcdn.net/img/65a3922c2a07e.png', 'roster': []}
    name = name_el.text.strip()
    
    logo_div = soup.find('div', {'class': 'team-header-logo'})
    logo_el = logo_div.find('img') if logo_div else None
    logo = logo_el['src'] if logo_el and logo_el.has_attr('src') else ''
    if logo.startswith('//'): logo = 'https:' + logo
    
    for card in soup.find_all('div', {'class': 'team-roster-item'}):
        p_name = card.find('div', {'class': 'team-roster-item-name-alias'})
        p_name = p_name.text.strip() if p_name else ''
        real_name = card.find('div', {'class': 'team-roster-item-name-real'})
        real_name = real_name.text.strip() if real_name else ''
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

vct_2026_ids = {
    'pacific': ['278', '198', '4050', '17', '918', '624', '878', '14', '6199', '5448', '11060', '11229'],
    'americas': ['120', '188', '5248', '2406', '2355', '2359', '6961', '7386', '1034', '2', '11058', '427'],
    'emea': ['397', '2593', '1184', '11181', '15119', '8877', '21715', '1001', '474', '2059', '6392', '3478', '18019'],
    'china': ['1119', '12010', '1120', '11328', '13078', '12064', '11258', '12685', '731', '13790', '11981', 'xlg_esports']
}

try:
    with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
except Exception:
    d = {'others': []}

for region, ids in vct_2026_ids.items():
    print(f"Building {region}...", flush=True)
    d[region] = []
    for tid in ids:
        print(f"  Scraping {tid}...", end=' ', flush=True)
        team_data = scrape_roster(tid)
        print(f"-> {team_data['name']}", flush=True)
        d[region].append(team_data)
        time.sleep(0.1)

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)

print("Done building VCT 2026 teams!", flush=True)

import json
import requests
import concurrent.futures
from bs4 import BeautifulSoup

with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def scrape_team(t):
    if not t.get('id'): return t
    try:
        r = requests.get(f"https://www.vlr.gg/team/{t['id']}/", headers={'User-Agent':'Mozilla'}, timeout=5)
        if r.status_code != 200: return t
        soup = BeautifulSoup(r.text, 'html.parser')
        roster = []
        for p in soup.find_all('div', class_='team-roster-item'):
            alias = p.find('div', class_='team-roster-item-name-alias')
            real = p.find('div', class_='team-roster-item-name-real')
            role_el = p.find('div', class_='team-roster-item-name-role')
            img_el = p.find('img')
            
            if alias:
                avatar = img_el['src'] if img_el else ''
                if avatar == '/img/vlr/tmp/vlr.png':
                    avatar = ''
                elif avatar.startswith('//'):
                    avatar = 'https:' + avatar
                
                if 'owcdn.net' in avatar or 'liquipedia.net' in avatar:
                    avatar = f'/api/image?url={avatar}'
                    
                roster.append({
                    'name': alias.text.strip(),
                    'real_name': real.text.strip() if real else '',
                    'role': 'COACH' if role_el and 'coach' in role_el.text.lower() else 'PLAYER',
                    'avatar': avatar
                })
        t['roster'] = roster
    except Exception as e:
        pass
    return t

tasks = []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    for region, teams in data.items():
        for i, t in enumerate(teams):
            tasks.append((region, i, executor.submit(scrape_team, t)))
            
for region, i, future in tasks:
    data[region][i] = future.result()

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

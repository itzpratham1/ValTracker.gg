import json
with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
for r in ['americas', 'emea', 'pacific', 'china']:
    print('---', r, '---')
    for t in d[r]:
        print(t['id'], t['name'])

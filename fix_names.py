import json

fixes = {'278': 'DetonatioN FocusMe', '198': 'DRX', '4050': 'FULL SENSE', '17': 'Gen.G', '918': 'Global Esports', '624': 'Paper Rex', '878': 'Rex Regum Qeon', '14': 'T1', '6199': 'Team Secret', '5448': 'ZETA DIVISION', '11060': 'Nongshim RedForce', '11229': 'VARREL', '120': '100 Thieves', '188': 'Cloud9', '5248': 'Evil Geniuses', '2406': 'FURIA', '2355': 'KR Esports', '2359': 'Leviatn', '6961': 'LOUD', '7386': 'MIBR', '1034': 'NRG', '2': 'Sentinels', '11058': 'G2 Esports', '427': 'ENVY', '397': 'BBL Esports', '2593': 'Fnatic', '1184': 'FUT Esports', '11181': 'Gentle Mates', '15119': 'GIANTX', '8877': 'Karmine Corp', '21715': 'Natus Vincere', '1001': 'Team Heretics', '474': 'Team Liquid', '2059': 'Team Vitality', '6392': 'Eternal Fire', '3478': 'PCIFIC Esports', '18019': 'ULF Esports', '1119': 'All Gamers', '12010': 'Bilibili Gaming', '1120': 'EDward Gaming', '11328': 'FunPlus Phoenix', '13078': 'JD Gaming', '12064': 'Nova Esports', '11258': 'Titan Esports Club', '12685': 'Trace Esports', '731': 'TYLOO', '13790': 'Wolves Esports', '11981': 'Dragon Ranger Gaming', 'xlg_esports': 'XLG Esports'}

with open('public/vct_teams.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for r in d:
    if r == 'others': continue
    for t in d[r]:
        if t['id'] in fixes:
            t['name'] = fixes[t['id']]

with open('public/vct_teams.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=4)
print('Names fixed!')

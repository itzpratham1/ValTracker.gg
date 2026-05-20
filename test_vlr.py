import requests
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    print('Testing VLR scraping...')
    r = requests.get('https://www.vlr.gg/rankings/na', headers=headers, timeout=10)
    print('Status:', r.status_code)
    
    # Simple regex fallback if bs4 is not installed
    import re
    teams = re.findall(r'<div class="ge-text">([^<]+)</div>', r.text)
    print('Teams found via regex:', len(teams))
    if len(teams) > 0:
        print('Top 5 teams:', [t.strip() for t in teams[:5]])
except Exception as e:
    print('Error:', e)

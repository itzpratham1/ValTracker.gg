import urllib.request, urllib.parse, re
for t in ['FULL SENSE', 'VARREL', 'ENVY', 'Eternal Fire', 'PCIFIC Esports', 'ULF Esports', 'XLG Esports']:
    url = f'https://www.vlr.gg/search/?q={urllib.parse.quote(t)}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        m = re.search(r'/team/(\d+)/', html)
        print(f'{t}: {m.group(1) if m else "Not found"}')
    except Exception as e:
        print(f'{t}: Error {e}')

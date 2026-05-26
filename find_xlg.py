import urllib.request, urllib.parse, re
url = f'https://www.vlr.gg/search/?q={urllib.parse.quote("XLG Esports")}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    matches = re.finditer(r'/team/(\d+)/([^\"\'\>]+)', html)
    print([(m.group(1), m.group(2)) for m in matches][:5])
except Exception as e:
    print(f'Error {e}')

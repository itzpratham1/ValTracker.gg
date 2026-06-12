with open('public/index.html', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')
esp = soup.find(id='esports-view')
if esp:
    curr = esp.parent
    while curr and curr.name != '[document]':
        print(f"{curr.name} id={curr.get('id')} class={curr.get('class')}")
        curr = curr.parent
else:
    print('esports-view not found')

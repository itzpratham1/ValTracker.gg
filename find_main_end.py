lines = open('public/index.html', encoding='utf-8').readlines()
div_count = 0
in_main = False
for i, line in enumerate(lines):
    if 'id="main-grid"' in line:
        in_main = True
    
    if in_main:
        div_count += line.count('<div')
        div_count -= line.count('</div')
        if div_count == 0:
            print(f"End of main-grid at Line {i+1}")
            break

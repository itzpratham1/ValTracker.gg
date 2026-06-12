with open('public/index.html', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'class="main"' in line or "class='main'" in line or 'class="main ' in line:
            print(f"Line {i+1}: {line.strip()}")
            break

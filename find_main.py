for i, line in enumerate(open('public/index.html', encoding='utf-8')):
    if 'class="main"' in line or "class='main'" in line or 'class="main ' in line:
        print(f"Line {i+1}: {line.strip()}")
        break

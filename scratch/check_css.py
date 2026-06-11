def check_css_braces(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    open_braces = 0
    close_braces = 0
    in_comment = False
    in_string = False
    string_char = None
    
    i = 0
    errors = []
    line_num = 1
    col_num = 1
    
    # We can do a simpler character-by-character scan
    while i < len(content):
        c = content[i]
        
        if c == '\n':
            line_num += 1
            col_num = 1
        else:
            col_num += 1
            
        if in_comment:
            if c == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
                i += 2
                col_num += 1
                continue
        elif in_string:
            if c == '\\':
                i += 2
                col_num += 1
                continue
            elif c == string_char:
                in_string = False
        else:
            if c == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_comment = True
                i += 2
                col_num += 1
                continue
            elif c in ('"', "'"):
                in_string = True
                string_char = c
            elif c == '{':
                open_braces += 1
            elif c == '}':
                close_braces += 1
                if close_braces > open_braces:
                    errors.append(f"Unmatched closing brace at line {line_num}, col {col_num}")
        i += 1
        
    print(f"Total open braces: {open_braces}")
    print(f"Total closing braces: {close_braces}")
    if open_braces != close_braces:
        print("WARNING: Braces count mismatch!")
    for err in errors:
        print(err)

check_css_braces('public/index.css')

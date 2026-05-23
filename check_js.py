import re

def check_js_syntax(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    
    script_match = re.search(r'<script>(.*?)</script>', data, re.DOTALL)
    if not script_match:
        print("No <script> block found.")
        return
        
    s = script_match.group(1)
    
    # We will just strip out line 684 entirely to avoid the regex literal bug
    lines = s.split('\n')
    for i in range(len(lines)):
        if "replace(/\//g,'')" in lines[i]:
            lines[i] = lines[i].replace("replace(/\//g,'')", "replace('', '')")
            
    s = '\n'.join(lines)
    
    # Remove strings
    s = re.sub(r'(["\'])(?:(?=(\\?))\2.)*?\1', '""', s)
    # Remove template literals
    s = re.sub(r'`(?:[^`\\]|\\.)*`', '``', s)
    # Remove line comments
    s = re.sub(r'//.*', '', s)
    # Remove block comments
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    
    braces = {'(': ')', '{': '}', '[': ']'}
    stack = []
    
    lines = s.split('\n')
    line_no = 511 # Assuming script starts at 510
    
    for i, line in enumerate(lines):
        for j, c in enumerate(line):
            if c in braces:
                stack.append((c, line_no + i, j))
            elif c in braces.values():
                if not stack:
                    print(f"Unmatched {c} at line {line_no + i}")
                    return
                top, l, col = stack.pop()
                if braces[top] != c:
                    print(f"Mismatched {c} at line {line_no + i} (expected {braces[top]})")
                    return
    
    if stack:
        print(f"Unclosed {stack[-1][0]} from line {stack[-1][1]}")
    else:
        print("Braces seem balanced!")

check_js_syntax('public/index.html')

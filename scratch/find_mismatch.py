import re

with open('public/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    html_content = f.read()

# Find the script tag start line
lines = html_content.split('\n')
script_start_line = 0
for idx, line in enumerate(lines):
    if '<script>' in line:
        script_start_line = idx + 1
        break

print(f"Script tag starts at line: {script_start_line}")

script_match = re.search(r'<script>(.*?)</script>', html_content, re.DOTALL)
if script_match:
    s = script_match.group(1)
    script_lines = s.split('\n')
    
    # Let's perform brace matching while keeping track of original HTML line numbers!
    # Strip comments and strings, but keep track of line index
    braces = {'(': ')', '{': '}', '[': ']'}
    stack = []
    
    for i, raw_line in enumerate(script_lines):
        html_line_no = script_start_line + i
        
        # Clean line for matching by replacing strings with mock characters
        # Replace line comments
        line = re.sub(r'//.*', '', raw_line)
        # We also simplify string constants in matching
        line = re.sub(r'(["\'])(?:(?=(\\?))\2.)*?\1', '""', line)
        line = re.sub(r'`(?:[^`\\]|\\.)*`', '``', line)
        
        for j, c in enumerate(line):
            if c in braces:
                stack.append((c, html_line_no, j, raw_line))
            elif c in braces.values():
                if not stack:
                    print(f"Unmatched closing {c} at HTML Line {html_line_no}: {raw_line.strip()}")
                    sys.exit(1)
                top, l, col, src_line = stack.pop()
                if braces[top] != c:
                    print(f"Mismatched closing {c} at HTML Line {html_line_no} (expected {braces[top]})")
                    print(f"  Current Line: {raw_line.strip()}")
                    print(f"  Opened {top} at HTML Line {l}: {src_line.strip()}")
                    import sys
                    sys.exit(0)
                    
    if stack:
        print(f"Unclosed {stack[-1][0]} from HTML Line {stack[-1][1]}: {stack[-1][3].strip()}")
    else:
        print("Braces seem balanced!")
else:
    print("No script block found")

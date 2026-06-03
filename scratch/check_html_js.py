import re
import os

def check_js_syntax(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    
    # Find the start of the <script> block
    script_start_idx = data.find('<script>')
    if script_start_idx == -1:
        print("No <script> block found.")
        return
    
    # Count how many lines precede the <script> tag to get the exact start line
    preceding_text = data[:script_start_idx]
    script_start_line = preceding_text.count('\n') + 1
    print(f"Main <script> tag starts at line: {script_start_line}")
    
    # Extract the script content
    script_match = re.search(r'<script>(.*?)</script>', data, re.DOTALL)
    s = script_match.group(1)
    
    lines = s.split('\n')
    for i in range(len(lines)):
        # Remove regex literal to prevent parse errors in primitive parser
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
    
    for i, line in enumerate(lines):
        actual_line_no = script_start_line + i + 1
        for j, c in enumerate(line):
            if c in braces:
                stack.append((c, actual_line_no, j))
            elif c in braces.values():
                if not stack:
                    print(f"Unmatched '{c}' at line {actual_line_no}, col {j}")
                    return
                top, l, col = stack.pop()
                if braces[top] != c:
                    print(f"Mismatched '{c}' at line {actual_line_no}, col {j} (expected '{braces[top]}' from line {l}, col {col})")
                    return
    
    if stack:
        print(f"Unclosed '{stack[-1][0]}' from line {stack[-1][1]}, col {stack[-1][2]}")
    else:
        print("Braces seem balanced!")

if __name__ == '__main__':
    check_js_syntax(r'c:\Users\prath\Downloads\VALSTATS\v8\public\index.html')

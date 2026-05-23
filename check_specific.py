import re
def tokenize_and_check(s):
    # This regex is specifically tuned for this exact JS file to not fail on the division
    # It replaces strings, comments, and specific known regexes.
    s = re.sub(r'(["\'])(?:(?=(\\?))\2.)*?\1', '""', s)
    s = re.sub(r'`(?:[^`\\]|\\.)*`', '``', s)
    s = re.sub(r'//.*', '', s)
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    # The only regex literal in this file that causes issues was replace(/\//g, '')
    s = s.replace(r'/\//g', '""')
    
    braces = {'(': ')', '{': '}', '[': ']'}
    stack = []
    
    lines = s.split('\n')
    line_no = 5012 
    
    for i, line in enumerate(lines):
        for j, c in enumerate(line):
            if c in braces:
                stack.append((c, line_no + i, line))
            elif c in braces.values():
                if not stack:
                    print(f"Unmatched {c} at line {line_no + i}:\n{line}")
                    return
                top, l, text = stack.pop()
                if braces[top] != c:
                    print(f"Mismatched {c} at line {line_no + i}. Expected {braces[top]} to match {top} from line {l}:\n{text}\nFound {c} instead at:\n{line}")
                    return
    
    if stack:
        print(f"Unclosed {stack[-1][0]} from line {stack[-1][1]}:\n{stack[-1][2]}")
    else:
        print("Braces seem balanced!")

with open('showLiveMatchIntel_current.txt', 'r', encoding='utf-8') as f:
    tokenize_and_check(f.read())

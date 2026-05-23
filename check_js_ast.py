import re
import sys
from pyjsparser import parse

def check_js_syntax(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    
    script_match = re.search(r'<script>(.*?)</script>', data, re.DOTALL)
    if not script_match:
        print("No <script> block found.")
        return
        
    s = script_match.group(1)
    
    # Strip ES6+ syntax that pyjsparser might choke on, VERY roughly
    # This is just to find the real brace mismatch!
    s = s.replace('?.', '.')
    s = s.replace('??', '||')
    
    try:
        parse(s)
        print("Syntax is perfect!")
    except Exception as e:
        print("Syntax error!")
        print(e)

if __name__ == '__main__':
    check_js_syntax('public/index.html')

import re

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

script_match = re.search(r'<script>([\s\S]*?)<\/script>', content)
if script_match:
    js = script_match.group(1)
    
    # We want to extract renderMatches function
    # Let's search for "function renderMatches" and find its boundaries by parsing braces
    def extract_function(name, code):
        start = code.find(f"function {name}")
        if start == -1:
            return None
        
        braces = 0
        in_func = False
        end = start
        for i in range(start, len(code)):
            c = code[i]
            if c == '{':
                braces += 1
                in_func = True
            elif c == '}':
                braces -= 1
            
            if in_func and braces == 0:
                end = i + 1
                break
        return code[start:end]

    print("--- buildMatchAnalysis ---")
    fn_code = extract_function("buildMatchAnalysis", js)
    if fn_code:
        print(fn_code[11000:14500].encode('ascii', errors='replace').decode('ascii'))

    print("\n--- runMatchAnalysis ---")
    fn_code_2 = extract_function("runMatchAnalysis", js)
    if fn_code_2:
        print(fn_code_2[:3000].encode('ascii', errors='replace').decode('ascii'))

else:
    print("No script tag found")

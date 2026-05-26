import re

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

script_match = re.search(r'<script>([\s\S]*?)<\/script>', content)
if script_match:
    js = script_match.group(1)
    
    def extract_function(name, code):
        start = code.find(f"function {name}")
        if start == -1:
            # try async function
            start = code.find(f"async function {name}")
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

    for fn in ["evaluateDraft"]:
        code = extract_function(fn, js)
        if code:
            with open(f"scratch/{fn}.js", "w", encoding="utf-8") as out:
                out.write(code)
            print(f"Extracted {fn} to scratch/{fn}.js of size {len(code)}")
        else:
            print(f"Failed to find {fn}")
else:
    print("No script tag found")

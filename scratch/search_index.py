import re

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

script_match = re.search(r'<script>([\s\S]*?)<\/script>', content)
if script_match:
    js = script_match.group(1)
    
    # Find all function names
    funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', js)
    print("Found functions:", len(funcs))
    for fn in sorted(funcs):
        if any(term in fn.lower() for term in ["match", "render", "show", "card", "display"]):
            print(f" - {fn}")
else:
    print("No script tag found")

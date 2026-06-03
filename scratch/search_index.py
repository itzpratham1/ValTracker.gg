import sys

def safe_print(text):
    sys.stdout.buffer.write(text.encode('utf-8') + b'\n')

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
funcs = ["toggleSession", "renderSessionBanner", "startSession", "stopSession"]
for func in funcs:
    matches = [m.start() for m in re.finditer(r'function\s+' + func, content)]
    for m in matches:
        start_line = content[:m].count('\n') + 1
        safe_print(f"=== {func} defined at line {start_line} ===")
        lines = content[m:m+1500].split('\n')
        for idx, l in enumerate(lines[:30]):
            safe_print(f"  {start_line + idx}: {l}")
        safe_print("-" * 50)

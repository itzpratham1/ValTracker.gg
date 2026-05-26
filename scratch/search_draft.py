import re

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("--- Searching for draft/coach/synergy keywords ---")
for idx, line in enumerate(lines):
    line_num = idx + 1
    # Check if keywords appear in line
    if any(term in line.lower() for term in ["draft", "coach", "synergy"]):
        safe_line = line.strip()[:120].encode('ascii', errors='replace').decode('ascii')
        print(f"Line {line_num:4d}: {safe_line}")

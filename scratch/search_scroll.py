with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("--- Searching for initScrollSpy in index.html ---")
for idx, line in enumerate(lines):
    if "initscrollspy" in line.lower() or "scroll" in line.lower():
        if "function" in line or "addeventlistener" in line:
            print(f"Line {idx+1:4d}: {line.strip()[:120]}")

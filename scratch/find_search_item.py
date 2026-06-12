with open("public/index.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "search-item-name" in line:
        print(f"Line {idx+1}: {repr(line)}")

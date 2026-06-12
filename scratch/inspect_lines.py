with open("public/index.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "agents-wrap" in line:
        print(f"Line {i+1}: {repr(line)}")
    if "loading-subtitle-text" in line or "SYNCING" in line:
        print(f"Line {i+1}: {repr(line)}")
    if "stat-modal-avgs" in line:
        print(f"Line {i+1}: {repr(line)}")
    if "h2h-content" in line:
        print(f"Line {i+1}: {repr(line)}")
    if "overlay-preview-sandbox" in line:
        print(f"Line {i+1}: {repr(line)}")

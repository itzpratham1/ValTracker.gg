with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if ".dc-insight-card" in line and "{" in line:
        safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
        print(f"Line {i+1}: {safe_line[:120]}")
        start = i
        end = min(len(lines), i + 20)
        for j in range(start, end):
            safe_l = lines[j].encode('ascii', errors='replace').decode('ascii')
            print(f"{j+1}: {safe_l}", end="")
        break

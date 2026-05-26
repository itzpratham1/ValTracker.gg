with open("app.py", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "ALLOWED_PROXY_PREFIXES" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print next 10 lines
        start = i
        end = min(len(lines), i + 10)
        for j in range(start, end):
            print(f"{j+1}: {lines[j]}", end="")
        break

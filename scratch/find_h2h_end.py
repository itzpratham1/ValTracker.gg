with open("public/index.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

h2h_start = 8444
for idx in range(h2h_start, len(lines)):
    line = lines[idx]
    if "`;" in line:
        print(f"Line {idx+1}: contains `;`")
        # print first 10 characters of line to see what it is
        print(f"Line starts with: {repr(line[:20])}")
        break

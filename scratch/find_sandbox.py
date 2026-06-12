with open("public/index.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "overlay-preview-sandbox" in line and "innerHTML = `" in line:
        print(f"Start at Line {idx+1}")
        # Find end line
        for end_idx in range(idx+1, len(lines)):
            if "`;" in lines[end_idx]:
                print(f"End at Line {end_idx+1}")
                break

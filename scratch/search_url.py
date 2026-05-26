with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("--- Searching for checkUrlParams / landingFetch in index.html ---")
for idx, line in enumerate(lines):
    if "checkurlparams" in line.lower() or "landingfetch" in line.lower() or "setmyprofile" in line.lower():
        safe_line = line.strip()[:120].encode('ascii', errors='replace').decode('ascii')
        print(f"Line {idx+1:4d}: {safe_line}")

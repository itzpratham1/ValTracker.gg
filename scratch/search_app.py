with open("app.py", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print("--- Searching for Flask initialization in app.py ---")
for idx, line in enumerate(lines):
    if "Flask(" in line:
        print(f"Line {idx+1:4d}: {line.strip()}")

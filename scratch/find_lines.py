import sys

# Set standard output encoding to utf-8 to avoid console encoding issues
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "runMatchAnalysis" in line:
        # Use ascii representation or print safely
        safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
        print(f"Line {i+1}: {safe_line}")

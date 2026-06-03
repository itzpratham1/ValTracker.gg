with open("public/overlay.css", "r", encoding="utf-8") as f:
    content = f.read()

# Count braces
open_braces = content.count("{")
close_braces = content.count("}")

print(f"Open braces: {open_braces}")
print(f"Close braces: {close_braces}")

if open_braces != close_braces:
    print("[ERROR] Mismatched braces in overlay.css!")
else:
    print("[SUCCESS] Braces match in overlay.css.")

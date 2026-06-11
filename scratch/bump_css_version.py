import os

html_path = r"c:\Users\prath\Downloads\VALSTATS\v8\public\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

target_ver = '<link rel="stylesheet" href="index.css?v=13.11">'
replacement_ver = '<link rel="stylesheet" href="index.css?v=13.12">'

if target_ver in content:
    content = content.replace(target_ver, replacement_ver)
    print("Bumped version to 13.12")
else:
    print("CSS version link not found or already bumped!")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished!")

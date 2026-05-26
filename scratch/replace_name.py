with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    html_content = f.read()

# Let's count occurrences first
occurrences = html_content.count("Draft Coach")
print(f"Total occurrences of 'Draft Coach': {occurrences}")

# Perform targeted replacements
updated_content = html_content

# 1. Topbar Navigation Tab
old_tab = '<div class="topbar-tab" id="tab-coach" onclick="toggleMainView(\'coach\')">Draft Coach</div>'
new_tab = '<div class="topbar-tab" id="tab-coach" onclick="toggleMainView(\'coach\')">Meta Comp Architect</div>'
if old_tab in updated_content:
    updated_content = updated_content.replace(old_tab, new_tab)
    print("Updated Topbar Navigation Tab!")

# 2. Main Header
old_header = 'VCT Draft Coach & Synergy Board'
new_header = 'VCT Meta Comp Architect'
if old_header in updated_content:
    updated_content = updated_content.replace(old_header, new_header)
    print("Updated Main Header!")

# Check if there are any other occurrences of "Draft Coach"
remaining = updated_content.count("Draft Coach")
if remaining > 0:
    print(f"Remaining instances of 'Draft Coach' found: {remaining}")
    # Replace general occurrences if applicable, but keep it clean
    updated_content = updated_content.replace("Draft Coach", "Meta Comp Architect")
    print("Replaced remaining general occurrences.")

# Save changes back to index.html
with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(updated_content)

print("Renaming fully completed!")

import re

with open("public/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Find style block
style_match = re.search(r'<style>([\s\S]*?)<\/style>', content)
if not style_match:
    print("No style tag found!")
    exit(1)

styles = style_match.group(1)

# Split by } to parse rules
rules = re.split(r'\}', styles)
cleaned_rules = []
removed_selectors = []

for r in rules:
    r_strip = r.strip()
    if not r_strip:
        continue
    
    # Extract selector
    parts = r_strip.split('{')
    selector = parts[0].strip()
    
    # Check if selector contains topbar/logo/player-search etc.
    # Note: we need to be careful with media queries.
    # If the selector has a media query like @media(max-width: 800px) { \n .topbar, we should check both parts.
    has_keyword = False
    
    keywords = ['topbar', 'logo', 'player-search', 'player-input', 'player-active', 'active-pill', 'mobile-filter', 'copy-riot-btn']
    
    for kw in keywords:
        if kw in selector.lower():
            has_keyword = True
            break
            
    # Also check if it's inside a media query block where the selector inside it contains the keyword.
    if '{' in r_strip:
        body = parts[1].strip()
        if any(kw in body.lower() for kw in keywords):
            # If the block itself has topbar-related rules, we need to inspect it.
            # E.g. @media(max-width: 800px) { ... }
            # If the media query has other rules, we should only remove the topbar rules, not the whole media query!
            pass
            
    if has_keyword:
        removed_selectors.append(selector)
    else:
        cleaned_rules.append(r + "}")

print(f"Removed selectors: {len(removed_selectors)}")
print("Sample removed:")
for s in removed_selectors[:15]:
    print(f" - {s.strip().replace('\n', ' ')}")

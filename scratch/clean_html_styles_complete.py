import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def parse_css_rules(css_text):
    rules = []
    current_rule = []
    brace_count = 0
    
    for char in css_text:
        current_rule.append(char)
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                rules.append("".join(current_rule))
                current_rule = []
                
    if current_rule:
        rules.append("".join(current_rule))
        
    return rules

def should_remove_selector(selector):
    keywords = [
        'topbar', 'logo', 'player-search', 'player-input', 'player-active', 
        'active-pill', 'mobile-filter', 'copy-riot-btn', 'region-select', 
        'mode-select', 'act-select', 'fetch-btn', 'filter-item', 
        'filter-divider', 'filter-capsule', 'tracker-divider',
        'filter-icon', 'filter-icon-svg', 'chevron-icon'
    ]
    sel_lower = selector.lower()
    return any(kw in sel_lower for kw in keywords)

def clean_css(css_text):
    rules = parse_css_rules(css_text)
    cleaned_rules = []
    
    for rule in rules:
        rule_strip = rule.strip()
        if not rule_strip:
            continue
            
        # Robust media query check: contains @media before the first open brace
        first_brace = rule_strip.find('{')
        if first_brace != -1 and '@media' in rule_strip[:first_brace]:
            media_header = rule_strip[:first_brace].strip()
            # Extract content between first { and last }
            media_content = rule_strip[first_brace+1:].rstrip()
            if media_content.endswith('}'):
                media_content = media_content[:-1].strip()
                
            # Parse media content recursively
            inner_rules = parse_css_rules(media_content)
            cleaned_inner = []
            for ir in inner_rules:
                ir_strip = ir.strip()
                if not ir_strip:
                    continue
                parts = ir_strip.split('{', 1)
                if len(parts) == 2:
                    sel = parts[0].strip()
                    if not should_remove_selector(sel):
                        cleaned_inner.append(ir_strip)
                        
            if cleaned_inner:
                cleaned_rules.append(f"{media_header} {{\n  " + "\n  ".join(cleaned_inner) + "\n}")
        else:
            parts = rule_strip.split('{', 1)
            sel = parts[0].strip()
            if not should_remove_selector(sel):
                cleaned_rules.append(rule_strip)
                
    return "\n\n".join(cleaned_rules)

with open("public/index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

style_match = re.search(r'<style>([\s\S]*?)<\/style>', html_content)
if not style_match:
    print("No style block found!")
    sys.exit(1)

original_styles = style_match.group(1)
cleaned_styles = clean_css(original_styles)

# Update index.html content
updated_html = html_content.replace(original_styles, cleaned_styles)

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(updated_html)

print("Successfully cleaned ALL topbar, filter, and media query style tag overrides from public/index.html!")
print(f"Original styles length: {len(original_styles)} -> Cleaned: {len(cleaned_styles)}")

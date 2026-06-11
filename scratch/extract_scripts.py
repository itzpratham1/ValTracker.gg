import os
import re

public_dir = r"c:\Users\prath\Downloads\VALSTATS\v8\public"

# Helper list of PNGs that we converted to WebP
png_to_webp_map = {
    "stats_tracker_card.png": "stats_tracker_card.webp",
    "Val_bot_analysis.png": "Val_bot_analysis.webp",
    "deep_analysis.png": "deep_analysis.webp",
    "skin_store.png": "skin_store.webp",
    "meta_comp.png": "meta_comp.webp",
    "obs_overlay.png": "obs_overlay.webp",
    "valorant_v_logo.png": "valorant_v_logo.webp",
    "VCT_Esports.png": "VCT_Esports.webp"
}

def replace_png_references(content):
    for png, webp in png_to_webp_map.items():
        content = content.replace(f"/{png}", f"/{webp}")
        content = content.replace(f"\"{png}\"", f"\"{webp}\"")
        content = content.replace(f"'{png}'", f"'{webp}'")
    return content

# 1. Process index.html
index_path = os.path.join(public_dir, "index.html")
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Match the script block immediately following <div class="toast" id="toast"></div>
    pattern = re.compile(r'(<div class="toast" id="toast"></div>\s*)\n<script>(.*?)</script>', re.DOTALL)
    match = pattern.search(content)
    if match:
        prefix = match.group(1)
        js_content = match.group(2)
        
        # Write external JS
        index_js_path = os.path.join(public_dir, "index.js")
        with open(index_js_path, "w", encoding="utf-8") as f_js:
            f_js.write(js_content.strip())
        print(f"Extracted index.html script to index.js ({len(js_content)} chars)")
        
        # Replace script in index.html with reference
        replacement = f'{prefix}\n<script src="index.js?v=1.0" defer></script>'
        new_content = pattern.sub(replacement, content)
        
        # Replace PNG references
        new_content = replace_png_references(new_content)
        
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated index.html successfully.")
    else:
        print("Error: Could not locate the script block in index.html using regex")

import os

def main():
    js_path = r"public/index.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Define the exact replacements
    replacements = {
        # 1. agentsWrap, mapsWrap, clutchWrap, matchesList
        "const agentsWrap = document.getElementById('agents-wrap'); if(agentsWrap) agentsWrap.innerHTML='": "const agentsWrap = document.getElementById('agents-wrap'); if(agentsWrap) safeSetInnerHtml('agents-wrap', '",
        "const mapsWrap = document.getElementById('maps-wrap'); if(mapsWrap) mapsWrap.innerHTML='": "const mapsWrap = document.getElementById('maps-wrap'); if(mapsWrap) safeSetInnerHtml('maps-wrap', '",
        "const clutchWrap = document.getElementById('clutch-wrap'); if(clutchWrap) clutchWrap.innerHTML='": "const clutchWrap = document.getElementById('clutch-wrap'); if(clutchWrap) safeSetInnerHtml('clutch-wrap', '",
        "const matchesList = document.getElementById('matches-list'); if(matchesList) matchesList.innerHTML='": "const matchesList = document.getElementById('matches-list'); if(matchesList) safeSetInnerHtml('matches-list', '",
        
        # 2. rank-icon & peak-icon
        "document.getElementById('rank-icon').innerHTML=rankImgUrl?": "safeSetInnerHtml('rank-icon', rankImgUrl?",
        "document.getElementById('peak-icon').innerHTML=peakImg?": "safeSetInnerHtml('peak-icon', peakImg?",
        
        # 3. tabcontent error messages
        "document.getElementById(`tabcontent-${idx}-performance`).innerHTML = err;": "safeSetInnerHtml(`tabcontent-${idx}-performance`, escapeHtml(err));",
        "document.getElementById(`tabcontent-${idx}-duels`).innerHTML = err;": "safeSetInnerHtml(`tabcontent-${idx}-duels`, escapeHtml(err));",
        "document.getElementById(`tabcontent-${idx}-timeline`).innerHTML = err;": "safeSetInnerHtml(`tabcontent-${idx}-timeline`, escapeHtml(err));",
        
        # 4. tabcontent success messages
        "document.getElementById(`tabcontent-${idx}-performance`).innerHTML = perfHtml;": "safeSetInnerHtml(`tabcontent-${idx}-performance`, perfHtml);",
        
        # 5. AI stats grid
        "document.getElementById('ai-stats-grid').innerHTML=`": "safeSetInnerHtml('ai-stats-grid', `",
        
        # 6. AI Summary & Verdict
        "document.getElementById('ai-summary').innerHTML = result.summary;": "safeSetInnerHtml('ai-summary', sanitizeHtml(result.summary));",
        "document.getElementById('ai-verdict-txt').innerHTML = result.verdict;": "safeSetInnerHtml('ai-verdict-txt', sanitizeHtml(result.verdict));",
        
        # 7. Match analysis body
        "document.getElementById(`mai-body-${idx}`).innerHTML = _matchAnalysisCache[idx];": "safeSetInnerHtml(`mai-body-${idx}`, _matchAnalysisCache[idx]);",
        
        # 8. Stat modal avgs
        "document.getElementById('stat-modal-avgs').innerHTML = `": "safeSetInnerHtml('stat-modal-avgs', `",
        
        # 9. Head to head match listing
        "document.getElementById('h2h-content').innerHTML = '';": "safeSetInnerHtml('h2h-content', '');",
        "document.getElementById('h2h-content').innerHTML = `": "safeSetInnerHtml('h2h-content', `",
        
        # 10. Esports active team logo
        "document.getElementById('esp-active-team-logo').innerHTML = logoHtml;": "safeSetInnerHtml('esp-active-team-logo', logoHtml);",
        
        # 11. Skin catalog grid
        "document.getElementById('skin-catalog-grid').innerHTML = '';": "safeSetInnerHtml('skin-catalog-grid', '');",
        
        # 12. Draft avatar slot
        "document.getElementById(`dc-slot-avatar-${i}`).innerHTML = '🔒 ';": "safeSetInnerHtml(`dc-slot-avatar-${i}`, '🔒 ');",
        
        # 13. Overlay preview sandbox (occurs twice)
        "document.getElementById('overlay-preview-sandbox').innerHTML = `": "safeSetInnerHtml('overlay-preview-sandbox', `",
        
        # 14. Subtitle element sync name escaping (Issue 4 XSS in subtitle)
        "subtitleEl.innerHTML = `SYNCING <span style=\"color:var(--accent); font-weight:700;\">${PLAYER_NAME}#${PLAYER_TAG}</span>": "subtitleEl.innerHTML = `SYNCING <span style=\"color:var(--accent); font-weight:700;\">${escapeHtml(PLAYER_NAME)}#${escapeHtml(PLAYER_TAG)}</span>",
    }

    count = 0
    for target, replacement in replacements.items():
        if target in content:
            content = content.replace(target, replacement)
            print(f"Replaced: {target[:50]}...")
            count += 1
        else:
            print(f"WARNING: Target not found: {target[:50]}...")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully applied {count} replacements to {js_path}")

if __name__ == "__main__":
    main()

import re

def main():
    js_path = r"public/index.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We will locate each safeSetInnerHtml template literal call and fix its closing parenthesis.
    # Pattern 1: safeSetInnerHtml('ai-stats-grid', ` ... `;
    # Let's find the block starting with safeSetInnerHtml('ai-stats-grid', ` and ending with `;
    # Let's replace the specific block.
    
    # 1. ai-stats-grid
    target_ai = """  safeSetInnerHtml('ai-stats-grid', `
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Ratio</div><div class="ai-stat-pill-val ${kdClass}">${stats.kd}</div><div class="ai-stat-pill-sub">${stats.avgKills}K / ${stats.avgDeaths}D avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Win Rate</div><div class="ai-stat-pill-val ${wrClass}">${stats.wr}%</div><div class="ai-stat-pill-sub">Last 5: ${stats.recentWR5}%</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg ACS</div><div class="ai-stat-pill-val ${acsClass}">${stats.avgACS}</div><div class="ai-stat-pill-sub">Combat score avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">HS Rate</div><div class="ai-stat-pill-val ${hsClass}">${stats.hsPct}%</div><div class="ai-stat-pill-sub">Headshot %</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Clutch Rate</div><div class="ai-stat-pill-val ${clutchClass}">${clutchRate}%</div><div class="ai-stat-pill-sub">${stats.clutchWins} clutch wins</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Trend</div><div class="ai-stat-pill-val" style="font-size:13px;color:${trendCol}">${trendArrow}</div><div class="ai-stat-pill-sub">Last 5 vs prev 5</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Consistency</div><div class="ai-stat-pill-val" style="color:${csColor}">${stats.consistencyScore}</div><div class="ai-stat-pill-sub">0-100 · higher = steadier</div></div>
    ${carryHtml}
    ${sideHtml}
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg Lobby</div><div class="ai-stat-pill-val" style="font-size:13px;">${stats.avgLobbyRank||'—'}</div><div class="ai-stat-pill-sub">Lobby rank avg</div></div>
  `;"""
  
    replacement_ai = """  safeSetInnerHtml('ai-stats-grid', `
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Ratio</div><div class="ai-stat-pill-val ${kdClass}">${stats.kd}</div><div class="ai-stat-pill-sub">${stats.avgKills}K / ${stats.avgDeaths}D avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Win Rate</div><div class="ai-stat-pill-val ${wrClass}">${stats.wr}%</div><div class="ai-stat-pill-sub">Last 5: ${stats.recentWR5}%</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg ACS</div><div class="ai-stat-pill-val ${acsClass}">${stats.avgACS}</div><div class="ai-stat-pill-sub">Combat score avg</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">HS Rate</div><div class="ai-stat-pill-val ${hsClass}">${stats.hsPct}%</div><div class="ai-stat-pill-sub">Headshot %</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Clutch Rate</div><div class="ai-stat-pill-val ${clutchClass}">${clutchRate}%</div><div class="ai-stat-pill-sub">${stats.clutchWins} clutch wins</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Trend</div><div class="ai-stat-pill-val" style="font-size:13px;color:${trendCol}">${trendArrow}</div><div class="ai-stat-pill-sub">Last 5 vs prev 5</div></div>
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Consistency</div><div class="ai-stat-pill-val" style="color:${csColor}">${stats.consistencyScore}</div><div class="ai-stat-pill-sub">0-100 · higher = steadier</div></div>
    ${carryHtml}
    ${sideHtml}
    <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg Lobby</div><div class="ai-stat-pill-val" style="font-size:13px;">${stats.avgLobbyRank||'—'}</div><div class="ai-stat-pill-sub">Lobby rank avg</div></div>
  `);"""

    if target_ai in content:
        content = content.replace(target_ai, replacement_ai)
        print("Replaced ai-stats-grid")
    else:
        # Let's do a regex replace for ai-stats-grid if spacing differs
        print("WARNING: Target ai-stats-grid not found, trying regex...")
        content, count = re.subn(r"safeSetInnerHtml\('ai-stats-grid',\s*`([\s\S]*?)`\s*;", r"safeSetInnerHtml('ai-stats-grid', `\1`);", content)
        print(f"Regex replaced {count} matches")

    # Let's use regex for all the rest to be safe and automatic!
    # Regex pattern to match safeSetInnerHtml('NAME', `...`);
    # We want to match: safeSetInnerHtml('NAME', ` [anything not containing backtick, or containing escaped backtick] `);
    # Actually, let's match: safeSetInnerHtml('NAME', `[\s\S]*?`;
    # Let's find any matches for safeSetInnerHtml\('([^']+)',\s*`([\s\S]*?)`\s*; and replace with safeSetInnerHtml('\1', `\2`);
    content, count = re.subn(r"safeSetInnerHtml\('([^']+)',\s*`([\s\S]*?)`\s*;", r"safeSetInnerHtml('\1', `\2`);", content)
    print(f"Generic regex replaced {count} matches")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done")

if __name__ == "__main__":
    main()

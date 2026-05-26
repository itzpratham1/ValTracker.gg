import re

with open("public/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Revert first if index.html was partially changed in previous run
# We can just git checkout public/index.html to be absolutely clean
# import subprocess
# subprocess.run(["git", "restore", "public/index.html"])

with open("public/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Locate and insert roundsHtml builder after rounds.forEach loop
target_loop_end = """    if (myAlive === 1) {
      clutchAttempts++;
      if (rWon) clutchWins++;
    }
  });"""

replacement_loop_end = """    if (myAlive === 1) {
      clutchAttempts++;
      if (rWon) clutchWins++;
    }
  });

  // Round-by-round progress visualizer html
  let roundsHtml = '';
  rounds.forEach((r, ri) => {
    const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    const roundNum = ri + 1;
    const side = ri < 12 ? 'Attack' : 'Defense';
    const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
    
    const ps = (r.player_stats || []).find(p => p.player_puuid === myPuuid);
    const rKills = ps?.kills?.length || 0;
    
    const dotBorder = rWon ? 'var(--win)' : 'var(--loss)';
    const dotColor = rWon ? 'rgba(62, 207, 142, 0.15)' : 'rgba(250, 68, 84, 0.15)';
    const title = `Round ${roundNum} (${side}): ${rWon ? 'Win' : 'Loss'}${rKills > 0 ? ` · ${rKills} Kills` : ''}`;
    
    roundsHtml += `
      <div title="${title}" style="position:relative; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Mono', monospace; font-size:10px; font-weight:bold; cursor:pointer; border:1px solid ${dotBorder}; background:${dotColor}; color:#fff; box-shadow: 0 0 6px ${rWon ? 'rgba(62, 207, 142, 0.1)' : 'rgba(250, 68, 84, 0.1)'};">
        ${roundNum}
        <span style="position:absolute; top:-4px; right:-4px; font-size:7px;">${sideEmoji}</span>
      </div>
    `;
  });"""

if target_loop_end in content:
    content = content.replace(target_loop_end, replacement_loop_end, 1)
    print("Success: Placed roundsHtml builder!")
else:
    print("Error: Target loop end not found!")

# 2. Use a robust regex matching for the return statement of buildMatchAnalysis
# We look for: class="match-ai-verdict" ... Match Verdict ... ${verdict} ... </div>`;
pattern = r'class="match-ai-verdict">[\s\S]*?Match Verdict</div>[\s\S]*?\$\{verdict\}[\s\S]*?</div>`;'

match = re.search(pattern, content)
if match:
    original_str = match.group(0)
    print("Matched target return block in HTML!")
    
    # We replace "</div>`;" at the end of the matched block
    replacement_str = original_str.replace("</div>`;", """</div>
    
    <!-- TACTICAL ROUND TIMELINE & WEAPON PERFORMANCE -->
    <div class="match-ai-verdict" style="margin-top:16px;">
      <div class="match-ai-verdict-label" style="display:flex; align-items:center; gap:8px;">
        <span>🎮</span> Tactical Round-by-Round Progress
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid var(--border);">
        ${roundsHtml}
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-top:12px;">
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; padding:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">⚔️ Combat Consistency</div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>First Half Kills:</span> <strong style="color:#fff;">${firstHalfKills}</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Second Half Kills:</span> <strong style="color:#fff;">${secondHalfKills}</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Multi-Kill Rounds (3K+):</span> <strong style="color:var(--win);">${multiKillRounds}</strong></div>
        </div>
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; padding:12px;">
          <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:8px;">🎯 Accuracy Breakdown</div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Headshot Rate:</span> <strong style="color:var(--win);">${hsPct}%</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Bodyshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((body_s/totalShots)*100) : 0}%</strong></div>
          <div style="font-size:11px; color:#fff; display:flex; justify-content:space-between; margin-bottom:6px;"><span>Legshot Rate:</span> <strong style="color:#fff;">${totalShots ? Math.round((legs/totalShots)*100) : 0}%</strong></div>
        </div>
      </div>
    </div>`;""")
    
    content = content.replace(original_str, replacement_str, 1)
    print("Success: Replaced target return visualizer!")
else:
    print("Error: Target return block not matched by regex!")

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(content)

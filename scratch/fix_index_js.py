import re

def main():
    js_path = r"public/index.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Prepend top-level helpers
    helpers = """function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

function sanitizeHtml(htmlStr) {
  if (typeof htmlStr !== 'string') return htmlStr;
  let clean = htmlStr.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '')
                     .replace(/<iframe[^>]*>[\\s\\S]*?<\\/iframe>/gi, '');
  clean = clean.replace(/on\\w+\\s*=\\s*(['"])(?:\\\\\\1|.)*?\\1/gi, '')
               .replace(/on\\w+\\s*=\\s*[^\\s>]+/gi, '')
               .replace(/javascript\\s*:\\s*[^\\s"']+/gi, '');
  return clean;
}

function safeSetInnerHtml(id, htmlStr) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = htmlStr;
    return el;
  }
  return null;
}

"""
    content = helpers + content

    # Exact Replacements list
    replacements = []

    # 1. Weapon image fallbacks
    replacements.append((
        r"""          ${imgUrl
            ? `<img class="top-weapon-img" src="${imgUrl}" alt="${wpn}" onerror="this.parentElement.innerHTML='<div class=weapon-img-fallback>${wpn}</div>'">`
            : `<div class="weapon-img-fallback">${wpn}</div>`}""",
        r"""          ${imgUrl
            ? `<img class="top-weapon-img" src="${imgUrl}" alt="${escapeHtml(wpn)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
            : ''}
          <div class="weapon-img-fallback" style="${imgUrl ? 'display:none;' : ''}">${escapeHtml(wpn)}</div>"""
    ))

    replacements.append((
        r"""          ${imgUrl
            ? `<img class="sec-weapon-img" src="${imgUrl}" alt="${wpn}" onerror="this.parentElement.innerHTML='<div class=weapon-img-fallback>${wpn}</div>'">`
            : `<div class="weapon-img-fallback">${wpn}</div>`}""",
        r"""          ${imgUrl
            ? `<img class="sec-weapon-img" src="${imgUrl}" alt="${escapeHtml(wpn)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
            : ''}
          <div class="weapon-img-fallback" style="${imgUrl ? 'display:none;' : ''}">${escapeHtml(wpn)}</div>"""
    ))

    # 2. Placeholders Wrap
    replacements.append((
        r"const agentsWrap = document.getElementById('agents-wrap'); if(agentsWrap) agentsWrap.innerHTML='<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see agents</div></div>';",
        r"const agentsWrap = document.getElementById('agents-wrap'); if(agentsWrap) safeSetInnerHtml('agents-wrap', '<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see agents</div></div>');"
    ))
    replacements.append((
        r"const mapsWrap = document.getElementById('maps-wrap'); if(mapsWrap) mapsWrap.innerHTML='<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see maps</div></div>';",
        r"const mapsWrap = document.getElementById('maps-wrap'); if(mapsWrap) safeSetInnerHtml('maps-wrap', '<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see maps</div></div>');"
    ))
    replacements.append((
        r"const clutchWrap = document.getElementById('clutch-wrap'); if(clutchWrap) clutchWrap.innerHTML='<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see impact</div></div>';",
        r"const clutchWrap = document.getElementById('clutch-wrap'); if(clutchWrap) safeSetInnerHtml('clutch-wrap', '<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see impact</div></div>');"
    ))
    replacements.append((
        r"const matchesList = document.getElementById('matches-list'); if(matchesList) matchesList.innerHTML='<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see match history</div></div>';",
        r"const matchesList = document.getElementById('matches-list'); if(matchesList) safeSetInnerHtml('matches-list', '<div class=\"card placeholder-card span-12\"><div class=\"placeholder-txt\">Fetch stats to see match history</div></div>');"
    ))

    # 3. Subtitle Sync Loading Text
    replacements.append((
        r"subtitleEl.innerHTML = `SYNCING <span style=\"color:var(--accent); font-weight:700;\">${PLAYER_NAME}#${PLAYER_TAG}</span> [${region} • ${mode}]`;",
        r"subtitleEl.innerHTML = `SYNCING <span style=\"color:var(--accent); font-weight:700;\">${escapeHtml(PLAYER_NAME)}#${escapeHtml(PLAYER_TAG)}</span> [${region} • ${mode}]`;"
    ))

    # 4. Rank / Peak icon
    replacements.append((
        r"""      document.getElementById('rank-icon').innerHTML=rankImgUrl?`<img src="${rankImgUrl}" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'">`:
        `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`;
      document.getElementById('peak-icon').innerHTML=peakImg?`<img src="${peakImg}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'">`:'' ;""",
        r"""      safeSetInnerHtml('rank-icon', rankImgUrl?`<img src="${rankImgUrl}" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'">`:
        `<div style="width:64px;height:64px;background:var(--surface2);border-radius:8px;"></div>`);
      safeSetInnerHtml('peak-icon', peakImg?`<img src="${peakImg}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'">`:'' );"""
    ))

    # 5. tabcontent errors
    replacements.append((
        r"""    document.getElementById(`tabcontent-${idx}-performance`).innerHTML = err;
    document.getElementById(`tabcontent-${idx}-duels`).innerHTML = err;
    document.getElementById(`tabcontent-${idx}-timeline`).innerHTML = err;""",
        r"""    safeSetInnerHtml(`tabcontent-${idx}-performance`, escapeHtml(err));
    safeSetInnerHtml(`tabcontent-${idx}-duels`, escapeHtml(err));
    safeSetInnerHtml(`tabcontent-${idx}-timeline`, escapeHtml(err));"""
    ))

    # 6. tabcontent success
    replacements.append((
        r"document.getElementById(`tabcontent-${idx}-performance`).innerHTML = perfHtml;",
        r"safeSetInnerHtml(`tabcontent-${idx}-performance`, perfHtml);"
    ))

    # 7. AI Stats Grid
    replacements.append((
        r"""  document.getElementById('ai-stats-grid').innerHTML=`
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
  `;""",
        r"""  safeSetInnerHtml('ai-stats-grid', `
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
    ))

    # 8. AI summary and verdict
    replacements.append((
        "document.getElementById('ai-summary').innerHTML = result.summary;",
        "safeSetInnerHtml('ai-summary', sanitizeHtml(result.summary));"
    ))
    replacements.append((
        "document.getElementById('ai-verdict-txt').innerHTML = result.verdict;",
        "safeSetInnerHtml('ai-verdict-txt', sanitizeHtml(result.verdict));"
    ))
    replacements.append((
        "document.getElementById(`mai-body-${idx}`).innerHTML = _matchAnalysisCache[idx];",
        "safeSetInnerHtml(`mai-body-${idx}`, _matchAnalysisCache[idx]);"
    ))

    # 9. Stat modal avgs
    replacements.append((
        r"""  document.getElementById('stat-modal-avgs').innerHTML = `
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Kills</div><div class="stat-pill-val">${avgs.kills}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Deaths</div><div class="stat-pill-val">${avgs.deaths}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Assists</div><div class="stat-pill-val">${avgs.assists}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg K/D</div><div class="stat-pill-val ${parseFloat(avgs.kd)>=1.2?'good':parseFloat(avgs.kd)>=0.9?'warn':'bad'}">${avgs.kd}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg ACS</div><div class="stat-pill-val ${avgs.acs>=220?'good':avgs.acs>=170?'warn':'bad'}">${avgs.acs}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Headshot %</div><div class="stat-pill-val ${avgs.hs>=25?'good':avgs.hs>=15?'warn':'bad'}">${avgs.hs}%</div></div>
  `;""",
        r"""  safeSetInnerHtml('stat-modal-avgs', `
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Kills</div><div class="stat-pill-val">${avgs.kills}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Deaths</div><div class="stat-pill-val">${avgs.deaths}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Assists</div><div class="stat-pill-val">${avgs.assists}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg K/D</div><div class="stat-pill-val ${parseFloat(avgs.kd)>=1.2?'good':parseFloat(avgs.kd)>=0.9?'warn':'bad'}">${avgs.kd}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg ACS</div><div class="stat-pill-val ${avgs.acs>=220?'good':avgs.acs>=170?'warn':'bad'}">${avgs.acs}</div></div>
    <div class="stat-pill"><div class="stat-pill-lbl">Avg Headshot %</div><div class="stat-pill-val ${avgs.hs>=25?'good':avgs.hs>=15?'warn':'bad'}">${avgs.hs}%</div></div>
  `);"""
    ))

    # 10. Head to head match listing
    replacements.append((
        "document.getElementById('h2h-content').innerHTML = '';",
        "safeSetInnerHtml('h2h-content', '');"
    ))

    replacements.append((
        r"""  document.getElementById('h2h-content').innerHTML = `
    <div class="h2h-top-grid">
      <div class="h2h-player-summary left">
        <img class="h2h-summary-avatar" src="${p1Card}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div class="h2h-summary-avatar-fallback" style="display:none">👤</div>
        <div class="h2h-summary-details">
          <div class="h2h-summary-name">${p1Name}</div>
          <div class="h2h-summary-accent-bar" style="background:${p1Wr>=55?'var(--win)':p1Wr>=40?'var(--accent)':'var(--loss)'}"></div>
        </div>
      </div>
      <div class="h2h-versus-circle">VS</div>
      <div class="h2h-player-summary right">
        <div class="h2h-summary-details" style="text-align:right">
          <div class="h2h-summary-name">${p2Name}</div>
          <div class="h2h-summary-accent-bar" style="background:${p2Wr>=55?'var(--win)':p2Wr>=40?'var(--accent)':'var(--loss)'};margin-left:auto"></div>
        </div>
        <img class="h2h-summary-avatar" src="${p2Card}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div class="h2h-summary-avatar-fallback" style="display:none">👤</div>
      </div>
    </div>
    <div style="font-family:'Barlow Condensed', sans-serif; font-size:18px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#fff; text-align:center; margin-bottom:15px;">Historical Head-to-Head</div>
    <div class="h2h-table-wrap">
      <table class="h2h-table">
        <thead>
          <tr>
            <th style="text-align:left">Match Details</th>
            <th style="text-align:center">${p1Name}</th>
            <th style="text-align:center">Result</th>
            <th style="text-align:center">${p2Name}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;""",
        r"""  safeSetInnerHtml('h2h-content', `
    <div class="h2h-top-grid">
      <div class="h2h-player-summary left">
        <img class="h2h-summary-avatar" src="${p1Card}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div class="h2h-summary-avatar-fallback" style="display:none">👤</div>
        <div class="h2h-summary-details">
          <div class="h2h-summary-name">${escapeHtml(p1Name)}</div>
          <div class="h2h-summary-accent-bar" style="background:${p1Wr>=55?'var(--win)':p1Wr>=40?'var(--accent)':'var(--loss)'}"></div>
        </div>
      </div>
      <div class="h2h-versus-circle">VS</div>
      <div class="h2h-player-summary right">
        <div class="h2h-summary-details" style="text-align:right">
          <div class="h2h-summary-name">${escapeHtml(p2Name)}</div>
          <div class="h2h-summary-accent-bar" style="background:${p2Wr>=55?'var(--win)':p2Wr>=40?'var(--accent)':'var(--loss)'};margin-left:auto"></div>
        </div>
        <img class="h2h-summary-avatar" src="${p2Card}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div class="h2h-summary-avatar-fallback" style="display:none">👤</div>
      </div>
    </div>
    <div style="font-family:'Barlow Condensed', sans-serif; font-size:18px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#fff; text-align:center; margin-bottom:15px;">Historical Head-to-Head</div>
    <div class="h2h-table-wrap">
      <table class="h2h-table">
        <thead>
          <tr>
            <th style="text-align:left">Match Details</th>
            <th style="text-align:center">${escapeHtml(p1Name)}</th>
            <th style="text-align:center">Result</th>
            <th style="text-align:center">${escapeHtml(p2Name)}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `);"""
    ))

    # 11. Esports active team logo
    replacements.append((
        "document.getElementById('esp-active-team-logo').innerHTML = logoHtml;",
        "safeSetInnerHtml('esp-active-team-logo', logoHtml);"
    ))

    # 12. Skin catalog grid
    replacements.append((
        "document.getElementById('skin-catalog-grid').innerHTML = '';",
        "safeSetInnerHtml('skin-catalog-grid', '');"
    ))

    # 13. Slots update avatar
    replacements.append((
        "const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);\n  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);\n  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));\n  \n  slotAvatar.innerHTML = iconUrl ? `<img class=\"dc-slot-avatar-img\" src=\"${iconUrl}\">` : '👤';\n  slotName.innerText = agKey.toUpperCase();",
        "const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);\n  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);\n  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));\n  \n  if (slotAvatar) {\n    slotAvatar.innerHTML = iconUrl ? `<img class=\"dc-slot-avatar-img\" src=\"${iconUrl}\">` : '👤';\n  }\n  if (slotName) {\n    slotName.innerText = agKey.toUpperCase();\n  }"
    ))

    replacements.append((
        """  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (agKey) {
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      slotName.innerText = agKey.toUpperCase();
    } else {
      slotAvatar.innerHTML = '➕';
      slotName.innerText = `Slot ${i+1}`;
    }
  }""",
        """  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (agKey) {
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    } else {
      if (slotAvatar) {
        slotAvatar.innerHTML = '➕';
      }
      if (slotName) {
        slotName.innerText = `Slot ${i+1}`;
      }
    }
  }"""
    ))

    replacements.append((
        """  for (let i = 0; i < 5; i++) {
    document.getElementById(`dc-slot-avatar-${i}`).innerHTML = '➕';
    document.getElementById(`dc-slot-name-${i}`).innerText = `Slot ${i+1}`;
  }""",
        """  for (let i = 0; i < 5; i++) {
    safeSetInnerHtml(`dc-slot-avatar-${i}`, '➕');
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (slotName) {
      slotName.innerText = `Slot ${i+1}`;
    }
  }"""
    ))

    replacements.append((
        """  // Render the selected agents into the UI slots
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    if (agKey) {
      const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
      const slotName = document.getElementById(`dc-slot-name-${i}`);
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      
      slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      slotName.innerText = agKey.toUpperCase();
    }
  }""",
        """  // Render the selected agents into the UI slots
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    if (agKey) {
      const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
      const slotName = document.getElementById(`dc-slot-name-${i}`);
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    }
  }"""
    ))

    # 14. Overlay preview sandbox (first occurrence)
    replacements.append((
        """    document.getElementById('overlay-preview-sandbox').innerHTML = `
      <div style="width: 250px; background: rgba(10, 10, 12, 0.95); border: 1.5px solid #ff4655; border-radius: 8px; padding: 10px; color: #fff; font-family: 'Rajdhani', sans-serif; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <img style="width: 28px; height: 28px; border-radius: 4px;" src="${cardImg}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div style="width:28px;height:28px;background:#141416;border-radius:4px;display:none;align-items:center;justify-content:center;font-size:10px">👤</div>
          <div>
            <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 900; line-height: 1.1;">${pName}</div>
            <div style="font-size: 9px; color: #ff4655; font-family: 'DM Mono', monospace; font-weight: 700; letter-spacing: 0.5px;">${pRegion.toUpperCase()} · ${pMode.toUpperCase()}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <img style="width: 24px; height: 24px; object-fit: contain;" src="${rankIcon}" onerror="this.style.display='none';">
            <span style="font-family:'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 900;">${pRank}</span>
          </div>
          <span style="font-family:'DM Mono', monospace; font-size: 11px; font-weight: 700; color: var(--accent);">${pRR} RR</span>
        </div>
        <div style="display: flex; gap: 4px; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; font-size: 9px; color: rgba(255,255,255,0.6);">
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <span style="font-weight: bold; color: #fff;">${avgK.toFixed(1)}</span>
            <span>KILLS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: #fff;">${avgD.toFixed(1)}</span>
            <span>DEATHS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: #fff;">${avgA.toFixed(1)}</span>
            <span>ASSISTS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: ${pKd>=1.1?'var(--win)':pKd>=0.9?'var(--accent)':'var(--loss)'};">${pKd.toFixed(2)}</span>
            <span>K/D</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: ${pWr>=52?'var(--win)':pWr>=48?'var(--accent)':'var(--loss)'};">${pWr}%</span>
            <span>WR</span>
          </div>
        </div>
      </div>
    `;""",
        """    safeSetInnerHtml('overlay-preview-sandbox', `
      <div style="width: 250px; background: rgba(10, 10, 12, 0.95); border: 1.5px solid #ff4655; border-radius: 8px; padding: 10px; color: #fff; font-family: 'Rajdhani', sans-serif; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <img style="width: 28px; height: 28px; border-radius: 4px;" src="${cardImg}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div style="width:28px;height:28px;background:#141416;border-radius:4px;display:none;align-items:center;justify-content:center;font-size:10px">👤</div>
          <div>
            <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 900; line-height: 1.1;">${escapeHtml(pName)}</div>
            <div style="font-size: 9px; color: #ff4655; font-family: 'DM Mono', monospace; font-weight: 700; letter-spacing: 0.5px;">${pRegion.toUpperCase()} · ${pMode.toUpperCase()}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <img style="width: 24px; height: 24px; object-fit: contain;" src="${rankIcon}" onerror="this.style.display='none';">
            <span style="font-family:'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 900;">${pRank}</span>
          </div>
          <span style="font-family:'DM Mono', monospace; font-size: 11px; font-weight: 700; color: var(--accent);">${pRR} RR</span>
        </div>
        <div style="display: flex; gap: 4px; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; font-size: 9px; color: rgba(255,255,255,0.6);">
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <span style="font-weight: bold; color: #fff;">${avgK.toFixed(1)}</span>
            <span>KILLS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: #fff;">${avgD.toFixed(1)}</span>
            <span>DEATHS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: #fff;">${avgA.toFixed(1)}</span>
            <span>ASSISTS</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: ${pKd>=1.1?'var(--win)':pKd>=0.9?'var(--accent)':'var(--loss)'};">${pKd.toFixed(2)}</span>
            <span>K/D</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
            <span style="font-weight: bold; color: ${pWr>=52?'var(--win)':pWr>=48?'var(--accent)':'var(--loss)'};">${pWr}%</span>
            <span>WR</span>
          </div>
        </div>
      </div>
    `);"""
    ))

    # 15. Overlay preview sandbox (second occurrence)
    replacements.append((
        """  document.getElementById('overlay-preview-sandbox').innerHTML = `
    <div style="width: 250px; background: rgba(10, 10, 12, 0.95); border: 1.5px solid #ff4655; border-radius: 8px; padding: 10px; color: #fff; font-family: 'Rajdhani', sans-serif; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
      <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
        <img style="width: 28px; height: 28px; border-radius: 4px;" src="${cardImg}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div style="width:28px;height:28px;background:#141416;border-radius:4px;display:none;align-items:center;justify-content:center;font-size:10px">👤</div>
        <div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 900; line-height: 1.1;">${pName}</div>
          <div style="font-size: 9px; color: #ff4655; font-family: 'DM Mono', monospace; font-weight: 700; letter-spacing: 0.5px;">${pRegion.toUpperCase()} · ${pMode.toUpperCase()}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <img style="width: 24px; height: 24px; object-fit: contain;" src="${rankIcon}" onerror="this.style.display='none';">
          <span style="font-family:'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 900;">${pRank}</span>
        </div>
        <span style="font-family:'DM Mono', monospace; font-size: 11px; font-weight: 700; color: var(--accent);">${pRR} RR</span>
      </div>
      <div style="display: flex; gap: 4px; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; font-size: 9px; color: rgba(255,255,255,0.6);">
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <span style="font-weight: bold; color: #fff;">${avgK.toFixed(1)}</span>
          <span>KILLS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: #fff;">${avgD.toFixed(1)}</span>
          <span>DEATHS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: #fff;">${avgA.toFixed(1)}</span>
          <span>ASSISTS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: ${pKd>=1.1?'var(--win)':pKd>=0.9?'var(--accent)':'var(--loss)'};">${pKd.toFixed(2)}</span>
          <span>K/D</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: ${pWr>=52?'var(--win)':pWr>=48?'var(--accent)':'var(--loss)'};">${pWr}%</span>
          <span>WR</span>
        </div>
      </div>
    </div>
  `;""",
        """  safeSetInnerHtml('overlay-preview-sandbox', `
    <div style="width: 250px; background: rgba(10, 10, 12, 0.95); border: 1.5px solid #ff4655; border-radius: 8px; padding: 10px; color: #fff; font-family: 'Rajdhani', sans-serif; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
      <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
        <img style="width: 28px; height: 28px; border-radius: 4px;" src="${cardImg}" onerror="this.nextElementSibling.style.display='flex';this.style.display='none';"><div style="width:28px;height:28px;background:#141416;border-radius:4px;display:none;align-items:center;justify-content:center;font-size:10px">👤</div>
        <div>
          <div style="font-family:'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 900; line-height: 1.1;">${escapeHtml(pName)}</div>
          <div style="font-size: 9px; color: #ff4655; font-family: 'DM Mono', monospace; font-weight: 700; letter-spacing: 0.5px;">${pRegion.toUpperCase()} · ${pMode.toUpperCase()}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <img style="width: 24px; height: 24px; object-fit: contain;" src="${rankIcon}" onerror="this.style.display='none';">
          <span style="font-family:'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 900;">${pRank}</span>
        </div>
        <span style="font-family:'DM Mono', monospace; font-size: 11px; font-weight: 700; color: var(--accent);">${pRR} RR</span>
      </div>
      <div style="display: flex; gap: 4px; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; font-size: 9px; color: rgba(255,255,255,0.6);">
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <span style="font-weight: bold; color: #fff;">${avgK.toFixed(1)}</span>
          <span>KILLS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: #fff;">${avgD.toFixed(1)}</span>
          <span>DEATHS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: #fff;">${avgA.toFixed(1)}</span>
          <span>ASSISTS</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: ${pKd>=1.1?'var(--win)':pKd>=0.9?'var(--accent)':'var(--loss)'};">${pKd.toFixed(2)}</span>
          <span>K/D</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; border-left: 1px solid rgba(255,255,255,0.06);">
          <span style="font-weight: bold; color: ${pWr>=52?'var(--win)':pWr>=48?'var(--accent)':'var(--loss)'};">${pWr}%</span>
          <span>WR</span>
        </div>
      </div>
    </div>
  `);"""
    ))

    count = 0
    for target, replacement in replacements:
        # Normalize newlines
        norm_target = target.replace("\r\n", "\n")
        norm_content = content.replace("\r\n", "\n")
        norm_replacement = replacement.replace("\r\n", "\n")
        
        if norm_target in norm_content:
            norm_content = norm_content.replace(norm_target, norm_replacement)
            content = norm_content
            print(f"Replaced: {target[:60].strip()}...")
            count += 1
        else:
            print(f"WARNING: Target not found:\n{target[:200]}")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully applied {count} replacements to {js_path}")

if __name__ == "__main__":
    main()

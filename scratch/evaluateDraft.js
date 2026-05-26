function evaluateDraft() {
  const selected = draftSlots.filter(s => s !== null);
  const total = selected.length;
  
  const scoreMeter = document.getElementById('dc-score-meter');
  const verdictTitle = document.getElementById('dc-verdict-title');
  const verdictDesc = document.getElementById('dc-verdict-desc');
  const insightsWrap = document.getElementById('dc-insights-wrap');

  let duelists = 0, initiators = 0, controllers = 0, sentinels = 0;
  selected.forEach(ag => {
    const role = getRoleClass(ag.charAt(0).toUpperCase() + ag.slice(1));
    if (role === 'duelist') duelists++;
    else if (role === 'initiator') initiators++;
    else if (role === 'controller') controllers++;
    else if (role === 'sentinel') sentinels++;
  });

  document.getElementById('dc-bar-duelists-txt').innerText = `${duelists} / 2`;
  document.getElementById('dc-bar-duelists').style.width = `${Math.min((duelists/2)*100, 100)}%`;
  
  document.getElementById('dc-bar-initiators-txt').innerText = `${initiators} / 1`;
  document.getElementById('dc-bar-initiators').style.width = `${Math.min((initiators/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-controllers-txt').innerText = `${controllers} / 1`;
  document.getElementById('dc-bar-controllers').style.width = `${Math.min((controllers/1)*100, 100)}%`;
  
  document.getElementById('dc-bar-sentinels-txt').innerText = `${sentinels} / 1`;
  document.getElementById('dc-bar-sentinels').style.width = `${Math.min((sentinels/1)*100, 100)}%`;

  if (total < 5) {
    scoreMeter.innerText = total * 10;
    scoreMeter.style.color = 'var(--muted)';
    verdictTitle.innerText = 'Drafting in progress...';
    verdictDesc.innerText = `Selected ${total} out of 5 agents. Add more to get a full tactical evaluation.`;
    insightsWrap.innerHTML = `<div style="font-size:11px; color:var(--muted); text-align:center; padding:16px;">Draft is incomplete. Fill slots to trigger composition analysis.</div>`;
    return;
  }

  let score = 70;
  const insights = [];
  const mapKey = document.getElementById('dc-map-select').value;
  const mapRecs = draftMapRecommendations[mapKey] || { preferred: [], note: '' };

  if (controllers === 0) {
    score -= 20;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Critical Deficit — No Controller Smokes:</strong> Playing without smokes blocks entrance vision, exposing your entry duelists to passive sniper defense.' });
  } else if (controllers === 2) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Tactical Controller Synergy:</strong> Double smokes controller setups afford exceptional mid-round flexibility and delay utility.' });
  }

  if (sentinels === 0) {
    score -= 15;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Open Flanks Warning:</strong> Composition lacks a Sentinel traps setup. Defending flanks verbally or wet-peeking corners is highly risky.' });
  } else {
    score += 5;
    insights.push({ type: 'good', icon: '🛡️', text: '<strong>Sentinel Anchor Bonus:</strong> Solid defensive site locks. Passive traps defend flanks automatically.' });
  }

  if (duelists === 0) {
    score -= 10;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Entry Deficit:</strong> Lacking a high-mobility duelist. Pushing sites through chokepoints becomes harder without entry mobility.' });
  } else if (duelists > 2) {
    score -= 10;
    insights.push({ type: 'warn', icon: '⚠️', text: '<strong>Utility Deficit — Triple Duelists:</strong> Excess of entry agents trades off valuable initiator scans and control smokes.' });
  }

  let mapMatches = 0;
  selected.forEach(ag => {
    if (mapRecs.preferred.includes(ag)) {
      mapMatches++;
    }
  });

  if (mapMatches >= 3) {
    score += 15;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Elite Map Suitability:</strong> Matches the meta layout of ${mapKey.toUpperCase()}. ${mapRecs.note}` });
  } else if (mapMatches >= 1) {
    score += 5;
    insights.push({ type: 'good', icon: '🗺️', text: `<strong>Decent Map Layout Suitability.</strong> ${mapRecs.note}` });
  }

  if (selected.includes('jett') && selected.includes('breach')) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Entry Flash Synergy — Jett + Breach:</strong> Fault-line stun or flash supports Jett dash entries on target spots perfectly.' });
  }
  if (selected.includes('viper') && selected.includes('brimstone') && ['bind', 'haven'].includes(mapKey)) {
    score += 5;
    insights.push({ type: 'good', icon: '💥', text: '<strong>Post-Plant Molly Synergy — Viper + Brimstone:</strong> Double line post-plant delay holds off defuses for up to 15 seconds!' });
  }

  score = Math.max(0, Math.min(score, 100));
  
  scoreMeter.innerText = score;
  if (score >= 85) {
    scoreMeter.style.color = 'var(--win)';
    verdictTitle.innerText = 'Meta Composition';
    verdictTitle.style.color = 'var(--win)';
    verdictDesc.innerText = 'Exceptional draft. Balanced role allocations, strong synergies, and high suitability for this map outline.';
  } else if (score >= 70) {
    scoreMeter.style.color = 'var(--accent)';
    verdictTitle.innerText = 'Decent Composition';
    verdictTitle.style.color = 'var(--accent)';
    verdictDesc.innerText = 'Good average balance. Solid role slots filled, though minor weaknesses or card tweaks can optimize entries.';
  } else {
    scoreMeter.style.color = 'var(--loss)';
    verdictTitle.innerText = 'Sub-optimal Composition';
    verdictTitle.style.color = 'var(--loss)';
    verdictDesc.innerText = 'Weak draft stability. Missing controllers, Sentinels, or map picks makes site executes difficult.';
  }

  insightsWrap.innerHTML = insights.map(i => `
    <div class="dc-insight-card ${i.type}">
      <span class="dc-insight-card-icon">${i.icon}</span>
      <div>${i.text}</div>
    </div>
  `).join('');
}
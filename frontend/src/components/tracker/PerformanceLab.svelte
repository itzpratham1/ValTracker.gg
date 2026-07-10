<script>
  import { loadAllMatches } from '../../lib/indexeddb';
  import { getPlayerList } from '../../lib/utils';

  export let playerName = '';
  export let playerTag = '';
  export let currentMode = 'competitive';
  export let mmrHistory = {};
  export let rankName = 'Silver 2';

  let loading = false;
  let results = '';
  let loadingText = 'CRUNCHING DATA...';

  function isToday(ts) {
    if (!ts) return false;
    const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  function normalizeName(str) { return (str || '').toLowerCase().replace(/\s+/g, ''); }

  function findMe(match) {
    if (!match) return null;
    const all = Array.isArray(match.players) ? match.players : (match.players?.all_players || match.players || []);
    const tn = normalizeName(playerName);
    const tt = normalizeName(playerTag);
    return (Array.isArray(all) ? all : []).find(
      p => normalizeName(p.name) === tn && normalizeName(p.tag) === tt
    ) || null;
  }

  const RANK_BENCHMARKS = {
    'Iron':      { kd:0.75, wr:44, acs:110, hs:12 }, 'Bronze':    { kd:0.88, wr:46, acs:135, hs:14 },
    'Silver':    { kd:1.00, wr:48, acs:155, hs:17 }, 'Gold':      { kd:1.12, wr:50, acs:175, hs:20 },
    'Platinum':  { kd:1.22, wr:51, acs:195, hs:22 }, 'Diamond':   { kd:1.35, wr:52, acs:215, hs:24 },
    'Ascendant': { kd:1.50, wr:53, acs:240, hs:26 }, 'Immortal':  { kd:1.65, wr:54, acs:265, hs:28 },
    'Radiant':   { kd:1.85, wr:56, acs:290, hs:30 },
  };
  const RANK_ORDER = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'];

  function getRankTier(name) {
    if (!name) return 'Silver';
    const lower = name.toLowerCase();
    return RANK_ORDER.find(r => lower.startsWith(r.toLowerCase())) || 'Silver';
  }
  function getNextRank(tier) {
    const idx = RANK_ORDER.indexOf(tier);
    return idx < RANK_ORDER.length-1 ? RANK_ORDER[idx+1] : null;
  }

  async function runLab() {
    loading = true;
    results = '';
    const msgs = ['ANALYSING DUELS...','READING ECONOMY...','DETECTING TILT...','MAPPING TIME PATTERNS...','BENCHMARKING VS RANK...','BUILDING PREDICTIONS...'];
    let mi = 0;
    const iv = setInterval(() => { loadingText = msgs[++mi % msgs.length]; }, 600);

    try {
      let matches = [];
      try { matches = await loadAllMatches(playerName, playerTag, currentMode); } catch(e) { throw new Error('Failed to load match data'); }
      if (!matches.length) throw new Error('Fetch your stats first');

      await new Promise(r => setTimeout(r, 700));
      results = buildPerfLab(matches);
      if (typeof window !== 'undefined' && window.showToast) window.showToast('Performance Lab complete ✓');
    } catch(e) {
      results = `<div style="padding:16px;color:var(--loss);font-family:'DM Mono',monospace;font-size:11px;">Error: ${e.message}</div>`;
    } finally {
      clearInterval(iv);
      loading = false;
    }
  }

  function buildPerfLab(matches) {
    const data = [];
    matches.forEach(match => {
      const me = findMe(match);
      if (!me) return;
      const s = me.stats || {};
      const k = s.kills||0, d = s.deaths||0, sc = s.score||0;
      const hs = s.headshots||0, shots = (s.headshots||0)+(s.bodyshots||0)+(s.legshots||0);
      const myTeamId = (me.team||'').toLowerCase();
      const _mt = match.teams?.[myTeamId], _ot = match.teams?.[myTeamId==='red'?'blue':'red'];
      const won = _mt?.has_won != null ? (_mt.has_won === true || _mt.has_won === 'true')
        : (_mt?.rounds_won != null && _ot?.rounds_won != null) ? _mt.rounds_won > _ot.rounds_won : false;
      const myRounds = (match.teams?.[myTeamId] || {}).rounds_won || 0;
      const oppRounds = (match.teams?.[myTeamId==='red'?'blue':'red'] || {}).rounds_won || 0;
      const totalRounds = myRounds + oppRounds;
      const agent = me.character || 'Unknown';
      const map = match.metadata?.map || 'Unknown';
      const matchId = match.metadata?.matchid || match.metadata?.match_id || '';
      const gameStart = match.metadata?.game_start || null;
      const acs = totalRounds ? Math.round(sc / totalRounds) : Math.round(sc/100);
      const hsPct = shots ? Math.round((hs/shots)*100) : 0;
      const kd = d ? k/d : k;
      const rr = mmrHistory[matchId];
      data.push({ k, d, sc, hs, shots, acs, hsPct, kd, won, agent, map, matchId, gameStart, rr, myRounds, oppRounds, totalRounds, myTeamId });
    });

    if (!data.length) return '<div class="no-detail">Not enough data</div>';
    const n = data.length;
    let html = '';

    const recentWins = data.slice(0, 5).filter(d => d.won).length;
    const recentLosses = 5 - recentWins;
    const recentRR = data.slice(0, 5).map(d => d.rr).filter(r => r !== undefined);
    const rrLast5 = recentRR.reduce((s,v)=>s+v,0);
    const currentStreak = (() => {
      let count = 0, type = data[0]?.won ? 'win' : 'loss';
      for (const m of data) { if (m.won === (type==='win')) count++; else break; }
      return { count, type };
    })();
    const sessionMatches = data.filter(d => d.gameStart && isToday(d.gameStart));
    const sessionLosses = sessionMatches.filter(d => !d.won).length;

    const tiltLevel = currentStreak.type === 'loss' && currentStreak.count >= 3 ? 'high'
      : sessionLosses >= 3 ? 'medium' : rrLast5 < -60 ? 'medium' : null;

    // 1. TILT DETECTION
    html += plabChapter('🧠', 'Mental Game & Tilt Detection');
    if (tiltLevel) {
      const tiltMsg = tiltLevel === 'high'
        ? `You're on a ${currentStreak.count}-game loss streak right now. This is the #1 ranked improvement tip: stop playing. Every loss after 3 in a row is statistically more likely to continue. Take 30 min, do something else, come back fresh.`
        : sessionLosses >= 3
        ? `${sessionLosses} losses in today's session. Your win rate drops significantly after the 3rd loss of a session — your mental model of the game degrades and you start forcing plays.`
        : `You've lost ${Math.abs(rrLast5)} RR in your last 5 games. This kind of downswing is a tilt signal even if individual games felt close.`;
      html += `<div class="plab-tilt-alert">
        <div class="plab-tilt-icon">${tiltLevel==='high'?'🚨':'⚠️'}</div>
        <div><div class="plab-tilt-title">${tiltLevel==='high'?'STOP PLAYING NOW':'TILT WARNING'}</div>
        <div class="plab-tilt-desc">${tiltMsg}</div></div></div>`;
    } else {
      html += `<div class="plab-card good"><div class="plab-card-label">Mental State</div><div class="plab-card-val good">✓ Clear</div><div class="plab-card-sub">No tilt signals detected — good headspace to keep playing</div></div>`;
    }

    const sessionKD = sessionMatches.length ? (sessionMatches.reduce((s,d)=>s+d.k,0)/Math.max(sessionMatches.reduce((s,d)=>s+d.d,0),1)).toFixed(2) : null;
    const sessionRR = sessionMatches.reduce((s,d)=>s+(d.rr||0),0);
    if (sessionMatches.length) {
      html += `<div class="plab-grid">`;
      html += plabCard('Today\'s Matches', sessionMatches.length, `${sessionMatches.filter(d=>d.won).length}W / ${sessionLosses}L`, sessionMatches.filter(d=>d.won).length >= sessionLosses ? 'good' : 'bad', '');
      html += plabCard('Session RR', (sessionRR > 0 ? '+' : '') + sessionRR, 'Today\'s net RR', sessionRR >= 0 ? 'good' : 'bad', '');
      if (sessionKD) html += plabCard('Session K/D', sessionKD, 'Today only', parseFloat(sessionKD) >= 1 ? 'good' : 'bad', '');
      html += plabCard('Current Streak', currentStreak.count + (currentStreak.type==='win'?' W':'L'), currentStreak.type==='win'?'Keep it going':'Take a break?', currentStreak.type==='win'?'good':'bad', '');
      html += `</div>`;
    }

    // 2. TIME OF DAY
    html += plabChapter('🕐', 'Time of Day Performance');
    const hourBuckets = Array(24).fill(null).map(() => ({ m:0, w:0, rr:0 }));
    data.forEach(d => {
      if (!d.gameStart) return;
      const h = new Date(d.gameStart * 1000).getHours();
      hourBuckets[h].m++; if (d.won) hourBuckets[h].w++; if (d.rr !== undefined) hourBuckets[h].rr += d.rr;
    });
    const playedHours = hourBuckets.filter(b => b.m > 0);
    const maxGames = Math.max(...hourBuckets.map(b=>b.m), 1);
    const bestHour = hourBuckets.reduce((best,b,i) => b.m>=2 && (b.w/b.m) > best.wr ? {h:i, wr:b.w/b.m, m:b.m} : best, {h:-1,wr:0,m:0});
    const worstHour = hourBuckets.reduce((worst,b,i) => b.m>=2 && (b.w/b.m) < worst.wr ? {h:i, wr:b.w/b.m, m:b.m} : worst, {h:-1,wr:1,m:0});

    if (playedHours.length < 2) {
      html += `<div class="plab-card span4"><div class="plab-card-label">Time Data</div><div class="plab-card-sub" style="padding:8px 0">Not enough matches with timestamps yet — play more games and data will appear here.</div></div>`;
    } else {
      html += `<div class="plab-card span4"><div class="plab-card-label">Games & Win Rate by Hour (hover for details)</div><div class="plab-heatmap">`;
      hourBuckets.forEach((b, h) => {
        const wr = b.m ? b.w/b.m : 0;
        const intensity = b.m / maxGames;
        const col = b.m === 0 ? 'var(--surface3)' : wr >= 0.6 ? `rgba(62,207,142,${0.15 + intensity*0.7})` : wr >= 0.45 ? `rgba(232,255,71,${0.1 + intensity*0.5})` : `rgba(255,87,87,${0.15 + intensity*0.6})`;
        const tt = b.m ? `${h}:00 — ${b.m} games, ${Math.round(wr*100)}% WR` : `${h}:00 — no games`;
        html += `<div class="plab-heat-cell" style="background:${col}" title="${tt}"></div>`;
      });
      html += `</div><div class="plab-heat-labels">`;
      hourBuckets.forEach((b,h) => { html += `<div class="plab-heat-label">${h%6===0?h:''}</div>`; });
      html += `</div></div>`;

      html += `<div class="plab-grid">`;
      if (bestHour.h >= 0) html += plabCard('Best Hour', `${bestHour.h}:00`, `${Math.round(bestHour.wr*100)}% WR · ${bestHour.m} games`, 'good', 'good');
      if (worstHour.h >= 0) html += plabCard('Worst Hour', `${worstHour.h}:00`, `${Math.round(worstHour.wr*100)}% WR · ${worstHour.m} games`, 'bad', 'bad');

      const sessionGroups = {};
      data.forEach(d => {
        if (!d.gameStart) return;
        const dayKey = new Date(d.gameStart*1000).toDateString();
        if (!sessionGroups[dayKey]) sessionGroups[dayKey] = [];
        sessionGroups[dayKey].push(d);
      });
      const sessionLengths = Object.values(sessionGroups).filter(s => s.length >= 2);
      if (sessionLengths.length >= 2) {
        const earlyWR = sessionLengths.flatMap(s => s.slice(0,2)).filter(d=>d.won).length / Math.max(sessionLengths.flatMap(s=>s.slice(0,2)).length, 1);
        const lateWR  = sessionLengths.flatMap(s => s.slice(2)).filter(d=>d.won).length / Math.max(sessionLengths.flatMap(s=>s.slice(2)).length, 1);
        const fatigueDrop = earlyWR - lateWR;
        html += plabCard('Early Session WR', Math.round(earlyWR*100)+'%', 'Games 1-2 of session', earlyWR>=0.5?'good':'bad', '');
        html += plabCard('Late Session WR', Math.round(lateWR*100)+'%', fatigueDrop>0.1?'Drops after 2 games ⚠️':'Stays consistent', lateWR>=0.5?'good':fatigueDrop>0.1?'bad':'warn', fatigueDrop>0.1?'bad':'');
      }
      html += `</div>`;

      if (bestHour.h >= 0 || worstHour.h >= 0) {
        html += `<div class="plab-card span4"><div class="plab-patterns">`;
        if (bestHour.h >= 0) html += `<div class="plab-pattern"><div class="plab-dot g"></div><div>You perform best around <b>${bestHour.h}:00</b> — ${Math.round(bestHour.wr*100)}% WR in ${bestHour.m} games. Prioritise ranked at this time.</div></div>`;
        if (worstHour.h >= 0 && worstHour.h !== bestHour.h) html += `<div class="plab-pattern"><div class="plab-dot r"></div><div>You struggle around <b>${worstHour.h}:00</b> — ${Math.round(worstHour.wr*100)}% WR. Consider avoiding ranked at this time.</div></div>`;
        html += `</div></div>`;
      }
    }

    // 3. DUEL ANALYSIS
    html += plabChapter('⚔️', 'Duel Analysis');
    const totalK = data.reduce((s,d)=>s+d.k,0);
    const totalD = data.reduce((s,d)=>s+d.d,0);
    const totalR = data.reduce((s,d)=>s+d.totalRounds,0);
    const avgKPR = totalR ? (totalK/totalR).toFixed(2) : 0;
    const avgDPR = totalR ? (totalD/totalR).toFixed(2) : 0;
    const duelWinPct = Math.round((totalK/(totalK+totalD))*100);
    const highKGames = data.filter(d=>d.k>=18).length;
    const highKWins = data.filter(d=>d.k>=18&&d.won).length;
    const openingWR = highKGames ? Math.round((highKWins/highKGames)*100) : null;

    html += `<div class="plab-grid">`;
    html += plabCard('Duel Win %', duelWinPct+'%', `${totalK} kills vs ${totalD} deaths`, duelWinPct>=55?'good':duelWinPct>=45?'warn':'bad', '');
    html += plabCard('Avg KPR', avgKPR, 'Kills per round', parseFloat(avgKPR)>=0.8?'good':parseFloat(avgKPR)>=0.6?'warn':'bad', '');
    html += plabCard('Avg DPR', avgDPR, 'Deaths per round', parseFloat(avgDPR)<=0.7?'good':parseFloat(avgDPR)<=0.85?'warn':'bad', '');
    html += plabCard('High Kill Games', `${highKGames}/${n}`, `${Math.round(highKGames/n*100)}% of matches · ${openingWR||'—'}% WR`, highKGames/n>=0.3?'good':'warn', '');
    html += `</div>`;

    const duelPatterns = [];
    if (duelWinPct >= 58) duelPatterns.push({c:'g', t:`Strong duel win rate (${duelWinPct}%) — you win more than you lose in direct combat.`});
    else if (duelWinPct <= 46) duelPatterns.push({c:'r', t:`Low duel win rate (${duelWinPct}%) — you lose more 1v1s than you win. Focus on crosshair placement and counter-strafing.`});
    if (parseFloat(avgKPR) < 0.6) duelPatterns.push({c:'r', t:`Low KPR (${avgKPR}) — you're not finding enough kills per round.`});
    if (parseFloat(avgDPR) > 0.9) duelPatterns.push({c:'r', t:`High DPR (${avgDPR}) — you die almost every round. This suggests over-aggression.`});
    if (openingWR && openingWR >= 65) duelPatterns.push({c:'g', t:`When you get kills (18+ game), your team wins ${openingWR}% of the time — you're a strong carry when fragging.`});
    if (duelPatterns.length) html += patternBlock(duelPatterns);

    // 4. ECONOMY
    html += plabChapter('💰', 'Economy Intelligence');
    const avgACS = data.reduce((s,d)=>s+d.acs,0)/n;
    const fullBuyMatches = data.filter(d => d.acs >= avgACS * 0.95);
    const ecoBuyMatches = data.filter(d => d.acs < avgACS * 0.75);
    const forceBuyMatches = data.filter(d => d.acs >= avgACS * 0.75 && d.acs < avgACS * 0.95);
    const fWR = fullBuyMatches.length ? Math.round(fullBuyMatches.filter(d=>d.won).length/fullBuyMatches.length*100) : 0;
    const eWR = ecoBuyMatches.length ? Math.round(ecoBuyMatches.filter(d=>d.won).length/ecoBuyMatches.length*100) : 0;
    const foWR = forceBuyMatches.length ? Math.round(forceBuyMatches.filter(d=>d.won).length/forceBuyMatches.length*100) : 0;

    html += `<div class="plab-card span4"><div class="plab-card-label">Win Rate by Economy Type (estimated from ACS patterns)</div>
    <table class="plab-eco-table"><thead><tr><th>Type</th><th>Games</th><th>Win Rate</th><th>Avg ACS</th><th>Assessment</th></tr></thead><tbody>
    <tr><td><span class="plab-eco-type" style="color:var(--win)">Full Buy</span></td><td>${fullBuyMatches.length}</td><td style="color:${fWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${fWR}%</td><td>${Math.round(fullBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(fullBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${fWR>=55?'Strong ✓':fWR>=45?'Average':'Underperforming ⚠️'}</td></tr>
    <tr><td><span class="plab-eco-type" style="color:#f5a623">Force Buy</span></td><td>${forceBuyMatches.length}</td><td style="color:${foWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${foWR}%</td><td>${Math.round(forceBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(forceBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${foWR>=45?'Holding well':foWR>=35?'Average':'Struggling'}</td></tr>
    <tr><td><span class="plab-eco-type" style="color:var(--loss)">Eco</span></td><td>${ecoBuyMatches.length}</td><td style="color:${eWR>=40?'var(--win)':'var(--loss)'};font-weight:800">${eWR}%</td><td>${Math.round(ecoBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(ecoBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${eWR>=35?'Good eco steals':eWR>=25?'Expected':'Very low'}</td></tr>
    </tbody></table></div>`;

    const ecoPatterns = [];
    if (fWR < 48) ecoPatterns.push({c:'r', t:`Your full-buy win rate (${fWR}%) is below 50% — when you have the best equipment you should be winning more.`});
    if (eWR >= 35) ecoPatterns.push({c:'g', t:`Strong eco performance (${eWR}% WR) — you steal rounds on pistol/shotgun better than most players at your rank.`});
    if (foWR < 38) ecoPatterns.push({c:'y', t:`Force buy win rate is low (${foWR}%) — consider saving more often instead of forcing.`});
    if (ecoPatterns.length) html += patternBlock(ecoPatterns);

    // 5. RANK BENCHMARKS
    html += plabChapter('🏆', 'Rank Benchmark & Gap Analysis');
    const currentTier = getRankTier(rankName);
    const nextTier = getNextRank(currentTier);
    const currentBench = RANK_BENCHMARKS[currentTier] || RANK_BENCHMARKS['Silver'];
    const nextBench = nextTier ? RANK_BENCHMARKS[nextTier] : null;
    const myKD = parseFloat((data.reduce((s,d)=>s+d.kd,0)/n).toFixed(2));
    const myWR = Math.round(data.filter(d=>d.won).length/n*100);
    const myACS = Math.round(data.reduce((s,d)=>s+d.acs,0)/n);
    const myHS = Math.round(data.reduce((s,d)=>s+d.hsPct,0)/n);

    html += `<div class="plab-grid g2">`;
    html += `<div class="plab-card span2"><div class="plab-card-label">You vs ${currentTier} Average</div><div class="plab-rankgap">
    ${rankGapRow('K/D', myKD, currentBench.kd, nextBench?.kd, myKD >= currentBench.kd)}
    ${rankGapRow('Win Rate', myWR+'%', currentBench.wr+'%', nextBench?.wr+'%', myWR >= currentBench.wr)}
    ${rankGapRow('ACS', myACS, currentBench.acs, nextBench?.acs, myACS >= currentBench.acs)}
    ${rankGapRow('HS%', myHS+'%', currentBench.hs+'%', nextBench?.hs+'%', myHS >= currentBench.hs)}
    </div></div>`;
    if (nextBench) {
      html += `<div class="plab-card span2"><div class="plab-card-label">What You Need for ${nextTier}</div><div class="plab-rankgap">
      ${nextGapRow('K/D', myKD, nextBench.kd, myKD >= nextBench.kd)}
      ${nextGapRow('Win Rate', myWR, nextBench.wr, myWR >= nextBench.wr)}
      ${nextGapRow('ACS', myACS, nextBench.acs, myACS >= nextBench.acs)}
      ${nextGapRow('HS%', myHS, nextBench.hs, myHS >= nextBench.hs)}
      </div></div>`;
    }
    html += `</div>`;

    // 6. WIN PROBABILITY
    html += plabChapter('🎯', 'Win Probability Predictor');
    const agentMapWR = {};
    data.forEach(d => { const k = `${d.agent}|${d.map}`; if (!agentMapWR[k]) agentMapWR[k] = {m:0,w:0}; agentMapWR[k].m++; if(d.won) agentMapWR[k].w++; });
    const agentWR = {};
    data.forEach(d => { if (!agentWR[d.agent]) agentWR[d.agent] = {m:0,w:0}; agentWR[d.agent].m++; if(d.won) agentWR[d.agent].w++; });
    const baseWR = myWR / 100;
    const recentForm = data.slice(0,5).filter(d=>d.won).length / 5;
    const streakBonus = currentStreak.type==='win' ? Math.min(currentStreak.count*0.04, 0.12) : -Math.min(currentStreak.count*0.04, 0.12);
    const combos = Object.entries(agentMapWR).filter(([,v]) => v.m >= 2).map(([k,v]) => { const [agent,map]=k.split('|'); return {agent,map,wr:v.w/v.m,m:v.m}; }).sort((a,b) => b.wr-a.wr);
    const topCombo = combos[0];
    const worstCombo = [...combos].sort((a,b)=>a.wr-b.wr)[0];
    const nextGameProb = Math.max(25, Math.min(75, Math.round((baseWR*0.5 + recentForm*0.35 + 0.5*0.15 + streakBonus) * 100)));
    const probCol = nextGameProb >= 55 ? 'var(--win)' : nextGameProb <= 44 ? 'var(--loss)' : 'var(--accent)';

    html += `<div class="plab-grid">`;
    html += `<div class="plab-card"><div class="plab-card-label">Next Game Win Prob</div><div class="plab-card-val" style="color:${probCol}">${nextGameProb}%</div><div class="plab-card-sub">Based on form, WR & streak</div><div class="plab-bench" style="margin-top:10px"><div class="plab-bench-track"><div class="plab-bench-fill" style="width:${nextGameProb}%;background:${probCol}"></div></div></div></div>`;
    html += `<div class="plab-card"><div class="plab-card-label">Recent Form (Last 5)</div><div class="plab-card-val ${recentForm>=0.6?'good':recentForm<=0.3?'bad':'warn'}">${Math.round(recentForm*100)}%</div><div class="plab-card-sub">${data.slice(0,5).map(d=>d.won?'✓':'✗').join(' ')}</div></div>`;
    if (topCombo) html += `<div class="plab-card good"><div class="plab-card-label">Best Pick Combo</div><div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--win);line-height:1.2">${topCombo.agent}<br><span style="font-size:13px;color:var(--muted)">on ${topCombo.map}</span></div><div class="plab-card-sub">${Math.round(topCombo.wr*100)}% WR · ${topCombo.m} games</div></div>`;
    if (worstCombo && worstCombo.agent !== topCombo?.agent) html += `<div class="plab-card bad"><div class="plab-card-label">Avoid This Combo</div><div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--loss);line-height:1.2">${worstCombo.agent}<br><span style="font-size:13px;color:var(--muted)">on ${worstCombo.map}</span></div><div class="plab-card-sub">${Math.round(worstCombo.wr*100)}% WR · ${worstCombo.m} games</div></div>`;
    html += `</div>`;

    const topAgents = Object.entries(agentWR).filter(([,v])=>v.m>=2).sort((a,b)=>b[1].w/b[1].m - a[1].w/a[1].m).slice(0,6);
    if (topAgents.length) {
      html += `<div class="plab-winprob"><div class="plab-card-label" style="margin-bottom:4px">Win Probability by Agent Pick</div>`;
      topAgents.forEach(([agent, v]) => {
        const pct = Math.round(v.w/v.m*100);
        const col = pct>=55?'var(--win)':pct<=40?'var(--loss)':'var(--accent)';
        html += `<div class="plab-prob-row"><div class="plab-prob-label">${agent} <span style="color:var(--muted2);font-size:9px">(${v.m}g)</span></div><div class="plab-prob-bar-wrap"><div class="plab-prob-bar" style="width:${pct}%;background:${col}"></div></div><div class="plab-prob-pct" style="color:${col}">${pct}%</div></div>`;
      });
      html += `</div>`;
    }

    // 7. ACTION PLAN
    html += plabChapter('📋', 'Personalised Action Plan');
    const actions = [];
    if (duelWinPct < 50) actions.push({ priority:'HIGH', title:'Fix Crosshair Placement', desc:`Your ${duelWinPct}% duel win rate means you're losing more gunfights than you win. Drill: 15 min Aimlab "Microshot" daily, focus on pre-aiming head level at every corner.` });
    if (myHS < (currentBench.hs - 3)) actions.push({ priority:'HIGH', title:'Improve Headshot Rate', desc:`You're at ${myHS}% HS rate vs ${currentBench.hs}% for your rank. Stop burst-firing — one tap, check if enemy is dead, then tap again.` });
    if (tiltLevel) actions.push({ priority:'HIGH', title:'Mental Reset Protocol', desc:`Set a hard rule: max 2 ranked games per session until your last-5 WR improves. Play deathmatch or unranked between ranked games.` });
    if (myWR < currentBench.wr) actions.push({ priority:'MED', title:'Round Economy Awareness', desc:`At ${myWR}% WR vs ${currentBench.wr}% for your rank, you're losing rounds you should win. After every loss, check: did you save when you should have?` });
    if (bestHour.h >= 0 && worstHour.h >= 0 && bestHour.h !== worstHour.h) actions.push({ priority:'MED', title:`Play at ${bestHour.h}:00, Avoid ${worstHour.h}:00`, desc:`Your data shows a ${Math.round((bestHour.wr - worstHour.wr)*100)}% WR swing between your best and worst hours.` });
    if (topCombo) actions.push({ priority:'MED', title:`Queue ${topCombo.agent} on ${topCombo.map}`, desc:`${Math.round(topCombo.wr*100)}% WR in ${topCombo.m} games is your best combo.` });
    if (nextBench && myACS < nextBench.acs) actions.push({ priority:'LOW', title:`Hit ${nextBench.acs} ACS for ${nextTier}`, desc:`You need +${nextBench.acs-myACS} more ACS per round on average.` });
    actions.push({ priority:'LOW', title:'VoD Review — Deaths Only', desc:`Record every session with OBS. Watch only the rounds you died in. Ask: was I peeking without info? Did I have angle disadvantage?` });

    html += `<div class="plab-card span4">`;
    const pColors = {HIGH:'var(--loss)',MED:'#f5a623',LOW:'var(--accent)'};
    actions.forEach((a,i) => {
      html += `<div style="display:flex;align-items:flex-start;gap:14px;padding:${i>0?'12px 0 0':0};${i>0?'border-top:1px solid var(--border);margin-top:12px':''}">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:${pColors[a.priority]};border:1px solid ${pColors[a.priority]}33;flex-shrink:0;margin-top:2px">${a.priority}</div>
        <div><div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:0.5px">${a.title}</div>
        <div style="font-family:'Barlow',sans-serif;font-size:12px;color:rgba(240,240,242,0.7);margin-top:3px;line-height:1.55">${a.desc}</div></div></div>`;
    });
    html += `</div>`;

    // 8. 7-DAY ARC
    html += plabChapter('📈', '7-Day Improvement Arc');
    const now = Date.now();
    const oneDay = 86400000;
    const thisWeek = data.filter(d => d.gameStart && (now - d.gameStart*1000) < 7*oneDay);
    const lastWeek = data.filter(d => d.gameStart && (now - d.gameStart*1000) >= 7*oneDay && (now - d.gameStart*1000) < 14*oneDay);
    const calcStats = arr => {
      if (!arr.length) return null;
      const k = arr.reduce((s,d)=>s+d.k,0), de = arr.reduce((s,d)=>s+d.d,0);
      const wins = arr.filter(d=>d.won).length;
      return { kd: de ? parseFloat((k/de).toFixed(2)) : k, wr: Math.round(wins/arr.length*100), hs: Math.round(arr.reduce((s,d)=>s+d.hsPct,0)/arr.length), n: arr.length };
    };
    const tw = calcStats(thisWeek);
    const lw = calcStats(lastWeek);

    if (tw && lw) {
      const kdDelta = parseFloat((tw.kd - lw.kd).toFixed(2));
      const wrDelta = tw.wr - lw.wr;
      const hsDelta = tw.hs - lw.hs;
      const improving = kdDelta > 0 || wrDelta > 0;
      const col = d => d > 0 ? 'var(--win)' : d < 0 ? 'var(--loss)' : 'var(--muted)';
      const fmt = d => (d > 0 ? '+' : '') + d;
      html += `<div class="plab-card span4"><div class="plab-card-label" style="margin-bottom:12px">This Week vs Last Week</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">K/D</div><div style="font-size:18px;font-weight:900;color:${col(kdDelta)}">${tw.kd} <span style="font-size:12px">${fmt(kdDelta)}</span></div><div style="font-size:10px;color:var(--muted)">was ${lw.kd}</div></div>
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">WIN RATE</div><div style="font-size:18px;font-weight:900;color:${col(wrDelta)}">${tw.wr}% <span style="font-size:12px">${fmt(wrDelta)}%</span></div><div style="font-size:10px;color:var(--muted)">was ${lw.wr}%</div></div>
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">HS RATE</div><div style="font-size:18px;font-weight:900;color:${col(hsDelta)}">${tw.hs}% <span style="font-size:12px">${fmt(hsDelta)}%</span></div><div style="font-size:10px;color:var(--muted)">was ${lw.hs}%</div></div>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:${improving?'var(--win)':'var(--loss)'};line-height:1.5">
          ${improving ? `📈 You're improving week-over-week. Keep the same routine, same agents, same hours.` : `📉 Your stats dipped this week vs last week. Something changed — identify 1 variable and address it.`}
        </div></div>`;
    } else if (tw) {
      html += `<div class="plab-card span4"><div class="plab-card-label">This Week</div><div class="plab-card-sub" style="padding:8px 0">${tw.n} games · ${tw.wr}% WR · ${tw.kd} K/D. Play 5+ games next week for week-over-week comparison.</div></div>`;
    }

    // PLATEAU
    html += plabChapter('⏸️', 'Skill Plateau Detector');
    const platKDs = data.slice(0, Math.min(n, 15)).map(d => d.kd);
    const platMin = platKDs.length ? Math.min(...platKDs) : 0;
    const platMax = platKDs.length ? Math.max(...platKDs) : 0;
    const platRange = parseFloat((platMax - platMin).toFixed(2));
    const isPlateaued = platRange < 0.35 && platKDs.length >= 8;

    if (isPlateaued) {
      html += `<div class="plab-tilt-alert" style="border-color:rgba(232,255,71,0.3);background:rgba(232,255,71,0.04)">
        <div class="plab-tilt-icon" style="font-size:22px">⏸️</div>
        <div><div class="plab-tilt-title" style="color:#e8ff47">SKILL PLATEAU DETECTED</div>
        <div class="plab-tilt-desc">Your K/D has stayed between ${platMin.toFixed(2)} and ${platMax.toFixed(2)} for ${platKDs.length} games (range: ${platRange}). You're stuck. Break your plateau: (1) Switch to 1 agent you've never played for 5 games. (2) Watch 10 min of a Radiant player's VoD on your worst map. (3) Set 1 specific goal per match.</div></div></div>`;
    } else {
      html += `<div class="plab-card good"><div class="plab-card-label">Plateau Status</div><div class="plab-card-val good">✓ Active</div><div class="plab-card-sub">K/D range: ${platRange} over last ${platKDs.length} games — you're still actively improving.</div></div>`;
    }

    // KEEP PLAYING?
    html += plabChapter('🎮', 'Should You Keep Playing?');
    let recTitle='', recDesc='', recColor='var(--win)';
    if (tiltLevel === 'high') { recTitle = '🛑 STOP PLAYING NOW'; recColor = 'var(--loss)'; recDesc = `${currentStreak.count}-game loss streak. Every additional ranked game tonight is likely to be a loss.`; }
    else if (tiltLevel === 'medium') { recTitle = '⚠️ TAKE A BREAK'; recColor = '#f5a623'; recDesc = `${sessionLosses} losses today. Take at least 30 minutes off.`; }
    else if (currentStreak.type === 'win' && currentStreak.count >= 2) { recTitle = '🔥 KEEP GOING'; recColor = 'var(--win)'; recDesc = `${currentStreak.count}-game win streak! Play 1-2 more but set a stop condition.`; }
    else if (sessionMatches.length >= 4) { recTitle = '😴 CONSIDER STOPPING'; recColor = '#f5a623'; recDesc = `${sessionMatches.length} games already played today. Fatigue affects decision-making.`; }
    else { recTitle = '✅ GOOD TO QUEUE'; recColor = 'var(--win)'; recDesc = `No tilt signals. Mentally clear. Go play, but remember: 3 losses = auto-stop rule.`; }
    html += `<div class="plab-card span4" style="border-color:${recColor}33;background:${recColor}08">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:20px;text-transform:uppercase;color:${recColor};margin-bottom:6px">${recTitle}</div>
      <div style="font-size:12px;line-height:1.6;color:rgba(240,240,242,0.8)">${recDesc}</div></div>`;

    return html;
  }

  function plabChapter(icon, title) {
    return `<div class="plab-chapter"><span class="plab-chapter-icon">${icon}</span><span class="plab-chapter-title">${title}</span><div class="plab-chapter-line"></div></div>`;
  }
  function plabCard(label, val, sub, valCls, cardCls) {
    return `<div class="plab-card ${cardCls||''}"><div class="plab-card-label">${label}</div><div class="plab-card-val ${valCls||''}">${val}</div><div class="plab-card-sub">${sub}</div></div>`;
  }
  function patternBlock(patterns) {
    return `<div class="plab-card span4"><div class="plab-patterns">${patterns.map(p=>`<div class="plab-pattern"><div class="plab-dot ${p.c}"></div><div>${p.t}</div></div>`).join('')}</div></div>`;
  }
  function rankGapRow(stat, you, avg, next, passing) {
    return `<div class="plab-rankgap-row"><div class="plab-rankgap-stat">${stat}</div><div class="plab-rankgap-you" style="color:${passing?'var(--win)':'var(--loss)'}">${you}</div><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);min-width:30px">avg</div><div class="plab-rankgap-target">${avg}</div>${next?`<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);min-width:30px">next</div><div class="plab-rankgap-target" style="color:var(--accent)">${next}</div>`:''}<div style="font-family:'DM Mono',monospace;font-size:10px;margin-left:auto;color:${passing?'var(--win)':'var(--loss)'}">${passing?'✓ Above avg':'↑ Needs work'}</div></div>`;
  }
  function nextGapRow(stat, you, target, passing) {
    const youNum = parseFloat(String(you));
    const targetNum = parseFloat(String(target));
    const pct = passing ? 100 : Math.min(99, Math.round((youNum/targetNum)*100));
    const gap = passing ? '✓ Ready' : `Need +${(targetNum-youNum).toFixed(stat==='K/D'?2:0)}`;
    return `<div class="plab-rankgap-row"><div class="plab-rankgap-stat">${stat}</div><div class="plab-rankgap-you" style="color:${passing?'var(--win)':'rgba(240,240,242,0.7)'}">${you}</div><div class="plab-rankgap-bar-wrap" style="margin:0 12px"><div class="plab-rankgap-bar" style="width:${pct}%;background:${passing?'var(--win)':'var(--accent)'}"></div></div><div class="plab-rankgap-target">${target}</div><div style="font-family:'DM Mono',monospace;font-size:9px;color:${passing?'var(--win)':'var(--muted)'};margin-left:8px;white-space:nowrap">${gap}</div></div>`;
  }
</script>

<div class="plab-wrap">
  <div class="plab-clarification-banner">
    <div style="font-size: 22px; filter: drop-shadow(0 0 6px #9333ea);">🧠</div>
    <div>
      <div class="plab-banner-title">Performance Diagnostics Lab</div>
      <div class="plab-banner-desc">
        Your mental game and scheduling defense system. Scans active sessions for <strong>tilt indicators</strong>, computes <strong>win probability dips</strong> due to fatigue, maps <strong>win rate by hour of the day</strong>, and generates dynamic keep-playing guidelines.
      </div>
    </div>
  </div>
  <div class="plab-trigger">
    <div class="plab-trigger-info">
      <div class="plab-trigger-title">🧪 Full Performance Lab</div>
      <div class="plab-trigger-sub">DUELS · ECONOMY · TILT · TIME-OF-DAY · RANK GAP · WIN PROBABILITY · PEER BENCHMARKS</div>
    </div>
    <button class="plab-run-btn" on:click={runLab} disabled={loading}>
      {loading ? '⏳ Running...' : '▶ Run Lab'}
    </button>
  </div>
  {#if loading}
    <div class="plab-loading active">
      <div class="plab-spinner"></div>
      <span class="plab-loading-txt">{loadingText}</span>
    </div>
  {/if}
  {#if results && !loading}
    <div class="plab-results active">{@html results}</div>
  {/if}
</div>

<style>
</style>

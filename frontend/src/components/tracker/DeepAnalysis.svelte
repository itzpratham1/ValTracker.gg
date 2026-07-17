<script>
  import { AGENT_ROLES, getRankFromRR } from '../../lib/constants';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let mmrHistory = {};

  let loading = false;
  let resultHtml = '';

  function findMe(match) {
    const all = match.players?.all_players || match.players || [];
    const tn = (playerName || '').toLowerCase().replace(/\s+/g, '');
    const tt = (playerTag || '').toLowerCase().replace(/\s+/g, '');
    return (Array.isArray(all) ? all : []).find(
      p => (p.name || '').toLowerCase().replace(/\s+/g, '') === tn &&
           (p.tag || '').toLowerCase().replace(/\s+/g, '') === tt
    ) || null;
  }

  function getRoleClass(agentName) {
    let clean = agentName || '';
    if (clean.toLowerCase() === 'kayo' || clean.toLowerCase() === 'kay/o') clean = 'KAY/O';
    return AGENT_ROLES[clean.toLowerCase().replace(/\//g, '')] || 'duelist';
  }

  function chapter(icon, title) {
    return `<div class="deep-chapter"><span class="deep-chapter-icon">${icon}</span><span class="deep-chapter-title">${title}</span><div class="deep-chapter-line"></div></div>`;
  }

  function deepCard(label, val, sub, valCls, accentCls) {
    return `<div class="deep-card ${accentCls || ''}"><div class="deep-card-label">${label}</div><div class="deep-card-val ${valCls || ''}">${val}</div><div class="deep-card-sub">${sub}</div></div>`;
  }

  function trendCard(label, oldVal, newVal, delta, deltaCls) {
    const isUp = delta.includes('▲');
    return `<div class="deep-card"><div class="deep-card-label">${label}</div><div style="display:flex;align-items:flex-end;gap:8px;margin-top:4px;"><div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;line-height:1;">${newVal}</div><div style="margin-bottom:4px;"><div style="font-family:'DM Mono',monospace;font-size:10px;color:${isUp ? 'var(--win)' : 'var(--loss)'};">${delta}</div><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">was ${oldVal}</div></div></div></div>`;
  }

  function patternCard(patterns) {
    return `<div class="deep-card span3"><div class="deep-pattern-list">${patterns.map(p => `<div class="deep-pattern-item"><div class="deep-pattern-dot ${p.dot}"></div><div>${p.text}</div></div>`).join('')}</div></div>`;
  }

  async function runDeepAnalysis() {
    if (!matches.length) return;
    loading = true;
    resultHtml = '';

    const msgs = ['PROCESSING MATCHES...', 'ANALYSING MAP DATA...', 'CALCULATING ATTACK/DEFENCE...', 'DETECTING PATTERNS...', 'BUILDING REPORT...'];
    let mi = 0;
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; }, 700);
    await new Promise(r => setTimeout(r, 800));

    try {
      resultHtml = buildDeepAnalysis(matches);
    } catch (e) {
      resultHtml = `<div style="color:var(--loss);padding:16px">Analysis error: ${e.message}</div>`;
    } finally {
      clearInterval(iv);
      loading = false;
    }
  }

  function buildDeepAnalysis(allMatches) {
    const data = [];
    for (const match of allMatches) {
      const me = findMe(match);
      if (!me) continue;
      const s = me.stats || {};
      const k = s.kills || 0, d = s.deaths || 0, a = s.assists || 0, sc = s.score || 0;
      const hs = s.headshots || 0, shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);
      const myTeamId = (me.team || '').toLowerCase();
      const won = match.teams?.[myTeamId]?.has_won || false;
      const agent = me.character || 'Unknown';
      const map = match.metadata?.map || 'Unknown';
      const matchId = match.metadata?.matchid || match.metadata?.match_id || '';
      const rr = mmrHistory[matchId];
      const role = getRoleClass(agent);
      const gameStart = match.metadata?.game_start || null;
      const rounds = match.rounds || [];
      const myTeam = match.teams?.[myTeamId] || {};
      const oppId = myTeamId === 'red' ? 'blue' : 'red';
      const oppTeam = match.teams?.[oppId] || {};
      const myRoundsWon = myTeam.rounds_won ?? 0;
      const oppRoundsWon = oppTeam.rounds_won ?? 0;
      const totalRounds = myRoundsWon + oppRoundsWon;
      const acs = Math.round(sc / Math.max(1, totalRounds));
      const hsPct = shots ? Math.round((hs / shots) * 100) : 0;

      // Attack/Defence estimation
      let halfSize = 12;
      const modeName = (match.metadata?.mode || '').toLowerCase();
      if (modeName.includes('swiftplay')) halfSize = 4;
      else if (modeName.includes('spike rush')) halfSize = 3;
      const myTeamAttacksFirst = myTeamId === 'red';
      const regularRounds = Math.min(totalRounds, halfSize * 2);
      const half = Math.min(halfSize, regularRounds);
      const secondHalf = Math.max(0, regularRounds - halfSize);
      let atkRoundsPlayed = myTeamAttacksFirst ? half : secondHalf;
      let defRoundsPlayed = myTeamAttacksFirst ? secondHalf : half;
      let atkWins = 0, defWins = 0;
      if (totalRounds > 0) {
        const atkFrac = atkRoundsPlayed / totalRounds;
        atkWins = Math.round(myRoundsWon * atkFrac);
        defWins = myRoundsWon - atkWins;
      }
      const atkKills = atkRoundsPlayed > 0 ? Math.round(k * (atkRoundsPlayed / Math.max(totalRounds, 1))) : 0;
      const defKills = k - atkKills;

      data.push({ k, d, a, sc, hs, shots, acs, hsPct, won, agent, map, matchId, rr, role,
        atkKills, defKills, atkRoundsPlayed, defRoundsPlayed, atkWins, defWins,
        myRoundsWon, oppRoundsWon, totalRounds, gameStart, myTeamId });
    }

    if (!data.length) return '<div>Not enough data</div>';

    const n = data.length;
    let html = '';

    // Chapter 1 — Map Deep Dive
    html += chapter('🗺️', 'Map Performance Deep Dive');
    const mapStats = {};
    for (const d of data) {
      if (!mapStats[d.map]) mapStats[d.map] = { m: 0, w: 0, k: 0, de: 0, sc: 0, hs: 0, sh: 0, atkK: 0, defK: 0, atkW: 0, defW: 0, atkR: 0, defR: 0, r: 0, rr: 0, hasRR: false };
      const ms = mapStats[d.map];
      ms.m++; if (d.won) ms.w++; ms.k += d.k; ms.de += d.d; ms.sc += d.sc; ms.r += d.totalRounds;
      ms.hs += d.hs; ms.sh += d.shots; ms.atkK += d.atkKills; ms.defK += d.defKills;
      ms.atkW += d.atkWins; ms.defW += d.defWins; ms.atkR += d.atkRoundsPlayed; ms.defR += d.defRoundsPlayed;
      if (d.rr !== undefined && d.rr !== null) { ms.rr += d.rr; ms.hasRR = true; }
    }

    const mapRows = Object.entries(mapStats).filter(([, ms]) => ms.m >= 1).sort((a, b) => b[1].m - a[1].m);
    const hasRR = mapRows.some(([, ms]) => ms.hasRR);

    html += `<div class="deep-card span3"><div class="deep-card-label">All Maps — Performance Breakdown</div><table class="deep-map-table"><thead><tr><th>Map</th><th>W/L</th><th>WR%</th><th>K/D</th><th>ACS</th><th>HS%</th><th>Atk WR%</th><th>Def WR%</th>${hasRR ? '<th>RR</th>' : ''}</tr></thead><tbody>`;
    for (const [mapName, ms] of mapRows) {
      const wr = Math.round((ms.w / ms.m) * 100);
      const kd = ms.de ? (ms.k / ms.de).toFixed(2) : ms.k;
      const acs = Math.round(ms.sc / Math.max(1, ms.r));
      const hsPct = ms.sh ? Math.round((ms.hs / ms.sh) * 100) : 0;
      const atkWR = ms.atkR ? Math.round((ms.atkW / ms.atkR) * 100) : null;
      const defWR = ms.defR ? Math.round((ms.defW / ms.defR) * 100) : null;
      const verdict = wr >= 55 ? 'strong' : wr >= 45 ? 'avg' : 'weak';
      const verdictTxt = wr >= 55 ? 'Strong' : wr >= 45 ? 'Average' : 'Weak';
      const wrCol = wr >= 55 ? 'color:var(--win)' : wr < 45 ? 'color:var(--loss)' : 'color:#f5a623';
      const kdCol = parseFloat(String(kd)) >= 1.2 ? 'color:var(--win)' : parseFloat(String(kd)) < 0.9 ? 'color:var(--loss)' : '';
      const rrTxt = ms.hasRR ? `<span style="${ms.rr > 0 ? 'color:var(--win)' : ms.rr < 0 ? 'color:var(--loss)' : ''}">${ms.rr > 0 ? '+' : ''}${ms.rr}</span>` : '';
      html += `<tr><td><span class="deep-map-row-name">${mapName}</span><span class="deep-map-verdict ${verdict}">${verdictTxt}</span></td><td>${ms.w}W / ${ms.m - ms.w}L</td><td style="${wrCol};font-weight:800">${wr}%</td><td style="${kdCol}">${kd}</td><td>${acs}</td><td style="${hsPct < 15 ? 'color:var(--loss)' : hsPct >= 25 ? 'color:var(--win)' : ''}">${hsPct}%</td><td style="${atkWR !== null && atkWR < 45 ? 'color:var(--loss)' : atkWR !== null && atkWR >= 55 ? 'color:var(--win)' : ''}">${atkWR !== null ? atkWR + '%' : '—'}</td><td style="${defWR !== null && defWR < 45 ? 'color:var(--loss)' : defWR !== null && defWR >= 55 ? 'color:var(--win)' : ''}">${defWR !== null ? defWR + '%' : '—'}</td>${hasRR ? `<td>${rrTxt || '—'}</td>` : ''}</tr>`;
    }
    html += `</tbody></table></div>`;

    // Best/worst map cards
    const sorted = [...mapRows].sort((a, b) => (b[1].w / b[1].m) - (a[1].w / a[1].m));
    const bestMap = sorted[0], worstMap = sorted[sorted.length - 1];
    if (bestMap) {
      html += `<div class="deep-insight-grid cols2">`;
      html += deepCard('Best Map', bestMap[0].toUpperCase(), `${Math.round((bestMap[1].w / bestMap[1].m) * 100)}% WR · ${bestMap[1].m} games`, 'good', 'accent-green');
      if (worstMap && worstMap[0] !== bestMap[0]) {
        html += deepCard('Worst Map', worstMap[0].toUpperCase(), `${Math.round((worstMap[1].w / worstMap[1].m) * 100)}% WR`, 'bad', 'accent-red');
      }
      html += `</div>`;
    }

    // Chapter 2 — Attack vs Defence
    html += chapter('⚔️', 'Attack vs Defence');
    let totAtkK = 0, totDefK = 0, totAtkW = 0, totDefW = 0, totAtkR = 0, totDefR = 0;
    for (const d of data) { totAtkK += d.atkKills; totDefK += d.defKills; totAtkW += d.atkWins; totDefW += d.defWins; totAtkR += d.atkRoundsPlayed; totDefR += d.defRoundsPlayed; }
    const atkWR = totAtkR ? Math.round((totAtkW / totAtkR) * 100) : 0;
    const defWR = totDefR ? Math.round((totDefW / totDefR) * 100) : 0;
    const atkKPR = totAtkR ? (totAtkK / totAtkR).toFixed(2) : '0';
    const defKPR = totDefR ? (totDefK / totDefR).toFixed(2) : '0';
    const atkStronger = atkWR >= defWR;

    html += `<div class="deep-insight-grid cols4">`;
    html += deepCard('Attack WR', atkWR + '%', `${totAtkW}W / ${totAtkR - totAtkW}L · ${atkKPR} KPR`, atkWR >= 50 ? 'good' : atkWR >= 42 ? 'warn' : 'bad', atkStronger ? 'accent-green' : '');
    html += deepCard('Defence WR', defWR + '%', `${totDefW}W / ${totDefR - totDefW}L · ${defKPR} KPR`, defWR >= 50 ? 'good' : defWR >= 42 ? 'warn' : 'bad', !atkStronger ? 'accent-green' : '');
    html += deepCard('Avg Kills Atk Half', (totAtkK / Math.max(n, 1)).toFixed(1), `${atkKPR} est. KPR`, parseFloat(atkKPR) >= 0.7 ? 'good' : parseFloat(atkKPR) >= 0.5 ? 'warn' : 'bad', '');
    html += deepCard('Avg Kills Def Half', (totDefK / Math.max(n, 1)).toFixed(1), `${defKPR} est. KPR`, parseFloat(defKPR) >= 0.7 ? 'good' : parseFloat(defKPR) >= 0.5 ? 'warn' : 'bad', '');
    html += `</div>`;

    // Pattern insights
    const atkDefPatterns = [];
    const gap = Math.abs(atkWR - defWR);
    if (gap >= 15) {
      const weak = atkStronger ? 'defence' : 'attack';
      atkDefPatterns.push({ dot: 'r', text: `Your ${weak} side is significantly weaker (${atkStronger ? defWR : atkWR}% WR vs ${atkStronger ? atkWR : defWR}% on ${atkStronger ? 'attack' : 'defence'}). This is your biggest macro problem.` });
    } else if (gap < 8) {
      atkDefPatterns.push({ dot: 'g', text: `Your attack and defence win rates are balanced (${atkWR}% atk / ${defWR}% def) — you adapt well to both halves.` });
    }
    if (atkDefPatterns.length) html += patternCard(atkDefPatterns);

    // Chapter 3 — Agent-Map Fit
    html += chapter('🎭', 'Agent-Map Mismatch Analysis');
    const agentMapMatrix = {};
    for (const d of data) {
      const key = `${d.agent}|${d.map}`;
      if (!agentMapMatrix[key]) agentMapMatrix[key] = { agent: d.agent, map: d.map, m: 0, w: 0, k: 0, de: 0, sc: 0, r: 0, role: d.role };
      const e = agentMapMatrix[key];
      e.m++; if (d.won) e.w++; e.k += d.k; e.de += d.d; e.sc += d.sc; e.r += d.totalRounds;
    }

    const mismatches = [], goodFits = [];
    for (const e of Object.values(agentMapMatrix)) {
      if (e.m < 2) continue;
      const wr = Math.round((e.w / e.m) * 100);
      const kd = e.de ? (e.k / e.de).toFixed(2) : e.k;
      const acs = Math.round(e.sc / Math.max(1, e.r));
      if (wr <= 35) mismatches.push({ agent: e.agent, map: e.map, m: e.m, w: e.w, k: e.k, de: e.de, sc: e.sc, role: e.role, wr, kd, acs });
      else if (wr >= 65) goodFits.push({ agent: e.agent, map: e.map, m: e.m, w: e.w, k: e.k, de: e.de, sc: e.sc, role: e.role, wr, kd, acs });
    }
    mismatches.sort((a, b) => a.wr - b.wr);
    goodFits.sort((a, b) => b.wr - a.wr);

    html += `<div class="deep-card span3"><div class="deep-card-label">Problem Combinations (≥2 games, ≤35% WR)</div>`;
    if (!mismatches.length) {
      html += `<div style="color:var(--win);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">No significant mismatches found — nice!</div>`;
    } else {
      for (const e of mismatches.slice(0, 5)) {
        html += `<div class="deep-mismatch-row"><span class="deep-mismatch-agent">${e.agent}</span><span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span><span class="deep-mismatch-stat" style="color:var(--loss)">${e.wr}% WR</span><span class="deep-mismatch-stat">${e.kd} K/D</span><span class="deep-mismatch-tag bad">${e.m} games</span></div>`;
      }
    }
    html += `</div>`;

    html += `<div class="deep-card span3"><div class="deep-card-label">Strong Combinations (≥2 games, ≥65% WR)</div>`;
    if (!goodFits.length) {
      html += `<div style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">Not enough data yet — play more matches with the same agent on the same map.</div>`;
    } else {
      for (const e of goodFits.slice(0, 4)) {
        html += `<div class="deep-mismatch-row"><span class="deep-mismatch-agent">${e.agent}</span><span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span><span class="deep-mismatch-stat" style="color:var(--win)">${e.wr}% WR</span><span class="deep-mismatch-stat">${e.kd} K/D</span><span class="deep-mismatch-tag ok">${e.m} games</span></div>`;
      }
    }
    html += `</div>`;

    // Chapter 4 — Improvement Trend
    html += chapter('📈', 'Improvement Over Time');
    const third = Math.floor(n / 3) || 1;
    const early = data.slice(n - third, n);
    const recent = data.slice(0, third);
    const avg = (arr, fn) => arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0;
    const eKD = avg(early, d => d.d ? (d.k / d.d) : d.k);
    const rKD = avg(recent, d => d.d ? (d.k / d.d) : d.k);
    const eWR = avg(early, d => d.won ? 1 : 0) * 100;
    const rWR = avg(recent, d => d.won ? 1 : 0) * 100;
    const eACS = avg(early, d => d.acs);
    const rACS = avg(recent, d => d.acs);
    const eHS = avg(early, d => d.hsPct);
    const rHS = avg(recent, d => d.hsPct);
      const delta = (r, e) => { const d = r - e; return d > 0 ? `▲ +${d.toFixed(1)}` : `▼ ${d.toFixed(1)}`; };
      const dCls = (r, e) => r > e ? 'good' : r < e ? 'bad' : 'warn';

    html += `<div class="deep-insight-grid cols4">`;
    html += trendCard('K/D Trend', eKD.toFixed(2), rKD.toFixed(2), delta(rKD, eKD), dCls(rKD, eKD));
    html += trendCard('Win Rate Trend', Math.round(eWR) + '%', Math.round(rWR) + '%', delta(rWR, eWR), dCls(rWR, eWR));
    html += trendCard('ACS Trend', Math.round(eACS), Math.round(rACS), delta(rACS, eACS), dCls(rACS, eACS));
    html += trendCard('HS% Trend', Math.round(eHS) + '%', Math.round(rHS) + '%', delta(rHS, eHS), dCls(rHS, eHS));
    html += `</div>`;

    const trendPatterns = [];
    if (rKD - eKD > 0.15) trendPatterns.push({ dot: 'g', text: `Your K/D has improved by ${(rKD - eKD).toFixed(2)} — you are winning duels more consistently.` });
    else if (eKD - rKD > 0.15) trendPatterns.push({ dot: 'r', text: `Your K/D has dropped by ${(eKD - rKD).toFixed(2)} recently — review your last 5 losses.` });
    if (!trendPatterns.length) trendPatterns.push({ dot: 'y', text: `Your performance is relatively stable across the tracked period.` });
    html += patternCard(trendPatterns);

    // Chapter 5 — Death Pattern
    html += chapter('💀', 'Death Pattern Analysis');
    const totalDeaths = data.reduce((s, d) => s + d.d, 0);
    const avgDeaths = (totalDeaths / n).toFixed(1);
    const highDeathGames = data.filter(d => d.d >= 16).length;
    const lowDeathGames = data.filter(d => d.d <= 9).length;
    const highDeathWR = data.filter(d => d.d >= 16).filter(d => d.won).length;
    const lowDeathWR = data.filter(d => d.d <= 9).filter(d => d.won).length;
    const winRateHighD = highDeathGames ? Math.round((highDeathWR / highDeathGames) * 100) : 0;
    const winRateLowD = lowDeathGames ? Math.round((lowDeathWR / lowDeathGames) * 100) : 0;

    html += `<div class="deep-insight-grid cols3">`;
    html += deepCard('Avg Deaths/Game', avgDeaths, parseFloat(avgDeaths) <= 10 ? 'Elite' : parseFloat(avgDeaths) <= 13 ? 'Good' : parseFloat(avgDeaths) <= 16 ? 'Average' : 'High', parseFloat(avgDeaths) <= 13 ? 'good' : parseFloat(avgDeaths) <= 16 ? 'warn' : 'bad', '');
    html += deepCard('High Death Games', `${highDeathGames}/${n}`, `WR when dying 16+: ${winRateHighD}%`, winRateHighD < 35 ? 'bad' : 'warn', highDeathGames > n * 0.3 ? 'accent-red' : '');
    html += deepCard('Low Death Games', `${lowDeathGames}/${n}`, `WR when dying ≤9: ${winRateLowD}%`, winRateLowD >= 65 ? 'good' : 'warn', '');
    html += `</div>`;

    // Chapter 6 — Top Priorities
    html += chapter('🎯', 'Your Top Improvement Priorities');
    const priorities = [];
    const overallHS = data.reduce((s, d) => s + d.hsPct, 0) / n;
    const overallWR = data.filter(d => d.won).length / n * 100;

    if (overallHS < 16) priorities.push({ title: 'Headshot Rate', desc: `${Math.round(overallHS)}% HS rate is below the Silver/Gold threshold (~20%). Spend 10 min daily in Aimlab on Microshot (head-only mode).`, score: 3 });
    if (parseFloat(avgDeaths) >= 15) priorities.push({ title: 'Death Reduction', desc: `${avgDeaths} avg deaths is costing you rounds. Identify the 2-3 angles where you die most per session.`, score: 3 });
    if (gap >= 15) priorities.push({ title: `${atkStronger ? 'Defence' : 'Attack'} Side Mechanics`, desc: `${atkStronger ? defWR : atkWR}% WR on ${atkStronger ? 'defence' : 'attack'} vs ${atkStronger ? atkWR : defWR}% on the other side — a 15%+ gap.`, score: 2 });
    if (overallWR < 47) priorities.push({ title: 'Round Closing', desc: `${Math.round(overallWR)}% win rate — focus on not forcing when ahead and playing for post-plant.`, score: 2 });
    priorities.push({ title: 'VoD Review Habit', desc: `Record your games. After every loss, watch only the rounds you died in. 10 minutes of VoD review accelerates improvement.`, score: 1 });
    priorities.sort((a, b) => b.score - a.score);

    html += `<div class="deep-priority"><div class="deep-priority-label">Do These In Order</div><div class="deep-priority-list">`;
    for (let i = 0; i < Math.min(priorities.length, 5); i++) {
      const p = priorities[i];
      html += `<div class="deep-priority-item"><div class="deep-priority-num">${i + 1}</div><div class="deep-priority-text"><div class="deep-priority-title">${p.title}</div><div class="deep-priority-desc">${p.desc}</div></div></div>`;
    }
    html += `</div></div>`;

    return html;
  }
</script>

<div class="deep-wrap">
  <div class="deep-clarification-banner">
    <div class="deep-clar-icon">🔬</div>
    <div>
      <div class="deep-clar-title">Deep Self-Analysis Diagnostics</div>
      <div class="deep-clar-desc">
        Your micro-tactical execution blueprint. Correlates rounds to calculate <strong>map side win rates</strong>, evaluates <strong>agent-to-map performance fits</strong>, checks for <strong>multi-match consistency trends</strong>, and issues direct strategic recommendations.
      </div>
    </div>
  </div>

  <div class="deep-trigger-card">
    <div class="deep-trigger-info">
      <div class="deep-trigger-title">🔬 Deep Self-Analysis</div>
      <div class="deep-trigger-sub">MAP WEAKNESS · ATTACK VS DEFENCE · AGENT-MAP FIT · IMPROVEMENT TREND · PRIORITIES</div>
    </div>
    <button class="deep-run-btn" on:click={runDeepAnalysis} disabled={loading}>
      {loading ? 'Analysing...' : '🔬 Run Analysis'}
    </button>
  </div>

  {#if loading}
    <div class="deep-loading">
      <div class="deep-spinner"></div>
      <span class="deep-loading-txt">PROCESSING MATCHES...</span>
    </div>
  {/if}

  {#if resultHtml}
    <div class="deep-results active">{@html resultHtml}</div>
  {/if}
</div>

<style>
</style>

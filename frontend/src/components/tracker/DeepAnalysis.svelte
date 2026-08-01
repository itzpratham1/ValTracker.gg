<script>
  import { tick, onMount, onDestroy } from 'svelte';
  import { AGENT_ROLES, getRankFromRR, MAP_IMAGES_FALLBACK } from '../../lib/constants';
  import { getAgentIconUrl } from '../../lib/assets';
  import { animateAllNumbersInContainer } from '../../lib/aiStreamer';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let rankName = 'Silver 2';
  export let mmrHistory = {};
  export let currentMode = 'competitive';

  let loading = false;
  let resultHtml = '';
  let deepBodyEl = null;
  let cardEl = null;

  let activeChapter = 'map';

  const SUBNAV_ITEMS = [
    { id: 'map', label: 'MAP TELEMETRY', icon: '🗺️' },
    { id: 'duels', label: 'DUELS', icon: '⚔️' },
    { id: 'agent', label: 'AGENT FIT', icon: '🎭' },
    { id: 'time', label: 'TIME-OF-DAY', icon: '🕐' },
    { id: 'economy', label: 'ECONOMY', icon: '💰' },
    { id: 'plan', label: 'ACTION PLAN', icon: '📋' },
    { id: 'rankgap', label: 'RANK GAP', icon: '🏆' },
    { id: 'death', label: 'DEATH PATTERNS', icon: '💀' },
    { id: 'trend', label: 'TRENDS', icon: '📈' }
  ];

  function scrollToChapter(id) {
    activeChapter = id;
    const el = document.getElementById('deep-chapter-' + id);
    if (el) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 800;
      const topbar = document.querySelector('.topbar');
      const nav = document.querySelector('.tracker-nav');
      const topbarH = (!isMobile && topbar) ? topbar.offsetHeight : 0;
      const navH = nav ? nav.offsetHeight : 52;
      const totalOffset = topbarH + navH + 24;

      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
      const targetY = Math.max(0, elementTop - totalOffset);

      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }

  let loadingText = 'PROCESSING MATCH TELEMETRY...';

  // --- Scroll-triggered: only run when card enters viewport ---
  let hasBeenVisible = false;
  let observer = null;

  function maybeRunOnVisible() {
    if (!hasBeenVisible) return;
    if (resultHtml || loading) return;
    if (!matches || !matches.length) return;
    runDeepAnalysis();
  }

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasBeenVisible) {
          hasBeenVisible = true;
          observer.disconnect();
          maybeRunOnVisible();
        }
      },
      { threshold: 0.12 }
    );
    if (cardEl) observer.observe(cardEl);
  });

  onDestroy(() => { if (observer) observer.disconnect(); });

  // If matches arrive AFTER the card is already in view, start then
  $: if (matches && matches.length) { maybeRunOnVisible(); }

  function findMe(match) {
    if (!match) return null;
    const all = Array.isArray(match.players) ? match.players : (match.players?.all_players || match.players || []);
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

  function chapter(icon, title, id = '') {
    const idAttr = id ? ` id="deep-chapter-${id}"` : '';
    return `<div class="deep-chapter"${idAttr}><span class="deep-chapter-icon">${icon}</span><span class="deep-chapter-title">${title}</span><div class="deep-chapter-line"></div></div>`;
  }

  function deepCard(label, val, sub, valCls, accentCls) {
    return `<div class="deep-card ${accentCls || ''}"><div class="deep-card-label">${label}</div><div class="deep-card-val ${valCls || ''}">${val}</div><div class="deep-card-sub">${sub}</div></div>`;
  }

  function trendCard(label, oldVal, newVal, delta, deltaCls) {
    const isUp = delta.includes('▲');
    return `<div class="deep-card"><div class="deep-card-label">${label}</div><div style="display:flex;align-items:flex-end;gap:8px;margin-top:4px;"><div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:30px;line-height:1;">${newVal}</div><div style="margin-bottom:4px;"><div style="font-family:'DM Mono',monospace;font-size:10px;color:${isUp ? 'var(--win)' : 'var(--loss)'};">${delta}</div><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">was ${oldVal}</div></div></div></div>`;
  }

  async function runDeepAnalysis() {
    if (!matches || !matches.length) return;
    loading = true;
    resultHtml = '';

    const msgs = [
      'PROCESSING MATCH TELEMETRY...',
      'ANALYSING MAP SIDE WIN RATES...',
      'CALCULATING AGENT SYNERGY...',
      'MAPPING TIME-OF-DAY HEATMAP...',
      'BENCHMARKING VS RANK TIERS...'
    ];
    let mi = 0;
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; loadingText = msgs[mi]; }, 400);

    await new Promise(r => setTimeout(r, 1200));

    try {
      resultHtml = buildDeepAnalysis(matches);
      clearInterval(iv);
      loading = false;
      await tick();
      if (deepBodyEl) animateAllNumbersInContainer(deepBodyEl);
    } catch (e) {
      resultHtml = `<div style="color:var(--loss);padding:16px">Analysis error: ${e.message}</div>`;
      clearInterval(iv);
      loading = false;
    }
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

  function rankGapRow(stat, you, avg, next, passing) {
    return `<div class="plab-rankgap-row"><div class="plab-rankgap-stat">${stat}</div><div class="plab-rankgap-you" style="color:${passing?'var(--win)':'var(--loss)'}">${you}</div><div class="plab-rankgap-lbl">avg</div><div class="plab-rankgap-target">${avg}</div>${next?`<div class="plab-rankgap-lbl">next</div><div class="plab-rankgap-target" style="color:var(--accent)">${next}</div>`:''}<div class="plab-rankgap-status" style="color:${passing?'var(--win)':'var(--loss)'}">${passing?'✓ Above avg':'↑ Needs work'}</div></div>`;
  }

  function nextGapRow(stat, you, target, passing) {
    const youNum = parseFloat(String(you));
    const targetNum = parseFloat(String(target));
    const pct = passing ? 100 : Math.min(99, Math.round((youNum/targetNum)*100));
    const gap = passing ? '✓ Ready' : `Need +${(targetNum-youNum).toFixed(stat==='K/D'?2:0)}`;
    return `<div class="plab-rankgap-row"><div class="plab-rankgap-stat">${stat}</div><div class="plab-rankgap-you" style="color:${passing?'var(--win)':'rgba(240,240,242,0.7)'}">${you}</div><div class="plab-rankgap-bar-wrap"><div class="plab-rankgap-bar" style="width:${pct}%;background:${passing?'var(--win)':'var(--accent)'}"></div></div><div class="plab-rankgap-target">${target}</div><div class="plab-rankgap-gap-lbl" style="color:${passing?'var(--win)':'var(--muted)'}">${gap}</div></div>`;
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
      const myTeam = match.teams?.[myTeamId] || {};
      const oppId = myTeamId === 'red' ? 'blue' : 'red';
      const oppTeam = match.teams?.[oppId] || {};
      const myRoundsWon = myTeam.rounds_won ?? 0;
      const oppRoundsWon = oppTeam.rounds_won ?? 0;
      const totalRounds = myRoundsWon + oppRoundsWon;
      const acs = Math.round(sc / Math.max(1, totalRounds));
      const hsPct = shots ? Math.round((hs / shots) * 100) : 0;
      const kd = d ? k/d : k;

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

      data.push({ k, d, a, sc, hs, shots, acs, hsPct, kd, won, agent, map, matchId, rr, role,
        atkKills, defKills, atkRoundsPlayed, defRoundsPlayed, atkWins, defWins,
        myRoundsWon, oppRoundsWon, totalRounds, gameStart, myTeamId });
    }

    if (!data.length) return '<div>Not enough match data</div>';

    const n = data.length;
    let html = '';

    // Chapter 1 — Map Deep Dive
    html += chapter('🗺️', 'Map Performance Telemetry', 'map');
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

    html += `<div class="deep-card span3"><div class="deep-card-label">All Maps — Performance Breakdown</div><div class="deep-table-wrap"><table class="deep-map-table"><thead><tr><th>Map</th><th>W/L</th><th>WR%</th><th>K/D</th><th>ACS</th><th>HS%</th><th>Atk WR%</th><th>Def WR%</th>${hasRR ? '<th>RR</th>' : ''}</tr></thead><tbody>`;
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
      const mapImg = MAP_IMAGES_FALLBACK[mapName] || null;

      html += `<tr><td>
        <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
          ${mapImg ? `<img src="${mapImg}" alt="${mapName}" style="width:28px;height:28px;border-radius:4px;object-fit:cover;border:1px solid rgba(255,255,255,0.15);flex-shrink:0;" />` : ''}
          <div style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
            <span class="deep-map-row-name">${mapName}</span>
            <span class="deep-map-verdict ${verdict}">${verdictTxt}</span>
          </div>
        </div>
      </td><td style="white-space:nowrap;">${ms.w}W / ${ms.m - ms.w}L</td><td style="${wrCol};font-weight:800;white-space:nowrap;">${wr}%</td><td style="${kdCol};white-space:nowrap;">${kd}</td><td style="white-space:nowrap;">${acs}</td><td style="${hsPct < 15 ? 'color:var(--loss)' : hsPct >= 25 ? 'color:var(--win)' : ''};white-space:nowrap;">${hsPct}%</td><td style="${atkWR !== null && atkWR < 45 ? 'color:var(--loss)' : atkWR !== null && atkWR >= 55 ? 'color:var(--win)' : ''};white-space:nowrap;">${atkWR !== null ? atkWR + '%' : '—'}</td><td style="${defWR !== null && defWR < 45 ? 'color:var(--loss)' : defWR !== null && defWR >= 55 ? 'color:var(--win)' : ''};white-space:nowrap;">${defWR !== null ? defWR + '%' : '—'}</td>${hasRR ? `<td style="white-space:nowrap;">${rrTxt || '—'}</td>` : ''}</tr>`;
    }
    html += `</tbody></table></div></div>`;

    // MAP-BY-MAP AGENT PICK ASSISTANT
    html += chapter('🎮', 'Map-by-Map Agent Pick Assistant', 'agentpick');
    const agentMapWR = {};
    data.forEach(d => {
      const k = `${d.map}|${d.agent}`;
      if (!agentMapWR[k]) agentMapWR[k] = { map: d.map, agent: d.agent, m: 0, w: 0, k: 0, de: 0 };
      agentMapWR[k].m++;
      if (d.won) agentMapWR[k].w++;
      agentMapWR[k].k += d.k;
      agentMapWR[k].de += d.d;
    });

    const mapPickMap = {};
    Object.values(agentMapWR).forEach(item => {
      if (!mapPickMap[item.map]) mapPickMap[item.map] = [];
      const wr = Math.round((item.w / item.m) * 100);
      const kd = item.de ? parseFloat((item.k / item.de).toFixed(2)) : item.k;
      mapPickMap[item.map].push({ agent: item.agent, wr, m: item.m, kd });
    });

    html += `<div class="ai-agent-pick-grid">`;
    for (const [mapName, agentList] of Object.entries(mapPickMap)) {
      agentList.sort((a, b) => b.wr - a.wr);
      const best = agentList[0];
      const worst = agentList.length > 1 ? agentList[agentList.length - 1] : null;
      const mapSplash = MAP_IMAGES_FALLBACK[mapName] || '';
      const bestIcon = getAgentIconUrl(best.agent);
      const worstIcon = worst ? getAgentIconUrl(worst.agent) : null;

      html += `<div class="ai-agent-pick-card" style="background:${mapSplash ? `linear-gradient(180deg, rgba(15,15,22,0.85) 0%, rgba(11,11,15,0.96) 100%), url('${mapSplash}') center/cover no-repeat` : 'rgba(20,20,28,0.85)'};">
        <div class="ai-agent-pick-map-head">
          <span class="ai-agent-pick-map-name">${mapName.toUpperCase()}</span>
          <span class="ai-agent-pick-map-badge">${agentList.length} ${agentList.length === 1 ? 'agent' : 'agents'}</span>
        </div>
        <div class="ai-agent-pick-rows">
          <div class="ai-agent-pick-row good">
            <div class="ai-agent-pick-left">
              ${bestIcon ? `<img src="${bestIcon}" alt="${best.agent}" class="ai-agent-pick-avatar win" />` : ''}
              <span class="ai-agent-pick-agent">${best.agent}</span>
              <span class="ai-agent-pick-badge win">BEST</span>
            </div>
            <div class="ai-agent-pick-right">
              <span class="ai-agent-pick-stat win">${best.wr}% WR</span>
              <span class="ai-agent-pick-stat kd">${best.kd} K/D</span>
              <span class="ai-agent-pick-count">(${best.m}g)</span>
            </div>
          </div>
          ${worst && worst.agent !== best.agent ? `
            <div class="ai-agent-pick-row bad">
              <div class="ai-agent-pick-left">
                ${worstIcon ? `<img src="${worstIcon}" alt="${worst.agent}" class="ai-agent-pick-avatar loss" />` : ''}
                <span class="ai-agent-pick-agent">${worst.agent}</span>
                <span class="ai-agent-pick-badge loss">AVOID</span>
              </div>
              <div class="ai-agent-pick-right">
                <span class="ai-agent-pick-stat loss">${worst.wr}% WR</span>
                <span class="ai-agent-pick-stat kd">${worst.kd} K/D</span>
                <span class="ai-agent-pick-count">(${worst.m}g)</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>`;
    }
    html += `</div>`;

    // ⚔️ DUEL ANALYSIS (Explicitly requested by user)
    html += chapter('⚔️', 'Combat & Duel Analysis', 'duels');
    const totalK = data.reduce((s, d) => s + d.k, 0);
    const totalD = data.reduce((s, d) => s + d.d, 0);
    const totalR = data.reduce((s, d) => s + d.totalRounds, 0);
    const avgKPR = totalR ? (totalK / totalR).toFixed(2) : '0';
    const avgDPR = totalR ? (totalD / totalR).toFixed(2) : '0';
    const duelWinPct = Math.round((totalK / Math.max(1, totalK + totalD)) * 100);
    const highKGames = data.filter(d => d.k >= 18).length;
    const highKWins = data.filter(d => d.k >= 18 && d.won).length;
    const highKWR = highKGames ? Math.round((highKWins / highKGames) * 100) : null;

    html += `<div class="deep-insight-grid cols4">`;
    html += deepCard('Duel Win %', duelWinPct + '%', `${totalK} kills vs ${totalD} deaths`, duelWinPct >= 55 ? 'good' : duelWinPct >= 45 ? 'warn' : 'bad', duelWinPct >= 55 ? 'accent-green' : '');
    html += deepCard('Avg KPR', avgKPR, 'Kills per round', parseFloat(avgKPR) >= 0.8 ? 'good' : parseFloat(avgKPR) >= 0.6 ? 'warn' : 'bad', '');
    html += deepCard('Avg DPR', avgDPR, 'Deaths per round', parseFloat(avgDPR) <= 0.7 ? 'good' : parseFloat(avgDPR) <= 0.85 ? 'warn' : 'bad', '');
    html += deepCard('High Kill Games', `${highKGames}/${n}`, `${highKWR !== null ? highKWR + '% WR when 18+ kills' : 'Frag carry rate'}`, highKGames / n >= 0.3 ? 'good' : 'warn', '');
    html += `</div>`;

    // Chapter 2 — Agent-Map Synergy Matrix
    html += chapter('🎭', 'Agent-Map Synergy Matrix', 'agent');
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
      html += `<div style="color:var(--win);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">No significant mismatches found — solid role picks across maps!</div>`;
    } else {
      for (const e of mismatches.slice(0, 5)) {
        const icon = getAgentIconUrl(e.agent);
        html += `<div class="deep-mismatch-row">
          <div class="deep-mismatch-left">
            ${icon ? `<img src="${icon}" alt="${e.agent}" class="deep-mismatch-icon" />` : ''}
            <div class="deep-mismatch-agent-info">
              <span class="deep-mismatch-agent">${e.agent}</span>
              <span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span>
            </div>
          </div>
          <div class="deep-mismatch-right">
            <span class="deep-mismatch-stat bad">${e.wr}% WR</span>
            <span class="deep-mismatch-stat">${e.kd} K/D</span>
            <span class="deep-mismatch-tag bad">${e.m} ${e.m === 1 ? 'game' : 'games'}</span>
          </div>
        </div>`;
      }
    }
    html += `</div>`;

    html += `<div class="deep-card span3"><div class="deep-card-label">Strong Combinations (≥2 games, ≥65% WR)</div>`;
    if (!goodFits.length) {
      html += `<div style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px;padding:8px 0;">Keep playing consistent agents on your main maps to generate strong fit data.</div>`;
    } else {
      for (const e of goodFits.slice(0, 4)) {
        const icon = getAgentIconUrl(e.agent);
        html += `<div class="deep-mismatch-row">
          <div class="deep-mismatch-left">
            ${icon ? `<img src="${icon}" alt="${e.agent}" class="deep-mismatch-icon" />` : ''}
            <div class="deep-mismatch-agent-info">
              <span class="deep-mismatch-agent">${e.agent}</span>
              <span class="deep-mismatch-on">on ${e.map.toUpperCase()}</span>
            </div>
          </div>
          <div class="deep-mismatch-right">
            <span class="deep-mismatch-stat good">${e.wr}% WR</span>
            <span class="deep-mismatch-stat">${e.kd} K/D</span>
            <span class="deep-mismatch-tag ok">${e.m} ${e.m === 1 ? 'game' : 'games'}</span>
          </div>
        </div>`;
      }
    }
    html += `</div>`;

    // Chapter 3 — Time of Day Performance Heatmap (From PerfLab)
    html += chapter('🕐', 'Time of Day Performance', 'time');
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

    const periods = [
      { name: 'Late Night', icon: '🌌', hours: [0,1,2,3,4,5] },
      { name: 'Morning', icon: '🌅', hours: [6,7,8,9,10,11] },
      { name: 'Afternoon', icon: '☀️', hours: [12,13,14,15,16,17] },
      { name: 'Evening', icon: '🌙', hours: [18,19,20,21,22,23] }
    ].map(p => {
      const m = p.hours.reduce((s, h) => s + hourBuckets[h].m, 0);
      const w = p.hours.reduce((s, h) => s + hourBuckets[h].w, 0);
      const wr = m ? Math.round((w / m) * 100) : null;
      return { ...p, m, w, wr };
    });

    if (playedHours.length >= 2) {
      html += `<div class="deep-card span3">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div class="deep-card-label" style="margin:0;">Games & Win Rate by Hour</div>
          <div class="plab-heat-legend">
            <span class="plab-legend-item"><span class="plab-legend-dot bad"></span> &lt;45% WR</span>
            <span class="plab-legend-item"><span class="plab-legend-dot warn"></span> 45-55%</span>
            <span class="plab-legend-item"><span class="plab-legend-dot good"></span> &ge;55% WR</span>
          </div>
        </div>

        <div class="plab-period-grid">`;
      periods.forEach(p => {
        const wrStr = p.wr !== null ? `${p.wr}% WR` : 'No games';
        const wrCls = p.wr === null ? 'muted' : p.wr >= 55 ? 'good' : p.wr >= 45 ? 'warn' : 'bad';
        html += `<div class="plab-period-card ${wrCls}">
          <div class="plab-period-head"><span class="plab-period-icon">${p.icon}</span><span class="plab-period-name">${p.name}</span></div>
          <div class="plab-period-val ${wrCls}">${wrStr}</div>
          <div class="plab-period-sub">${p.m} ${p.m === 1 ? 'match' : 'matches'}</div>
        </div>`;
      });
      html += `</div>

        <div class="plab-heatmap-scroll">
          <div class="plab-heatmap">`;
      hourBuckets.forEach((b, h) => {
        const wr = b.m ? b.w/b.m : 0;
        const intensity = b.m / maxGames;
        const col = b.m === 0 ? 'rgba(255,255,255,0.03)' : wr >= 0.55 ? `rgba(62,207,142,${0.25 + intensity*0.75})` : wr >= 0.45 ? `rgba(245,166,35,${0.2 + intensity*0.6})` : `rgba(255,87,87,${0.25 + intensity*0.75})`;
        const borderCol = b.m === 0 ? 'rgba(255,255,255,0.05)' : wr >= 0.55 ? 'rgba(62,207,142,0.4)' : wr >= 0.45 ? 'rgba(245,166,35,0.4)' : 'rgba(255,87,87,0.4)';
        const tt = b.m ? `${h}:00 — ${b.m} matches, ${Math.round(wr*100)}% WR` : `${h}:00 — no matches`;
        html += `<div class="plab-heat-cell" style="background:${col};border:1px solid ${borderCol}" title="${tt}">
          <span class="plab-heat-hour">${h}</span>
        </div>`;
      });
      html += `</div>
          <div class="plab-heat-axis">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>`;

      html += `<div class="deep-insight-grid cols2">`;
      if (bestHour.h >= 0) html += deepCard('Best Hour to Play', `${bestHour.h}:00`, `${Math.round(bestHour.wr*100)}% WR · ${bestHour.m} matches`, 'good', 'accent-green');
      if (worstHour.h >= 0 && worstHour.h !== bestHour.h) html += deepCard('Worst Hour to Avoid', `${worstHour.h}:00`, `${Math.round(worstHour.wr*100)}% WR · ${worstHour.m} matches`, 'bad', 'accent-red');
      html += `</div>`;
    }

    // Chapter 4 — Economy Intelligence (From PerfLab)
    html += chapter('💰', 'Economy Intelligence & ACS Breakdown', 'economy');
    const avgACS = data.reduce((s,d)=>s+d.acs,0)/n;
    const fullBuyMatches = data.filter(d => d.acs >= avgACS * 0.95);
    const ecoBuyMatches = data.filter(d => d.acs < avgACS * 0.75);
    const forceBuyMatches = data.filter(d => d.acs >= avgACS * 0.75 && d.acs < avgACS * 0.95);
    const fWR = fullBuyMatches.length ? Math.round(fullBuyMatches.filter(d=>d.won).length/fullBuyMatches.length*100) : 0;
    const eWR = ecoBuyMatches.length ? Math.round(ecoBuyMatches.filter(d=>d.won).length/ecoBuyMatches.length*100) : 0;
    const foWR = forceBuyMatches.length ? Math.round(forceBuyMatches.filter(d=>d.won).length/forceBuyMatches.length*100) : 0;

    html += `<div class="deep-card span3"><div class="deep-card-label">Win Rate by Economy Type (Estimated from ACS telemetry)</div>
    <div class="deep-table-wrap"><table class="plab-eco-table"><thead><tr><th>Type</th><th>Games</th><th>Win Rate</th><th>Avg ACS</th><th>Assessment</th></tr></thead><tbody>
    <tr><td><span class="plab-eco-type" style="color:var(--win)">Full Buy</span></td><td>${fullBuyMatches.length}</td><td style="color:${fWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${fWR}%</td><td>${Math.round(fullBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(fullBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${fWR>=55?'Strong ✓':fWR>=45?'Average':'Underperforming ⚠️'}</td></tr>
    <tr><td><span class="plab-eco-type" style="color:#f5a623">Force Buy</span></td><td>${forceBuyMatches.length}</td><td style="color:${foWR>=50?'var(--win)':'var(--loss)'};font-weight:800">${foWR}%</td><td>${Math.round(forceBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(forceBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${foWR>=45?'Holding well':foWR>=35?'Average':'Struggling'}</td></tr>
    <tr><td><span class="plab-eco-type" style="color:var(--loss)">Eco</span></td><td>${ecoBuyMatches.length}</td><td style="color:${eWR>=40?'var(--win)':'var(--loss)'};font-weight:800">${eWR}%</td><td>${Math.round(ecoBuyMatches.reduce((s,d)=>s+d.acs,0)/Math.max(ecoBuyMatches.length,1))}</td><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${eWR>=35?'Good eco steals':eWR>=25?'Expected':'Very low'}</td></tr>
    </tbody></table></div></div>`;

    // 📋 PERSONALISED ACTION PLAN (Explicitly requested by user)
    html += chapter('📋', 'Personalised Action Plan', 'plan');
    const currentTier = getRankTier(rankName);
    const currentBench = RANK_BENCHMARKS[currentTier] || RANK_BENCHMARKS['Silver'];
    const myHS = Math.round(data.reduce((s, d) => s + d.hsPct, 0) / n);
    const myWR = Math.round(data.filter(d => d.won).length / n * 100);
    const actions = [];

    if (duelWinPct < 50) actions.push({ priority: 'HIGH', title: 'Fix Crosshair Placement', desc: `Your ${duelWinPct}% duel win rate means you're losing more gunfights than you win. Spend 15 min daily in Aimlab "Microshot Precision", focus on pre-aiming head level at every corner.` });
    if (myHS < (currentBench.hs - 2)) actions.push({ priority: 'HIGH', title: 'Improve Headshot Rate', desc: `You're at ${myHS}% HS rate vs ${currentBench.hs}% average for your rank. Stop burst-firing — one tap, check if enemy is dead, then tap again.` });
    if (myWR < currentBench.wr) actions.push({ priority: 'MED', title: 'Round Economy Awareness', desc: `At ${myWR}% WR vs ${currentBench.wr}% for your rank, you're losing rounds you should win. After every loss, check: did you save when you should have?` });
    if (bestHour.h >= 0 && worstHour.h >= 0 && bestHour.h !== worstHour.h) actions.push({ priority: 'MED', title: `Play at ${bestHour.h}:00, Avoid ${worstHour.h}:00`, desc: `Your data shows a ${Math.round(Math.abs(bestHour.wr - worstHour.wr) * 100)}% WR swing between your best and worst hours.` });
    actions.push({ priority: 'LOW', title: 'VoD Review — Deaths Only', desc: `Record every session with OBS. Watch only the rounds you died in. Ask: was I peeking without info? Did I have angle disadvantage?` });

    html += `<div class="deep-card span3"><div style="display:flex;flex-direction:column;gap:12px;">`;
    const pColors = { HIGH: 'var(--loss)', MED: '#f5a623', LOW: 'var(--accent)' };
    actions.forEach((a, i) => {
      html += `<div style="display:flex;align-items:flex-start;gap:14px;padding:${i > 0 ? '12px 0 0' : 0};${i > 0 ? 'border-top:1px solid rgba(255,255,255,0.06);margin-top:4px' : ''}">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:${pColors[a.priority]};border:1px solid ${pColors[a.priority]}33;flex-shrink:0;margin-top:2px">${a.priority}</div>
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:0.5px;color:#ffffff;">${a.title}</div>
          <div style="font-family:'Barlow',sans-serif;font-size:12px;color:rgba(240,240,242,0.7);margin-top:3px;line-height:1.5">${a.desc}</div>
        </div>
      </div>`;
    });
    html += `</div></div>`;

    // Chapter 5 — Rank Benchmark & Gap Analysis (From PerfLab)
    html += chapter('🏆', 'Rank Benchmark & Gap Analysis', 'rankgap');
    const nextTier = getNextRank(currentTier);
    const nextBench = nextTier ? RANK_BENCHMARKS[nextTier] : null;
    const myKD = parseFloat((data.reduce((s, d) => s + d.kd, 0) / n).toFixed(2));
    const myACS = Math.round(data.reduce((s, d) => s + d.acs, 0) / n);

    html += `<div class="deep-insight-grid cols2">`;
    html += `<div class="deep-card"><div class="deep-card-label">You vs ${currentTier} Average</div><div class="plab-rankgap">
    ${rankGapRow('K/D', myKD, currentBench.kd, nextBench?.kd, myKD >= currentBench.kd)}
    ${rankGapRow('Win Rate', myWR+'%', currentBench.wr+'%', nextBench?.wr+'%', myWR >= currentBench.wr)}
    ${rankGapRow('ACS', myACS, currentBench.acs, nextBench?.acs, myACS >= currentBench.acs)}
    ${rankGapRow('HS%', myHS+'%', currentBench.hs+'%', nextBench?.hs+'%', myHS >= currentBench.hs)}
    </div></div>`;
    if (nextBench) {
      html += `<div class="deep-card"><div class="deep-card-label">Target Stats for ${nextTier}</div><div class="plab-rankgap">
      ${nextGapRow('K/D', myKD, nextBench.kd, myKD >= nextBench.kd)}
      ${nextGapRow('Win Rate', myWR, nextBench.wr, myWR >= nextBench.wr)}
      ${nextGapRow('ACS', myACS, nextBench.acs, myACS >= nextBench.acs)}
      ${nextGapRow('HS%', myHS, nextBench.hs, myHS >= nextBench.hs)}
      </div></div>`;
    }
    html += `</div>`;

    // Chapter 6 — Death Pattern Telemetry
    html += chapter('💀', 'Death Pattern Diagnostics', 'death');
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

    // Chapter 7 — Improvement Over Time Trends
    html += chapter('📈', 'Improvement Over Time Trends', 'trend');
    const third = Math.floor(n / 3) || 1;
    const early = data.slice(n - third, n);
    const recent = data.slice(0, third);
    const avg = (arr, fn) => arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0;
    const trendEarlyKD = avg(early, d => d.d ? (d.k / d.d) : d.k);
    const trendRecentKD = avg(recent, d => d.d ? (d.k / d.d) : d.k);
    const trendEarlyWR = avg(early, d => d.won ? 1 : 0) * 100;
    const trendRecentWR = avg(recent, d => d.won ? 1 : 0) * 100;
    const trendEarlyACS = avg(early, d => d.acs);
    const trendRecentACS = avg(recent, d => d.acs);
    const trendEarlyHS = avg(early, d => d.hsPct);
    const trendRecentHS = avg(recent, d => d.hsPct);
    const delta = (r, e) => { const d = r - e; return d > 0 ? `▲ +${d.toFixed(1)}` : `▼ ${d.toFixed(1)}`; };
    const dCls = (r, e) => r > e ? 'good' : r < e ? 'bad' : 'warn';

    html += `<div class="deep-insight-grid cols4">`;
    html += trendCard('K/D Trend', trendEarlyKD.toFixed(2), trendRecentKD.toFixed(2), delta(trendRecentKD, trendEarlyKD), dCls(trendRecentKD, trendEarlyKD));
    html += trendCard('Win Rate Trend', Math.round(trendEarlyWR) + '%', Math.round(trendRecentWR) + '%', delta(trendRecentWR, trendEarlyWR), dCls(trendRecentWR, trendEarlyWR));
    html += trendCard('ACS Trend', Math.round(trendEarlyACS), Math.round(trendRecentACS), delta(trendRecentACS, trendEarlyACS), dCls(trendRecentACS, trendEarlyACS));
    html += trendCard('HS% Trend', Math.round(trendEarlyHS) + '%', Math.round(trendRecentHS) + '%', delta(trendRecentHS, trendEarlyHS), dCls(trendRecentHS, trendEarlyHS));
    html += `</div>`;

    return html;
  }
</script>

<div class="deep-wrap" bind:this={cardEl}>
  <!-- UNIFIED TOP HEADER CARD WITH INTERACTIVE SUB-NAV -->
  <div class="deep-clarification-banner">
    <div class="deep-clar-top-row">
      <div class="deep-clar-left">
        <div class="deep-clar-icon">🔬</div>
        <div>
          <div class="deep-clar-title">Deep Telemetry Lab</div>
          <div class="deep-clar-desc">
            Comprehensive performance analytics hub. Integrates <span class="deep-kw">Combat duels</span>, <span class="deep-kw">Map side win rates</span>, <span class="deep-kw">Agent synergy</span>, <span class="deep-kw">Time-of-day heatmaps</span>, <span class="deep-kw">Economy intelligence</span>, and <span class="deep-kw">Personalised action plans</span> into a single telemetry dashboard.
          </div>
        </div>
      </div>
      <button class="deep-run-btn" on:click={runDeepAnalysis} disabled={loading}>
        {loading ? 'Analysing...' : '⚡ Re-Run Telemetry Scan'}
      </button>
    </div>

    <!-- INNER SUB-NAV TABS WITH ACTIVE HIGH-LIGHT STATES -->
    <div class="deep-subnav-container">
      {#each SUBNAV_ITEMS as item}
        <button 
          class="deep-subnav-btn" 
          class:active={activeChapter === item.id}
          on:click={() => scrollToChapter(item.id)}
        >
          <span class="subnav-icon">{item.icon}</span>
          <span class="subnav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="deep-loading">
      <div class="deep-spinner">
        <div class="deep-spinner-core"></div>
      </div>
      <div class="deep-loading-bar"></div>
      <div class="deep-loading-txt">{loadingText}</div>
      <div class="deep-loading-dots"><span></span><span></span><span></span></div>
    </div>
  {/if}

  <div class="deep-results active" bind:this={deepBodyEl} style:display={loading ? 'none' : 'block'}>
    {#if resultHtml}
      {@html resultHtml}
    {/if}
  </div>
</div>

<script>
  import { tick } from 'svelte';
  import { buildStatsForAI, analyseStats } from '../../lib/ai-engine';
  import { animateAllNumbersInContainer } from '../../lib/aiStreamer';
  import { getRankImgUrl, getRankColor, MAP_IMAGES_FALLBACK } from '../../lib/constants';
  import { getAgentIconUrl, getAgentPortraitUrl } from '../../lib/assets';

  export let mode = 'summary'; // 'summary' | 'action'
  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let rankName = 'Silver 2';
  export let mmrHistory = {};
  export let onShareProfile = () => {};

  let loading = false;
  let error = '';
  let result = null;
  let aiStats = null;
  let coachResultsEl = null;

  // Interactive Warmup State
  let warmupDone = { 1: false, 2: false, 3: false, 4: false };

  $: completedWarmupCount = Object.values(warmupDone).filter(Boolean).length;
  $: warmupProgressPct = Math.round((completedWarmupCount / 4) * 100);

  function toggleWarmup(id) {
    warmupDone[id] = !warmupDone[id];
  }

  let loadingText = 'CRUNCHING TELEMETRY MATRIX...';

  $: if (matches && matches.length && !result && !loading) {
    runAnalysis();
  }

  async function runAnalysis() {
    if (!matches || !matches.length) {
      error = 'No match data found — fetch your stats first then hit Analyse.';
      return;
    }

    loading = true;
    error = '';
    result = null;

    const msgs = [
      'CRUNCHING MATCH TELEMETRY...',
      'ANALYSING COMBAT PATTERNS...',
      'EVALUATING RANK READINESS...',
      'DETECTING TILT INDICATORS...',
      'BUILDING PRACTICE BLUEPRINT...'
    ];
    let mi = 0;
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; loadingText = msgs[mi]; }, 400);

    await new Promise(r => setTimeout(r, 1200));

    try {
      aiStats = buildStatsForAI(matches, playerName, playerTag);
      result = analyseStats(aiStats, rankName);
      clearInterval(iv);
      loading = false;
      await tick();
      if (coachResultsEl) {
        animateAllNumbersInContainer(coachResultsEl);
      }
    } catch (e) {
      error = 'Analysis failed: ' + e.message;
      clearInterval(iv);
      loading = false;
    }
  }

  function kdClass(kd) { return parseFloat(kd) >= 1.2 ? 'good' : parseFloat(kd) >= 0.9 ? 'warn' : 'bad'; }
  function wrClass(wr) { return wr >= 55 ? 'good' : wr >= 45 ? 'warn' : 'bad'; }
  function hsClass(hs) { return hs >= 25 ? 'good' : hs >= 15 ? 'warn' : 'bad'; }
  function acsClass(acs) { return acs >= 220 ? 'good' : acs >= 170 ? 'warn' : 'bad'; }

  function isToday(ts) {
    if (!ts) return false;
    const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  $: rankImg = getRankImgUrl(rankName);
  $: rankColor = getRankColor(rankName);

  $: sessionMatches = (matches || []).filter(m => {
    const gameStart = m.metadata?.game_start || m.metadata?.gameStart || null;
    return isToday(gameStart);
  });

  $: sessionLosses = sessionMatches.filter(m => {
    const me = (m.players?.all_players || m.players || []).find(p => (p.name||'').toLowerCase() === (playerName||'').toLowerCase());
    if (!me) return false;
    const myTeamId = (me.team || '').toLowerCase();
    const won = m.teams?.[myTeamId]?.has_won || false;
    return !won;
  }).length;

  $: currentStreak = (() => {
    if (!matches || !matches.length) return { count: 0, type: 'win' };
    let count = 0;
    let type = null;
    for (const m of matches) {
      const me = (m.players?.all_players || m.players || []).find(p => (p.name||'').toLowerCase() === (playerName||'').toLowerCase());
      if (!me) continue;
      const myTeamId = (me.team || '').toLowerCase();
      const won = m.teams?.[myTeamId]?.has_won || false;
      if (type === null) {
        type = won ? 'win' : 'loss';
        count = 1;
      } else if ((won && type === 'win') || (!won && type === 'loss')) {
        count++;
      } else {
        break;
      }
    }
    return { count, type: type || 'win' };
  })();

  $: tiltLevel = currentStreak.type === 'loss' && currentStreak.count >= 3 ? 'high'
    : sessionLosses >= 3 ? 'medium' : null;

  $: topAgentName = aiStats?.topAgent || 'Jett';
  $: topAgentIcon = getAgentIconUrl(topAgentName);

  $: aimlabScenarios = (() => {
    const scenarios = [];
    if (!aiStats) return scenarios;
    if (aiStats.hsPct < 22) {
      scenarios.push({ name: 'Microshot Precision', focus: 'Headshot & First-Bullet Accuracy', duration: '5 min', tag: 'Aim Mechanics', icon: '🎯' });
      scenarios.push({ name: 'Sixshot Ultimate', focus: 'Small Target Head-Level Clicks', duration: '5 min', tag: 'Crosshair Precision', icon: '⚡' });
    }
    if (aiStats.kd < 1.0) {
      scenarios.push({ name: 'SphereTrack & Motiontrack', focus: 'Tracking Peeking Enemies', duration: '5 min', tag: 'Duel Stabilization', icon: '👁️' });
    }
    if (aiStats.avgACS < 180) {
      scenarios.push({ name: 'Spidershot Speed', focus: 'Fast Target Acquisition', duration: '5 min', tag: 'Reaction Time', icon: '💥' });
    }
    if (scenarios.length === 0) {
      scenarios.push({ name: 'StrafeTrack Ultimate', focus: 'Counter-strafing Aim Locks', duration: '5 min', tag: 'Radiant Drill', icon: '👑' });
    }
    return scenarios;
  })();
</script>

<div class="ai-card">
  <div class="ai-card-header">
    <div class="ai-header-left">
      <div class="ai-icon">{mode === 'summary' ? '🤖' : '🎯'}</div>
      <div>
        <div class="ai-title">{mode === 'summary' ? 'AI Executive Diagnostic' : 'Hyper-Personalized Practice Hub'}</div>
        <div class="ai-subtitle">
          {mode === 'summary' ? 'Telemetry analysis, rank readiness & interactive warmup' : 'Custom AimLab drills, warm-up routine & tactical levers'}
        </div>
      </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      {#if mode === 'summary'}
        <button class="ai-share-btn" on:click={onShareProfile} title="Share your summary card">
          <span class="btn-icon">🎴</span> Share Summary Card
        </button>
      {/if}
      <button class="ai-analyse-btn" on:click={runAnalysis} disabled={loading}>
        <span class="btn-icon">⚡</span> {loading ? 'Analysing...' : 'Re-Run Scan'}
      </button>
    </div>
  </div>

  <div class="ai-body">
    {#if loading}
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <div class="ai-loading-txt">{loadingText}</div>
      </div>
    {:else if error}
      <div class="ai-error active">{error}</div>
    {:else if !result || !aiStats}
      <div class="ai-placeholder">
        <div class="ai-placeholder-icon">📊</div>
        <div class="ai-placeholder-txt">Fetch your stats first to generate your AI Diagnostic Summary.</div>
      </div>
    {:else}
      <div class="ai-results active" bind:this={coachResultsEl}>
        {#if mode === 'summary'}
          <!-- EXECUTIVE SUMMARY MODE -->
          
          <!-- Tactical Headline Banner -->
          <div class="ai-summary-banner">{@html result.summary}</div>

          <!-- Tilt & Recovery Detector Alert -->
          {#if tiltLevel}
            <div class="ai-tilt-alert {tiltLevel}">
              <div class="ai-tilt-icon">{tiltLevel === 'high' ? '🚨' : '⚠️'}</div>
              <div style="flex:1;">
                <div class="ai-tilt-title">{tiltLevel === 'high' ? 'TILT WARNING: STOP PLAYING' : 'SESSION FATIGUE DETECTED'}</div>
                <div class="ai-tilt-desc">
                  {tiltLevel === 'high' 
                    ? `You are on a ${currentStreak.count}-game loss streak. Statistically, queuing immediately after 3 losses lowers win rate by 34%. Take a 30-min break.`
                    : `You have ${sessionLosses} losses in today's session. Fatigue affects reaction time and decision-making.`
                  }
                </div>
              </div>
            </div>
          {/if}

          <!-- Rank Readiness & Official Rank Emblem Badge -->
          {@const rs = aiStats.readinessScore}
          {@const circumference = 2 * Math.PI * 28}
          {@const dashOffset = circumference * (1 - rs / 100)}
          {@const rsColor = rs >= 70 ? 'var(--win)' : rs >= 45 ? '#f5a623' : 'var(--loss)'}
          <div class="ai-readiness-wrapper">
            <div class="ai-readiness-ring">
              <div style="position:relative; width:72px; height:72px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
                  <circle cx="36" cy="36" r="28" fill="none" stroke={rsColor} stroke-width="6"
                    stroke-dasharray={circumference.toFixed(1)} stroke-dashoffset={dashOffset.toFixed(1)}
                    stroke-linecap="round" transform="rotate(-90 36 36)" style="transition:stroke-dashoffset 0.8s cubic-bezier(0.25,0.8,0.25,1);"/>
                  <text x="36" y="41" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="900" font-size="16" fill={rsColor}>{rs}</text>
                </svg>
              </div>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:10px;">
                  {#if rankImg}
                    <img src={rankImg} alt={rankName} style="width:28px; height:28px; object-fit:contain; filter:drop-shadow(0 0 8px {rankColor});" />
                  {/if}
                  <div class="ai-readiness-title" style="color:{rankColor}">{rankName} Rank Readiness</div>
                </div>
                <div class="ai-readiness-desc">{rs >= 70 ? 'Performing above rank level — push for promotion.' : rs >= 45 ? 'Core stats are solid — fix 1-2 specific weaknesses to climb.' : 'Key fundamentals need work before consistent rank progression.'}</div>
                <div class="ai-readiness-badge" style="color:{rsColor}; border-color:{rsColor}44; background:{rsColor}11">{rs >= 70 ? 'RANK UP READY' : rs >= 45 ? 'ON TRACK' : 'NEEDS WORK'}</div>
              </div>
            </div>

            <!-- Today's Session Snapshot Card with Top Agent Art -->
            <div class="ai-session-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="ai-session-header">TODAY'S SESSION SNAPSHOT</div>
                {#if topAgentIcon}
                  <img src={topAgentIcon} alt={topAgentName} style="width:32px; height:32px; border-radius:50%; border:1px solid rgba(250,68,84,0.4); background:rgba(0,0,0,0.4);" title="Top Agent: {topAgentName}" />
                {/if}
              </div>
              <div class="ai-session-grid">
                <div>
                  <div class="ai-session-val">{sessionMatches.length}</div>
                  <div class="ai-session-lbl">Matches Today</div>
                </div>
                <div>
                  <div class="ai-session-val" style="color:{currentStreak.type === 'win' ? 'var(--win)' : 'var(--loss)'}">
                    {currentStreak.count}{currentStreak.type === 'win' ? 'W Streak' : 'L Streak'}
                  </div>
                  <div class="ai-session-lbl">Current Form</div>
                </div>
              </div>
            </div>
          </div>

          <!-- KEY STRENGTHS & AREAS TO IMPROVE -->
          <div class="ai-readiness-wrapper" style="margin-top:20px;">
            <!-- 💪 Key Strengths -->
            <div class="ai-bento-card">
              <div class="ai-bento-header">
                <span class="ai-bento-icon">💪</span>
                <div class="ai-bento-title" style="color:var(--win)">Key Strengths</div>
              </div>
              <div class="ai-tip-list">
                {#if result.strengths && result.strengths.length}
                  {#each result.strengths as st}
                    <div class="ai-tip-item">
                      <div class="ai-tip-bullet green"></div>
                      <div style="font-size:12px; line-height:1.45;">{st}</div>
                    </div>
                  {/each}
                {:else}
                  <div class="ai-tip-item"><div class="ai-tip-bullet green"></div><div>Solid overall gameplay performance across your recent matches.</div></div>
                {/if}
              </div>
            </div>

            <!-- ⚠️ Areas to Improve -->
            <div class="ai-bento-card">
              <div class="ai-bento-header">
                <span class="ai-bento-icon">⚠️</span>
                <div class="ai-bento-title" style="color:#f5a623">Areas to Improve</div>
              </div>
              <div class="ai-tip-list">
                {#if result.weaknesses && result.weaknesses.length}
                  {#each result.weaknesses as wk}
                    <div class="ai-tip-item">
                      <div class="ai-tip-bullet yellow"></div>
                      <div style="font-size:12px; line-height:1.45;">{wk}</div>
                    </div>
                  {/each}
                {:else}
                  <div class="ai-tip-item"><div class="ai-tip-bullet yellow"></div><div>Keep maintaining your crosshair placement and utility usage.</div></div>
                {/if}
              </div>
            </div>
          </div>

          <!-- INTERACTIVE PRE-GAME WARM-UP ROUTINE -->
          <div class="ai-warmup-container">
            <div class="ai-warmup-header">
              <div class="ai-warmup-title-group">
                <span class="ai-warmup-icon">🎮</span>
                <div>
                  <div class="ai-warmup-title">Interactive Pre-Game Warm-Up Routine</div>
                  <div class="ai-warmup-sub">Complete this 15-minute checklist before queuing your first ranked match today</div>
                </div>
              </div>
              <div class="ai-warmup-progress-badge">
                {completedWarmupCount} / 4 DONE ({warmupProgressPct}%)
              </div>
            </div>

            <div class="ai-warmup-bar-track">
              <div class="ai-warmup-bar-fill" style="width: {warmupProgressPct}%;"></div>
            </div>

            <div class="ai-warmup-grid">
              <!-- Task 1 -->
              <button 
                class="ai-warmup-item" 
                class:done={warmupDone[1]} 
                on:click={() => toggleWarmup(1)}
              >
                <div class="ai-warmup-checkbox">{warmupDone[1] ? '✓' : ''}</div>
                <div>
                  <div class="ai-warmup-item-title">1. Range Bot Precision (5 min)</div>
                  <div class="ai-warmup-item-desc">
                    {aiStats.hsPct < 24 ? '100 Bots (Guardian/Ghost only). Focus purely on head height adjustments.' : '50 Bots on Medium speed. Counter-strafe before taking each shot.'}
                  </div>
                </div>
              </button>

              <!-- Task 2 -->
              <button 
                class="ai-warmup-item" 
                class:done={warmupDone[2]} 
                on:click={() => toggleWarmup(2)}
              >
                <div class="ai-warmup-checkbox">{warmupDone[2] ? '✓' : ''}</div>
                <div>
                  <div class="ai-warmup-item-title">2. Sheriff-Only Deathmatch (5 min)</div>
                  <div class="ai-warmup-item-desc">
                    {aiStats.kd < 1.1 ? 'Play 1 DM round using Sheriff only. Zero spray firing. Track heads through corners.' : 'Play 1 DM round with Vandal burst taps (max 2 bullets per burst).'}
                  </div>
                </div>
              </button>

              <!-- Task 3 -->
              <button 
                class="ai-warmup-item" 
                class:done={warmupDone[3]} 
                on:click={() => toggleWarmup(3)}
              >
                <div class="ai-warmup-checkbox">{warmupDone[3] ? '✓' : ''}</div>
                <div>
                  <div class="ai-warmup-item-title">3. Angle Isolation Drill (3 min)</div>
                  <div class="ai-warmup-item-desc">
                    Load Range or Custom Map. Practice pre-aiming common site entrance angles without dry peeking.
                  </div>
                </div>
              </button>

              <!-- Task 4 -->
              <button 
                class="ai-warmup-item" 
                class:done={warmupDone[4]} 
                on:click={() => toggleWarmup(4)}
              >
                <div class="ai-warmup-checkbox">{warmupDone[4] ? '✓' : ''}</div>
                <div>
                  <div class="ai-warmup-item-title">4. Wrist & Posture Reset (2 min)</div>
                  <div class="ai-warmup-item-desc">
                    Stretch wrists, hydrate, check posture, and clear headspace before queuing.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- 9-Stat Telemetry Grid -->
          <div class="ai-grid">
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Ratio</div><div class="ai-stat-pill-val {kdClass(aiStats.kd)}">{aiStats.kd}</div><div class="ai-stat-pill-sub">{aiStats.avgKills}K / {aiStats.avgDeaths}D avg</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Win Rate</div><div class="ai-stat-pill-val {wrClass(aiStats.wr)}">{aiStats.wr}%</div><div class="ai-stat-pill-sub">Last 5: {aiStats.recentWR5}%</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg ACS</div><div class="ai-stat-pill-val {acsClass(aiStats.avgACS)}">{aiStats.avgACS}</div><div class="ai-stat-pill-sub">Combat score avg</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">HS Rate</div><div class="ai-stat-pill-val {hsClass(aiStats.hsPct)}">{aiStats.hsPct}%</div><div class="ai-stat-pill-sub">Headshot %</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Clutch Rate</div><div class="ai-stat-pill-val">{((aiStats.clutchWins / Math.max(1, aiStats.totalMatches)) * 100).toFixed(1)}%</div><div class="ai-stat-pill-sub">{aiStats.clutchWins} clutch wins</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Trend</div><div class="ai-stat-pill-val" style="font-size:13px;color:{aiStats.trendDir === 'improving' ? 'var(--win)' : aiStats.trendDir === 'declining' ? 'var(--loss)' : 'var(--muted)'}">{aiStats.trendDir === 'improving' ? '📈 +' : aiStats.trendDir === 'declining' ? '📉 ' : '➡️ '}{aiStats.trendDelta}</div><div class="ai-stat-pill-sub">Last 5 vs prev 5</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Consistency</div><div class="ai-stat-pill-val" style="color:{aiStats.consistencyScore >= 75 ? 'var(--win)' : aiStats.consistencyScore >= 50 ? '#f5a623' : 'var(--loss)'}">{aiStats.consistencyScore}</div><div class="ai-stat-pill-sub">0-100 · higher = steadier</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Carry Rate</div><div class="ai-stat-pill-val {aiStats.carryPct >= 40 ? 'good' : aiStats.carryPct >= 20 ? 'warn' : 'bad'}">{aiStats.carryPct}%</div><div class="ai-stat-pill-sub">Top-fragged team</div></div>
            {#if aiStats.attWR != null}
              <div class="ai-stat-pill"><div class="ai-stat-pill-label">Atk/Def WR</div><div class="ai-stat-pill-val" style="font-size:13px">{aiStats.attWR}% / {aiStats.defWR}%</div><div class="ai-stat-pill-sub">Attack · Defense</div></div>
            {/if}
          </div>

        {:else if mode === 'action'}
          <!-- 3-STEP ACTION PLAN & AIMLAB WIDGET MODE -->

          {#if result.topFocus}
            <div class="ai-focus-block">
              <div class="ai-tip-header">
                <span class="ai-tip-emoji">🎯</span>
                <span class="ai-tip-title" style="color:var(--accent);font-size:14px;letter-spacing:1px;">ABSOLUTE #1 LEVER TO RANK UP</span>
              </div>
              <div class="ai-focus-title">{result.topFocus.title}</div>
              <div class="ai-focus-desc">{result.topFocus.desc}</div>
              <div class="ai-focus-footer">Focus on this single priority before queuing your next match</div>
            </div>
          {/if}

          <!-- AIMLAB & PRACTICE DRILL GENERATOR -->
          <div class="ai-aimlab-wrapper">
            <div class="ai-aimlab-header">
              <div class="ai-aimlab-title-group">
                <span class="ai-aimlab-icon">🎯</span>
                <div>
                  <div class="ai-aimlab-title">Personalized AimLab & Practice Scenarios</div>
                  <div class="ai-aimlab-sub">Recommended drills generated based on your actual Headshot % ({aiStats.hsPct}%) & K/D ({aiStats.kd})</div>
                </div>
              </div>
            </div>

            <div class="ai-aimlab-grid">
              {#each aimlabScenarios as sc}
                <div class="ai-aimlab-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="ai-aimlab-card-badge">{sc.tag}</div>
                    <span style="font-size:16px;">{sc.icon}</span>
                  </div>
                  <div class="ai-aimlab-card-title">{sc.name}</div>
                  <div class="ai-aimlab-card-desc">{sc.focus}</div>
                  <div class="ai-aimlab-card-footer">
                    <span>⏱️ Duration: {sc.duration}</span>
                    <span style="color:var(--accent)">Recommended</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 3 High-Impact Bento Cards -->
          <div class="ai-action-bento-grid">
            <!-- Bento Card 1: Aim & Mechanics -->
            <div class="ai-bento-card">
              <div class="ai-bento-header">
                <span class="ai-bento-icon">🎯</span>
                <div class="ai-bento-title">Combat & Aim Mechanics</div>
              </div>
              <div class="ai-bento-metric-row">
                <div>
                  <div class="ai-bento-metric-val {hsClass(aiStats.hsPct)}">{aiStats.hsPct}%</div>
                  <div class="ai-bento-metric-lbl">Headshot Rate</div>
                </div>
                <div>
                  <div class="ai-bento-metric-val {kdClass(aiStats.kd)}">{aiStats.kd}</div>
                  <div class="ai-bento-metric-lbl">K/D Ratio</div>
                </div>
              </div>
              <div class="ai-bento-body">
                {aiStats.hsPct >= 22 
                  ? 'Aim mechanics are clean. Focus on crosshair placement when dry-peeking corners.' 
                  : 'Headshot rate is below competitive average. Warm up with 15 min Deathmatch before queuing ranked.'
                }
              </div>
            </div>

            <!-- Bento Card 2: Map Positioning & Agent Fit -->
            <div class="ai-bento-card">
              <div class="ai-bento-header">
                <span class="ai-bento-icon">🗺️</span>
                <div class="ai-bento-title">Positioning & Agent Fit</div>
              </div>
              <div class="ai-bento-metric-row">
                <div>
                  <div class="ai-bento-metric-val {acsClass(aiStats.avgACS)}">{aiStats.avgACS}</div>
                  <div class="ai-bento-metric-lbl">Avg ACS</div>
                </div>
                <div>
                  <div class="ai-bento-metric-val {wrClass(aiStats.wr)}">{aiStats.wr}%</div>
                  <div class="ai-bento-metric-lbl">Win Rate</div>
                </div>
              </div>
              <div class="ai-bento-body">
                {result.agentAdvice && result.agentAdvice[0] ? result.agentAdvice[0] : 'Avoid peeking the same angle twice on defense; play for trade kills with team.'}
              </div>
            </div>

            <!-- Bento Card 3: Utility & Economy Trading -->
            <div class="ai-bento-card">
              <div class="ai-bento-header">
                <span class="ai-bento-icon">💰</span>
                <div class="ai-bento-title">Utility & Economy Trading</div>
              </div>
              <div class="ai-bento-metric-row">
                <div>
                  <div class="ai-bento-metric-val">{aiStats.attWR || 50}%</div>
                  <div class="ai-bento-metric-lbl">Atk WR</div>
                </div>
                <div>
                  <div class="ai-bento-metric-val">{aiStats.defWR || 50}%</div>
                  <div class="ai-bento-metric-lbl">Def WR</div>
                </div>
              </div>
              <div class="ai-bento-body">
                {result.tips && result.tips[0] ? result.tips[0] : 'Prioritise full armor on gun rounds. Cast utility early to clear chokepoints.'}
              </div>
            </div>
          </div>

          <!-- Structured Action Tips List -->
          <div class="ai-sections-grid" style="margin-top:20px;">
            {#if result.tips && result.tips.length}
              <div class="ai-tip-block full">
                <div class="ai-tip-header"><span class="ai-tip-emoji">⚡</span><span class="ai-tip-title tips">Actionable Tactical Advice</span></div>
                <div class="ai-tip-list">
                  {#each result.tips as item}
                    <div class="ai-tip-item"><div class="ai-tip-bullet yellow"></div><div>{item}</div></div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if result.mental && result.mental.length}
              <div class="ai-tip-block full">
                <div class="ai-tip-header"><span class="ai-tip-emoji">🧠</span><span class="ai-tip-title mental">Mental Game & Pre-Queue Rules</span></div>
                <div class="ai-tip-list">
                  {#each result.mental as item}
                    <div class="ai-tip-item"><div class="ai-tip-bullet purple"></div><div>{item}</div></div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          {#if result.verdict}
            <div class="ai-verdict">
              <div class="ai-verdict-label">⚡ Coach's Final Verdict</div>
              <div>{@html result.verdict}</div>
            </div>
          {/if}

        {/if}
      </div>
    {/if}
  </div>
</div>

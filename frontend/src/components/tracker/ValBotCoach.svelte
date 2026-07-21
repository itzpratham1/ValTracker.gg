<script>
  import { tick } from 'svelte';
  import { buildStatsForAI, analyseStats } from '../../lib/ai-engine';
  import { animateAllNumbersInContainer } from '../../lib/aiStreamer';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let rankName = 'Silver 2';

  let loading = false;
  let error = '';
  let result = null;
  let aiStats = null;
  let coachResultsEl = null;

  async function runAnalysis() {
    if (!matches.length) {
      error = 'No match data found — fetch your stats first then hit Analyse.';
      return;
    }

    loading = true;
    error = '';
    result = null;

    const msgs = ['CRUNCHING MATCH DATA...', 'ANALYSING COMBAT PATTERNS...', 'IDENTIFYING WEAKNESSES...', 'BUILDING RECOMMENDATIONS...', 'FINALISING REPORT...'];
    let mi = 0;
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; }, 900);

    await new Promise(r => setTimeout(r, 1500));

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
</script>

<div class="ai-card">
  <div class="ai-card-header">
    <div class="ai-header-left">
      <div class="ai-icon">🤖</div>
      <div>
        <div class="ai-title">ValBot</div>
        <div class="ai-subtitle">Powered by ValTracker AI · Analyses your stored match data</div>
      </div>
    </div>
    <button class="ai-analyse-btn" on:click={runAnalysis} disabled={loading}>
      <span class="btn-icon">⚡</span> {loading ? 'Analysing...' : 'Analyse My Performance'}
    </button>
  </div>

  <div class="ai-clarification-banner">
    <div class="ai-clar-icon">🧬</div>
    <div>
      <div class="ai-clar-title">ValBot Macro Diagnostic System</div>
      <div class="ai-clar-desc">
        Fuses telemetry across your last 20+ matches to calculate your <strong>K/D Trends</strong>, <strong>Rank Readiness Index</strong>, and <strong>Combat Consistency</strong>. Pinpoints your absolute <strong>#1 Focus Priority</strong> to help break your current rank ceiling.
      </div>
    </div>
  </div>

  <div class="ai-body">
    {#if loading}
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <div class="ai-loading-txt">PROCESSING MATCH DATA...</div>
      </div>
    {:else if error}
      <div class="ai-error active">{error}</div>
    {:else if !result}
      <div class="ai-placeholder">
        <div class="ai-placeholder-icon">📊</div>
        <div class="ai-placeholder-txt">Fetch your stats first, then hit "Analyse My Performance" to get personalised coaching tips based on your actual match data.</div>
      </div>
    {:else}
      <div class="ai-results active" bind:this={coachResultsEl}>
        <div class="ai-summary-banner">{@html result.summary}</div>

        {#if aiStats}
          {@const rs = aiStats.readinessScore}
          {@const circumference = 2 * Math.PI * 28}
          {@const dashOffset = circumference * (1 - rs / 100)}
          {@const rsColor = rs >= 70 ? 'var(--win)' : rs >= 45 ? '#f5a623' : 'var(--loss)'}
          <div class="ai-readiness-ring">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke={rsColor} stroke-width="6"
                stroke-dasharray={circumference.toFixed(1)} stroke-dashoffset={dashOffset.toFixed(1)}
                stroke-linecap="round" transform="rotate(-90 36 36)" style="transition:stroke-dashoffset 0.8s cubic-bezier(0.25,0.8,0.25,1);"/>
              <text x="36" y="40" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="900" font-size="16" fill={rsColor}>{rs}</text>
            </svg>
            <div>
              <div class="ai-readiness-title">Rank Readiness</div>
              <div class="ai-readiness-desc">{rs >= 70 ? 'You are performing above your rank level — push for promotion.' : rs >= 45 ? 'Core stats are solid — work on 1-2 specific weaknesses to climb.' : 'Key fundamentals need work before consistent rank progression.'}</div>
              <div class="ai-readiness-badge" style="color:{rsColor}">{rs >= 70 ? 'RANK UP READY' : rs >= 45 ? 'ON TRACK' : 'NEEDS WORK'}</div>
            </div>
          </div>

          <div class="ai-grid">
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Ratio</div><div class="ai-stat-pill-val {kdClass(aiStats.kd)}">{aiStats.kd}</div><div class="ai-stat-pill-sub">{aiStats.avgKills}K / {aiStats.avgDeaths}D avg</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Win Rate</div><div class="ai-stat-pill-val {wrClass(aiStats.wr)}">{aiStats.wr}%</div><div class="ai-stat-pill-sub">Last 5: {aiStats.recentWR5}%</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Avg ACS</div><div class="ai-stat-pill-val {acsClass(aiStats.avgACS)}">{aiStats.avgACS}</div><div class="ai-stat-pill-sub">Combat score avg</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">HS Rate</div><div class="ai-stat-pill-val {hsClass(aiStats.hsPct)}">{aiStats.hsPct}%</div><div class="ai-stat-pill-sub">Headshot %</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Clutch Rate</div><div class="ai-stat-pill-val">{((aiStats.clutchWins / aiStats.totalMatches) * 100).toFixed(1)}%</div><div class="ai-stat-pill-sub">{aiStats.clutchWins} clutch wins</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">K/D Trend</div><div class="ai-stat-pill-val" style="font-size:13px;color:{aiStats.trendDir === 'improving' ? 'var(--win)' : aiStats.trendDir === 'declining' ? 'var(--loss)' : 'var(--muted)'}">{aiStats.trendDir === 'improving' ? '📈 +' : aiStats.trendDir === 'declining' ? '📉 ' : '➡️ '}{aiStats.trendDelta}</div><div class="ai-stat-pill-sub">Last 5 vs prev 5</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Consistency</div><div class="ai-stat-pill-val" style="color:{aiStats.consistencyScore >= 75 ? 'var(--win)' : aiStats.consistencyScore >= 50 ? '#f5a623' : 'var(--loss)'}">{aiStats.consistencyScore}</div><div class="ai-stat-pill-sub">0-100 · higher = steadier</div></div>
            <div class="ai-stat-pill"><div class="ai-stat-pill-label">Carry Rate</div><div class="ai-stat-pill-val {aiStats.carryPct >= 40 ? 'good' : aiStats.carryPct >= 20 ? 'warn' : 'bad'}">{aiStats.carryPct}%</div><div class="ai-stat-pill-sub">Top-fragged team</div></div>
            {#if aiStats.attWR != null}
              <div class="ai-stat-pill"><div class="ai-stat-pill-label">Atk/Def WR</div><div class="ai-stat-pill-val" style="font-size:13px">{aiStats.attWR}% / {aiStats.defWR}%</div><div class="ai-stat-pill-sub">Attack · Defense</div></div>
            {/if}
          </div>
        {/if}

        {#if result.topFocus}
          <div class="ai-focus-block">
            <div class="ai-tip-header"><span class="ai-tip-emoji">🎯</span><span class="ai-tip-title" style="color:var(--accent);font-size:14px;">YOUR #1 FOCUS RIGHT NOW</span></div>
            <div class="ai-focus-title">{result.topFocus.title}</div>
            <div class="ai-focus-desc">{result.topFocus.desc}</div>
            <div class="ai-focus-footer">Focus on this ONE thing only · Everything else is secondary</div>
          </div>
        {/if}

        <div class="ai-sections-grid">
          {#if result.strengths.length}
            <div class="ai-tip-block">
              <div class="ai-tip-header"><span class="ai-tip-emoji">💪</span><span class="ai-tip-title strengths">Strengths</span></div>
              <div class="ai-tip-list">{#each result.strengths as item}<div class="ai-tip-item"><div class="ai-tip-bullet green"></div><div>{item}</div></div>{/each}</div>
            </div>
          {/if}
          {#if result.weaknesses.length}
            <div class="ai-tip-block">
              <div class="ai-tip-header"><span class="ai-tip-emoji">⚠️</span><span class="ai-tip-title weaknesses">Areas to Improve</span></div>
              <div class="ai-tip-list">{#each result.weaknesses as item}<div class="ai-tip-item"><div class="ai-tip-bullet red"></div><div>{item}</div></div>{/each}</div>
            </div>
          {/if}
          {#if result.tips.length}
            <div class="ai-tip-block full">
              <div class="ai-tip-header"><span class="ai-tip-emoji">⚡</span><span class="ai-tip-title tips">Action Tips</span></div>
              <div class="ai-tip-list">{#each result.tips as item}<div class="ai-tip-item"><div class="ai-tip-bullet yellow"></div><div>{item}</div></div>{/each}</div>
            </div>
          {/if}
          {#if result.agentAdvice.length}
            <div class="ai-tip-block">
              <div class="ai-tip-header"><span class="ai-tip-emoji">🎭</span><span class="ai-tip-title agents">Agent Advice</span></div>
              <div class="ai-tip-list">{#each result.agentAdvice as item}<div class="ai-tip-item"><div class="ai-tip-bullet blue"></div><div>{item}</div></div>{/each}</div>
            </div>
          {/if}
          {#if result.mental.length}
            <div class="ai-tip-block">
              <div class="ai-tip-header"><span class="ai-tip-emoji">🧠</span><span class="ai-tip-title mental">Mental Game</span></div>
              <div class="ai-tip-list">{#each result.mental as item}<div class="ai-tip-item"><div class="ai-tip-bullet purple"></div><div>{item}</div></div>{/each}</div>
            </div>
          {/if}
        </div>

        {#if result.verdict}
          <div class="ai-verdict">
            <div class="ai-verdict-label">⚡ Coach's Verdict</div>
            <div>{@html result.verdict}</div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
</style>

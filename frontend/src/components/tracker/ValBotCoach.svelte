<script>
  import { buildStatsForAI, analyseStats } from '../../lib/ai-engine';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let rankName = 'Silver 2';

  let loading = false;
  let error = '';
  let result = null;
  let aiStats = null;

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

    await new Promise(r => setTimeout(r, 1800));

    try {
      aiStats = buildStatsForAI(matches, playerName, playerTag);
      result = analyseStats(aiStats, rankName);
      clearInterval(iv);
    } catch (e) {
      error = 'Analysis failed: ' + e.message;
      clearInterval(iv);
    } finally {
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
      <div class="ai-results active">
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
  .ai-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .ai-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    flex-wrap: wrap; gap: 10px;
  }

  .ai-header-left { display: flex; align-items: center; gap: 12px; }

  .ai-icon {
    width: 38px; height: 38px; border-radius: 8px;
    background: var(--accentdim); border: 1px solid var(--accentborder);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
    box-shadow: 0 0 10px rgba(232, 255, 71, 0.15);
  }

  .ai-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 20px;
    letter-spacing: 0.5px; text-transform: uppercase; line-height: 1;
  }

  .ai-subtitle {
    font-family: 'DM Mono', monospace; font-size: 10px;
    color: var(--muted); letter-spacing: 1px; margin-top: 3px;
  }

  .ai-analyse-btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 13px; letter-spacing: 2px;
    text-transform: uppercase; padding: 9px 22px;
    background: var(--accent); color: #0d0d0f;
    border: none; border-radius: var(--radius-sm);
    cursor: pointer; transition: var(--transition);
    display: flex; align-items: center; gap: 7px;
    box-shadow: 0 4px 12px rgba(232,255,71,0.2);
  }

  .ai-analyse-btn:hover { background: #f5ff70; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(232,255,71,0.35); }
  .ai-analyse-btn:active { transform: translateY(0) scale(0.97); }
  .ai-analyse-btn:disabled { opacity: 0.4; pointer-events: none; }

  .ai-clarification-banner {
    background: linear-gradient(135deg, rgba(232, 255, 71, 0.05) 0%, rgba(255, 70, 85, 0.03) 100%);
    border-bottom: 1px solid var(--border); padding: 14px 20px;
    display: flex; align-items: center; gap: 16px;
  }

  .ai-clar-icon { font-size: 24px; filter: drop-shadow(0 0 6px var(--accent)); }

  .ai-clar-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 14px;
    text-transform: uppercase; color: var(--accent); letter-spacing: 0.5px; margin-bottom: 2px;
  }

  .ai-clar-desc { font-size: 11.5px; color: var(--muted); line-height: 1.4; }
  .ai-clar-desc strong { color: var(--text); }

  .ai-body { padding: 22px; }

  .ai-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 14px; }
  .ai-spinner { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border2); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .ai-loading-txt { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  .ai-placeholder { display: flex; flex-direction: column; align-items: center; padding: 36px 20px; gap: 10px; text-align: center; }
  .ai-placeholder-icon { font-size: 32px; opacity: 0.3; }
  .ai-placeholder-txt { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted2); letter-spacing: 1px; max-width: 320px; line-height: 1.6; }

  .ai-error { display: none; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--loss); letter-spacing: 1px; padding: 20px; background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: var(--radius-sm); }
  .ai-error.active { display: block; }

  .ai-results { display: none; }
  .ai-results.active { display: block; }

  .ai-summary-banner {
    background: var(--accentdim); border: 1px solid var(--accentborder);
    border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: 18px;
    font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 500; line-height: 1.6;
    color: rgba(232, 255, 71, 0.9);
  }
  .ai-summary-banner :global(strong) { color: var(--accent); }

  .ai-readiness-ring {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 14px 18px; margin-bottom: 16px;
  }

  .ai-readiness-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 18px;
    text-transform: uppercase; color: #fff;
  }

  .ai-readiness-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .ai-readiness-badge {
    font-family: 'DM Mono', monospace; font-size: 10px; margin-top: 6px; letter-spacing: 1px;
  }

  .ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
  .ai-stat-pill { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; }
  .ai-stat-pill-label { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  .ai-stat-pill-val { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 24px; line-height: 1; }
  .ai-stat-pill-val :global(.good) { color: var(--win); }
  .ai-stat-pill-val :global(.warn) { color: #f5a623; }
  .ai-stat-pill-val :global(.bad) { color: var(--loss); }
  .ai-stat-pill-sub { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted2); margin-top: 3px; letter-spacing: 0.5px; }

  .ai-focus-block {
    background: linear-gradient(135deg, rgba(250,68,84,0.1), rgba(20,20,22,0.6));
    border: 1.5px solid rgba(250,68,84,0.4); border-radius: var(--radius-sm);
    padding: 16px; margin-bottom: 16px;
  }

  .ai-focus-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 20px;
    text-transform: uppercase; color: #fff; letter-spacing: 0.5px; margin-bottom: 6px;
  }

  .ai-focus-desc { font-size: 12px; line-height: 1.6; color: rgba(240, 240, 242, 0.85); }

  .ai-focus-footer {
    font-family: 'DM Mono', monospace; font-size: 9px; color: rgba(250,68,84,0.7);
    letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;
  }

  .ai-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ai-tip-block { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; }
  .ai-tip-block.full { grid-column: span 2; }
  .ai-tip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .ai-tip-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; line-height: 1; }
  .ai-tip-title.strengths { color: var(--win); }
  .ai-tip-title.weaknesses { color: var(--loss); }
  .ai-tip-title.tips { color: var(--accent); }
  .ai-tip-title.agents { color: var(--blue); }
  .ai-tip-title.mental { color: #a78bfa; }

  .ai-tip-list { display: flex; flex-direction: column; gap: 7px; }
  .ai-tip-item { display: flex; align-items: flex-start; gap: 8px; font-family: 'Barlow', sans-serif; font-size: 13px; line-height: 1.5; color: rgba(240, 240, 242, 0.85); }
  .ai-tip-bullet { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .ai-tip-bullet.green { background: var(--win); }
  .ai-tip-bullet.red { background: var(--loss); }
  .ai-tip-bullet.yellow { background: var(--accent); }
  .ai-tip-bullet.blue { background: var(--blue); }
  .ai-tip-bullet.purple { background: #a78bfa; }

  .ai-verdict {
    margin-top: 12px; padding: 14px 16px; background: var(--surface3);
    border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-family: 'Barlow', sans-serif; font-size: 13px; line-height: 1.6; color: var(--text);
  }
  .ai-verdict-label { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .ai-verdict :global(strong) { color: var(--accent); }

  @media (max-width: 600px) {
    .ai-grid { grid-template-columns: repeat(2, 1fr); }
    .ai-sections-grid { grid-template-columns: 1fr; }
    .ai-tip-block.full { grid-column: span 1; }
  }
</style>

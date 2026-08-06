<script>
  export let teamRounds = [];
  export let match = null;

  let activeHoverRound = null;

  $: roundsData = (() => {
    if (!teamRounds || teamRounds.length === 0) return [];

    let myScore = 0;
    let oppScore = 0;

    return teamRounds.map((r, i) => {
      if (r.won) myScore++;
      else oppScore++;

      const diff = myScore - oppScore;

      return {
        ...r,
        index: i,
        myScore,
        oppScore,
        diff
      };
    });
  })();

  $: summaryStats = (() => {
    if (!roundsData || roundsData.length === 0) return null;

    let maxLead = 0;
    let maxLeadRound = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let firstHalfWins = 0;
    let firstHalfLosses = 0;
    let secondHalfWins = 0;
    let secondHalfLosses = 0;

    roundsData.forEach((r, i) => {
      if (r.diff > maxLead) {
        maxLead = r.diff;
        maxLeadRound = r.num;
      }
      if (r.won) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      if (i < 12) {
        if (r.won) firstHalfWins++;
        else firstHalfLosses++;
      } else {
        if (r.won) secondHalfWins++;
        else secondHalfLosses++;
      }
    });

    return {
      maxLead,
      maxLeadRound,
      maxStreak,
      firstHalfScore: `${firstHalfWins}-${firstHalfLosses}`,
      secondHalfScore: `${secondHalfWins}-${secondHalfLosses}`
    };
  })();

  $: highlightMoments = (() => {
    if (!roundsData || roundsData.length === 0) return [];
    const moments = [];

    roundsData.forEach(r => {
      if (r.isAce) {
        moments.push({
          type: 'ace',
          icon: '👑',
          label: 'ACE',
          roundNum: r.num,
          score: `${r.myScore} - ${r.oppScore}`,
          desc: `Eliminated all 5 enemies in Round ${r.num}`,
          index: r.index,
          roundData: r
        });
      } else if (r.isClutch) {
        moments.push({
          type: 'clutch',
          icon: '⭐',
          label: 'CLUTCH',
          roundNum: r.num,
          score: `${r.myScore} - ${r.oppScore}`,
          desc: `Won clutch situation in Round ${r.num} (${r.myKills || 1} Kills)`,
          index: r.index,
          roundData: r
        });
      } else if (r.myKills >= 3) {
        moments.push({
          type: 'multikill',
          icon: '🔥',
          label: `${r.myKills}K MULTI-KILL`,
          roundNum: r.num,
          score: `${r.myScore} - ${r.oppScore}`,
          desc: `Scored ${r.myKills} kills in Round ${r.num}`,
          index: r.index,
          roundData: r
        });
      }
    });

    return moments;
  })();

  $: maxDiff = Math.max(3, ...roundsData.map(r => Math.abs(r.diff)));

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 180;
  const paddingX = 36;
  const paddingY = 28;

  $: getX = (index) => {
    const total = Math.max(1, roundsData.length - 1);
    return paddingX + (index / total) * (svgWidth - 2 * paddingX);
  };

  $: getY = (diff) => {
    const centerY = svgHeight / 2;
    const availableHeight = (svgHeight - 2 * paddingY) / 2;
    return centerY - (diff / maxDiff) * availableHeight;
  };

  $: sparklinePath = (() => {
    if (roundsData.length === 0) return '';
    return roundsData.reduce((acc, r, i) => {
      const x = getX(i);
      const y = getY(r.diff);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  })();

  $: greenAreaPath = (() => {
    if (roundsData.length === 0) return '';
    const centerY = svgHeight / 2;
    let path = `M ${getX(0)} ${centerY}`;
    roundsData.forEach((r, i) => {
      const x = getX(i);
      const y = getY(Math.max(0, r.diff));
      path += ` L ${x} ${y}`;
    });
    path += ` L ${getX(roundsData.length - 1)} ${centerY} Z`;
    return path;
  })();

  $: redAreaPath = (() => {
    if (roundsData.length === 0) return '';
    const centerY = svgHeight / 2;
    let path = `M ${getX(0)} ${centerY}`;
    roundsData.forEach((r, i) => {
      const x = getX(i);
      const y = getY(Math.min(0, r.diff));
      path += ` L ${x} ${y}`;
    });
    path += ` L ${getX(roundsData.length - 1)} ${centerY} Z`;
    return path;
  })();
</script>

{#if roundsData.length > 0}
  <div class="momentum-wrap">
    <!-- Header -->
    <div class="momentum-header">
      <div class="momentum-title">
        <span class="momentum-icon">📈</span>
        MATCH ROUND MOMENTUM & SCORE DIFFERENTIAL
      </div>
      <div class="momentum-legend">
        <span class="leg-item leg-win"><span class="leg-dot win"></span> Lead (+)</span>
        <span class="leg-item leg-loss"><span class="leg-dot loss"></span> Trailing (-)</span>
        <span class="leg-item leg-half"><span class="leg-line"></span> Side Swap (R12)</span>
      </div>
    </div>

    <!-- Match Summary Analytics Pills -->
    {#if summaryStats}
      <div class="summary-pills-grid">
        <div class="spill-card">
          <span class="spill-label">MAX LEAD</span>
          <span class="spill-val green">+{summaryStats.maxLead} <span class="spill-sub">(R{summaryStats.maxLeadRound})</span></span>
        </div>
        <div class="spill-card">
          <span class="spill-label">LONGEST STREAK</span>
          <span class="spill-val gold">🔥 {summaryStats.maxStreak} <span class="spill-sub">Rounds</span></span>
        </div>
        <div class="spill-card">
          <span class="spill-label">1ST HALF</span>
          <span class="spill-val">{summaryStats.firstHalfScore}</span>
        </div>
        {#if roundsData.length > 12}
          <div class="spill-card">
            <span class="spill-label">2ND HALF</span>
            <span class="spill-val">{summaryStats.secondHalfScore}</span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Main SVG Graph Container -->
    <div class="momentum-chart-container">
      <svg 
        viewBox="0 0 {svgWidth} {svgHeight}" 
        class="momentum-svg"
      >
        <defs>
          <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3ecf8e" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#3ecf8e" stop-opacity="0.0" />
          </linearGradient>

          <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fa4454" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#fa4454" stop-opacity="0.4" />
          </linearGradient>

          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Zero Equilibrium Baseline -->
        <line 
          x1="{paddingX}" 
          y1="{svgHeight / 2}" 
          x2="{svgWidth - paddingX}" 
          y2="{svgHeight / 2}" 
          class="baseline"
        />

        <!-- Baseline Labels -->
        <text x="{paddingX - 10}" y="{svgHeight / 2 + 3}" class="baseline-text" text-anchor="end">0</text>
        <text x="{paddingX - 10}" y="{paddingY + 6}" class="lead-text" text-anchor="end">+{maxDiff}</text>
        <text x="{paddingX - 10}" y="{svgHeight - paddingY}" class="trail-text" text-anchor="end">-{maxDiff}</text>

        <!-- Halftime Side Swap Line (Round 12) -->
        {#if roundsData.length >= 12}
          <line 
            x1="{getX(11)}" 
            y1="{paddingY - 6}" 
            x2="{getX(11)}" 
            y2="{svgHeight - paddingY + 6}" 
            class="halftime-line"
          />
          <text 
            x="{getX(11)}" 
            y="{paddingY - 10}" 
            class="halftime-label" 
            text-anchor="middle"
          >
            HALFTIME · SIDE SWAP
          </text>
        {/if}

        <!-- Lead & Trailing Gradient Fills -->
        <path d="{greenAreaPath}" fill="url(#leadGrad)" />
        <path d="{redAreaPath}" fill="url(#trailGrad)" />

        <!-- Polyline Sparkline Curve -->
        <path d="{sparklinePath}" class="sparkline-line" filter="url(#glowGreen)" />

        <!-- Interactive Round Nodes & Event Badges -->
        {#each roundsData as r, i}
          <g 
            class="node-group" 
            on:mouseenter={() => activeHoverRound = r} 
            on:mouseleave={() => activeHoverRound = null}
          >
            <!-- Vertical guide line on hover -->
            {#if activeHoverRound?.index === i}
              <line 
                x1="{getX(i)}" 
                y1="{paddingY}" 
                x2="{getX(i)}" 
                y2="{svgHeight - paddingY}" 
                class="hover-guide-line"
              />
            {/if}

            <circle
              cx="{getX(i)}"
              cy="{getY(r.diff)}"
              r="{r.isAce ? 8 : r.isClutch ? 7 : activeHoverRound?.index === i ? 7 : 4.5}"
              class="node-dot {r.isAce ? 'node-ace' : r.isClutch ? 'node-clutch' : r.diff > 0 ? 'node-lead' : r.diff < 0 ? 'node-trail' : 'node-tie'}"
            />

            <!-- Event Badges -->
            {#if r.isAce}
              <text x="{getX(i)}" y="{getY(r.diff) - 12}" class="event-badge badge-ace" text-anchor="middle">👑 ACE</text>
            {:else if r.isClutch}
              <text x="{getX(i)}" y="{getY(r.diff) - 12}" class="event-badge badge-clutch" text-anchor="middle">⭐ CLUTCH</text>
            {:else if r.myKills >= 3}
              <text x="{getX(i)}" y="{getY(r.diff) - 12}" class="event-badge badge-multikill" text-anchor="middle">🔥 {r.myKills}K</text>
            {/if}
          </g>
        {/each}
      </svg>

      <!-- Active Hover Floating Card Tooltip -->
      {#if activeHoverRound}
        <div 
          class="momentum-tooltip" 
          style="left: {Math.min(85, Math.max(15, (activeHoverRound.index / Math.max(1, roundsData.length - 1)) * 90 + 5))}%;"
        >
          <div class="tt-head">ROUND {activeHoverRound.num}</div>
          <div class="tt-score {activeHoverRound.won ? 'win' : 'loss'}">
            {activeHoverRound.won ? 'VICTORY' : 'DEFEAT'} · Score: {activeHoverRound.myScore} - {activeHoverRound.oppScore}
          </div>
          <div class="tt-diff">
            Differential: {activeHoverRound.diff > 0 ? `+${activeHoverRound.diff} Lead` : activeHoverRound.diff < 0 ? `${activeHoverRound.diff} Trailing` : 'TIED'}
          </div>
          {#if activeHoverRound.isAce}
            <div class="tt-highlight ace">👑 ACE (5 Kills)</div>
          {:else if activeHoverRound.isClutch}
            <div class="tt-highlight clutch">⭐ CLUTCH WON</div>
          {:else if activeHoverRound.myKills > 0}
            <div class="tt-sub">🔥 {activeHoverRound.myKills} Kills this round</div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Stepper Round Timeline Bar -->
    <div class="rounds-stepper-container">
      <div class="stepper-title">ROUND SEQUENCE & PROGRESSION</div>
      <div class="stepper-grid">
        {#each roundsData as r, i}
          <div 
            class="stepper-card {r.won ? 'won' : 'lost'} {r.isAce ? 'is-ace' : r.isClutch ? 'is-clutch' : ''} {activeHoverRound?.index === i ? 'active' : ''}"
            on:mouseenter={() => activeHoverRound = r}
            on:mouseleave={() => activeHoverRound = null}
          >
            <div class="sc-rnum">R{r.num}</div>
            <div class="sc-score">{r.myScore}-{r.oppScore}</div>
            <div class="sc-kills-wrap">
              {#if r.isAce}
                <span class="sc-kills-badge is-ace" title="ACE (5 Kills)">👑 5K</span>
              {:else if r.isClutch}
                <span class="sc-kills-badge is-clutch" title="Clutch ({r.myKills || 1} Kills)">⭐ {r.myKills || 1}K</span>
              {:else if r.myKills >= 3}
                <span class="sc-kills-badge is-multi" title="{r.myKills} Multi-kill">🔥 {r.myKills}K</span>
              {:else if r.myKills > 0}
                <span class="sc-kills-badge is-kill">{r.myKills}K</span>
              {:else}
                <span class="sc-kills-badge is-zero">0K</span>
              {/if}
              <span class="sc-result-symbol {r.won ? 'won' : 'lost'}">{r.won ? '✓' : '✕'}</span>
            </div>
          </div>
          {#if i === 11 && roundsData.length > 12}
            <div class="stepper-divider" title="Halftime Side Swap">
              <span>SWAP</span>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Highlight Moments Showcase Grid -->
    {#if highlightMoments.length > 0}
      <div class="highlights-showcase-container">
        <div class="hs-title">
          <span class="hs-title-icon">⚡</span>
          MATCH HIGHLIGHT MOMENTS ({highlightMoments.length})
        </div>

        <div class="hs-grid">
          {#each highlightMoments as item}
            <div 
              class="hs-card hs-card-{item.type} {activeHoverRound?.index === item.index ? 'active' : ''}"
              on:mouseenter={() => activeHoverRound = item.roundData}
              on:mouseleave={() => activeHoverRound = null}
            >
              <div class="hs-badge-header">
                <span class="hs-icon">{item.icon}</span>
                <span class="hs-type">{item.label}</span>
                <span class="hs-round">ROUND {item.roundNum}</span>
              </div>

              <div class="hs-body">
                <div class="hs-score">Score State: {item.score}</div>
                <div class="hs-desc">{item.desc}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .momentum-wrap {
    background: rgba(12, 12, 16, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 20px;
    backdrop-filter: blur(16px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }

  .momentum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .momentum-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .momentum-icon {
    font-size: 14px;
  }

  .momentum-legend {
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #a0a0ab);
  }

  .leg-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .leg-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .leg-dot.win { background: #3ecf8e; box-shadow: 0 0 8px #3ecf8e; }
  .leg-dot.loss { background: #fa4454; box-shadow: 0 0 8px #fa4454; }

  .leg-line {
    width: 12px;
    height: 1.5px;
    background: rgba(255, 255, 255, 0.4);
    border-style: dashed;
  }

  /* Summary Stat Cards */
  .summary-pills-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .spill-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .spill-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .spill-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
  }

  .spill-val.green { color: #3ecf8e; }
  .spill-val.gold { color: #ffd700; }

  .spill-sub {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }

  .momentum-chart-container {
    position: relative;
    width: 100%;
    margin-bottom: 16px;
  }

  .momentum-svg {
    width: 100%;
    height: auto;
    max-height: 200px;
    overflow: visible;
  }

  .baseline {
    stroke: rgba(255, 255, 255, 0.16);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }

  .baseline-text {
    fill: rgba(255, 255, 255, 0.35);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
  }

  .lead-text {
    fill: #3ecf8e;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
  }

  .trail-text {
    fill: #fa4454;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
  }

  .halftime-line {
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .halftime-label {
    fill: rgba(255, 255, 255, 0.5);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }

  .sparkline-line {
    fill: none;
    stroke: #3ecf8e;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .hover-guide-line {
    stroke: rgba(255, 255, 255, 0.25);
    stroke-width: 1;
    stroke-dasharray: 2 2;
  }

  .node-group {
    cursor: pointer;
  }

  .node-dot {
    transition: r 0.2s ease, fill 0.2s ease;
  }

  .node-ace {
    fill: #ffd700;
    stroke: #000;
    stroke-width: 2.5;
    filter: drop-shadow(0 0 6px #ffd700);
  }

  .node-clutch {
    fill: #3ecf8e;
    stroke: #000;
    stroke-width: 2.5;
    filter: drop-shadow(0 0 6px #3ecf8e);
  }

  .node-lead {
    fill: #3ecf8e;
    stroke: #0c0c10;
    stroke-width: 2;
  }

  .node-trail {
    fill: #fa4454;
    stroke: #0c0c10;
    stroke-width: 2;
  }

  .node-tie {
    fill: #ffffff;
    stroke: #0c0c10;
    stroke-width: 2;
  }

  .node-group:hover .node-dot {
    r: 8px;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.9));
  }

  .event-badge {
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    font-weight: 900;
  }

  .badge-ace { fill: #ffd700; }
  .badge-clutch { fill: #3ecf8e; }
  .badge-multikill { fill: #fa4454; }

  .momentum-tooltip {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(16, 16, 22, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    z-index: 30;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
  }

  .tt-head {
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    font-size: 9px;
    letter-spacing: 0.5px;
  }

  .tt-score {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 14px;
    margin-top: 2px;
  }

  .tt-score.win { color: #3ecf8e; }
  .tt-score.loss { color: #fa4454; }

  .tt-diff {
    font-size: 9.5px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 2px;
  }

  .tt-highlight {
    font-size: 9.5px;
    font-weight: 700;
    margin-top: 3px;
  }

  .tt-highlight.ace { color: #ffd700; }
  .tt-highlight.clutch { color: #3ecf8e; }

  .tt-sub {
    font-size: 9.5px;
    color: var(--muted, #a0a0ab);
    margin-top: 2px;
  }

  /* Round Stepper Grid */
  .rounds-stepper-container {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 12px;
    margin-bottom: 16px;
  }

  .stepper-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .stepper-grid {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .stepper-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .stepper-card.won {
    border-color: rgba(62, 207, 142, 0.3);
    background: rgba(62, 207, 142, 0.05);
  }

  .stepper-card.lost {
    border-color: rgba(250, 68, 84, 0.3);
    background: rgba(250, 68, 84, 0.05);
  }

  .stepper-card.is-ace {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.12);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  }

  .stepper-card.is-clutch {
    border-color: rgba(62, 207, 142, 0.6);
    background: rgba(62, 207, 142, 0.12);
  }

  .stepper-card:hover, .stepper-card.active {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .stepper-card.won:hover, .stepper-card.won.active {
    background: rgba(62, 207, 142, 0.2);
    border-color: #3ecf8e;
  }

  .stepper-card.lost:hover, .stepper-card.lost.active {
    background: rgba(250, 68, 84, 0.2);
    border-color: #fa4454;
  }

  .sc-rnum {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted, #a0a0ab);
    font-weight: 700;
  }

  .sc-score {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    margin: 2px 0;
  }

  .sc-kills-wrap {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 2px;
  }

  .sc-kills-badge {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 800;
    line-height: 1;
    padding: 1px 3px;
    border-radius: 3px;
  }

  .sc-kills-badge.is-ace {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.4);
  }

  .sc-kills-badge.is-clutch {
    color: #3ecf8e;
    background: rgba(62, 207, 142, 0.2);
    border: 1px solid rgba(62, 207, 142, 0.4);
  }

  .sc-kills-badge.is-multi {
    color: #fa4454;
    background: rgba(250, 68, 84, 0.2);
    border: 1px solid rgba(250, 68, 84, 0.4);
  }

  .sc-kills-badge.is-kill {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .sc-kills-badge.is-zero {
    color: rgba(255, 255, 255, 0.35);
  }

  .sc-result-symbol {
    font-size: 8px;
    font-weight: 800;
    line-height: 1;
  }

  .sc-result-symbol.won { color: #3ecf8e; }
  .sc-result-symbol.lost { color: #fa4454; }

  .stepper-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-family: 'DM Mono', monospace;
    font-size: 7px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.4);
    border-left: 1px dashed rgba(255, 255, 255, 0.2);
    border-right: 1px dashed rgba(255, 255, 255, 0.2);
    height: 32px;
    flex-shrink: 0;
  }

  /* Highlights Showcase Container */
  .highlights-showcase-container {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 14px;
  }

  .hs-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hs-title-icon {
    color: #ffd700;
  }

  .hs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }

  .hs-card {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .hs-card:hover, .hs-card.active {
    transform: translateY(-2px);
  }

  .hs-card-ace {
    border-color: rgba(255, 215, 0, 0.4);
    background: rgba(255, 215, 0, 0.06);
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.1);
  }

  .hs-card-ace:hover, .hs-card-ace.active {
    border-color: #ffd700;
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.25);
  }

  .hs-card-clutch {
    border-color: rgba(62, 207, 142, 0.4);
    background: rgba(62, 207, 142, 0.06);
    box-shadow: 0 4px 16px rgba(62, 207, 142, 0.1);
  }

  .hs-card-clutch:hover, .hs-card-clutch.active {
    border-color: #3ecf8e;
    box-shadow: 0 8px 24px rgba(62, 207, 142, 0.25);
  }

  .hs-card-multikill {
    border-color: rgba(250, 68, 84, 0.4);
    background: rgba(250, 68, 84, 0.06);
    box-shadow: 0 4px 16px rgba(250, 68, 84, 0.1);
  }

  .hs-card-multikill:hover, .hs-card-multikill.active {
    border-color: #fa4454;
    box-shadow: 0 8px 24px rgba(250, 68, 84, 0.25);
  }

  .hs-badge-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .hs-icon {
    font-size: 13px;
  }

  .hs-type {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  .hs-card-ace .hs-type { color: #ffd700; }
  .hs-card-clutch .hs-type { color: #3ecf8e; }
  .hs-card-multikill .hs-type { color: #fa4454; }

  .hs-round {
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.5);
    margin-left: auto;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .hs-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hs-score {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    color: rgba(255, 255, 255, 0.85);
  }

  .hs-desc {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--muted, #a0a0ab);
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    .summary-pills-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .hs-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .momentum-wrap {
      padding: 12px 14px;
    }
    .momentum-legend {
      display: none;
    }
  }
</style>

<script>
  export let teamRounds = [];
  export let match = null;

  let activeHoverRound = null;

  $: roundsData = (() => {
    if (!teamRounds || teamRounds.length === 0) return [];

    let myScore = 0;
    let oppScore = 0;
    let currentDiff = 0;

    return teamRounds.map((r, i) => {
      if (r.won) myScore++;
      else oppScore++;

      currentDiff = myScore - oppScore;

      return {
        ...r,
        index: i,
        myScore,
        oppScore,
        diff: currentDiff
      };
    });
  })();

  $: maxDiff = Math.max(4, ...roundsData.map(r => Math.abs(r.diff)));

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 140;
  const paddingX = 24;
  const paddingY = 20;

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

  $: areaPathGreen = (() => {
    if (roundsData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(roundsData.length - 1);
    const centerY = svgHeight / 2;
    return `${sparklinePath} L ${lastX} ${centerY} L ${firstX} ${centerY} Z`;
  })();
</script>

{#if roundsData.length > 0}
  <div class="momentum-wrap">
    <div class="momentum-header">
      <div class="momentum-title">
        <span class="momentum-icon">📈</span>
        ROUND-BY-ROUND MOMENTUM GRAPH
      </div>
      <div class="momentum-legend">
        <span class="leg-item leg-win"><span class="leg-dot win"></span> Lead</span>
        <span class="leg-item leg-loss"><span class="leg-dot loss"></span> Trailing</span>
        <span class="leg-item leg-half"><span class="leg-line"></span> Halftime (R12)</span>
      </div>
    </div>

    <div class="momentum-chart-container">
      <svg 
        viewBox="0 0 {svgWidth} {svgHeight}" 
        class="momentum-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3ecf8e" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#3ecf8e" stop-opacity="0.0" />
          </linearGradient>

          <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fa4454" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#fa4454" stop-opacity="0.35" />
          </linearGradient>

          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Center Equilibrium Baseline (0 Diff) -->
        <line 
          x1="{paddingX}" 
          y1="{svgHeight / 2}" 
          x2="{svgWidth - paddingX}" 
          y2="{svgHeight / 2}" 
          class="baseline"
        />

        <!-- Halftime Divider (Round 12) -->
        {#if roundsData.length >= 12}
          <line 
            x1="{getX(11)}" 
            y1="{paddingY / 2}" 
            x2="{getX(11)}" 
            y2="{svgHeight - paddingY / 2}" 
            class="halftime-line"
          />
          <text 
            x="{getX(11)}" 
            y="{paddingY / 1.5}" 
            class="halftime-label" 
            text-anchor="middle"
          >
            SIDE SWAP
          </text>
        {/if}

        <!-- Gradient Area Under Curve -->
        <path d="{areaPathGreen}" fill="url(#leadGrad)" />

        <!-- Polyline Sparkline Curve -->
        <path d="{sparklinePath}" class="sparkline-line" filter="url(#glowGreen)" />

        <!-- Data Nodes & Event Badges -->
        {#each roundsData as r, i}
          <g class="node-group" on:mouseenter={() => activeHoverRound = r} on:mouseleave={() => activeHoverRound = null}>
            <circle
              cx="{getX(i)}"
              cy="{getY(r.diff)}"
              r="{r.isClutch || r.isAce ? 6 : activeHoverRound?.index === i ? 5 : 3.5}"
              class="node-dot {r.won ? 'node-win' : 'node-loss'} {r.isClutch ? 'node-clutch' : ''}"
            />

            {#if r.isAce}
              <text x="{getX(i)}" y="{getY(r.diff) - 10}" class="event-badge badge-ace" text-anchor="middle">👑 ACE</text>
            {:else if r.isClutch}
              <text x="{getX(i)}" y="{getY(r.diff) - 10}" class="event-badge badge-clutch" text-anchor="middle">⭐ CLUTCH</text>
            {:else if r.myKills >= 3}
              <text x="{getX(i)}" y="{getY(r.diff) - 10}" class="event-badge badge-multikill" text-anchor="middle">{r.myKills}K</text>
            {/if}
          </g>
        {/each}
      </svg>

      <!-- Active Hover Tooltip -->
      {#if activeHoverRound}
        <div 
          class="momentum-tooltip" 
          style="left: {(activeHoverRound.index / Math.max(1, roundsData.length - 1)) * 90 + 5}%;"
        >
          <div class="tt-head">ROUND {activeHoverRound.num}</div>
          <div class="tt-result {activeHoverRound.won ? 'win' : 'loss'}">
            {activeHoverRound.won ? 'VICTORY' : 'DEFEAT'} ({activeHoverRound.myScore} - {activeHoverRound.oppScore})
          </div>
          {#if activeHoverRound.isAce}
            <div class="tt-highlight ace">👑 ACE ROUND ({activeHoverRound.myKills} Kills)</div>
          {:else if activeHoverRound.isClutch}
            <div class="tt-highlight clutch">⭐ CLUTCH WON</div>
          {:else if activeHoverRound.myKills > 0}
            <div class="tt-sub">{activeHoverRound.myKills} Kills in Round</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .momentum-wrap {
    background: rgba(12, 12, 16, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .momentum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .momentum-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 13px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .momentum-icon {
    font-size: 12px;
  }

  .momentum-legend {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
  }

  .leg-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .leg-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .leg-dot.win { background: #3ecf8e; box-shadow: 0 0 6px #3ecf8e; }
  .leg-dot.loss { background: #fa4454; box-shadow: 0 0 6px #fa4454; }

  .leg-line {
    width: 10px;
    height: 1px;
    background: rgba(255, 255, 255, 0.4);
    border-style: dashed;
  }

  .momentum-chart-container {
    position: relative;
    width: 100%;
  }

  .momentum-svg {
    width: 100%;
    height: 140px;
    overflow: visible;
  }

  .baseline {
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .halftime-line {
    stroke: rgba(255, 255, 255, 0.25);
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .halftime-label {
    fill: rgba(255, 255, 255, 0.4);
    font-family: 'DM Mono', monospace;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .sparkline-line {
    fill: none;
    stroke: #3ecf8e;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .node-group {
    cursor: pointer;
  }

  .node-dot {
    transition: r 0.2s ease, fill 0.2s ease;
  }

  .node-win {
    fill: #3ecf8e;
    stroke: #0c0c10;
    stroke-width: 1.5;
  }

  .node-loss {
    fill: #fa4454;
    stroke: #0c0c10;
    stroke-width: 1.5;
  }

  .node-clutch {
    fill: #ffd700;
    stroke: #000;
    stroke-width: 1.5;
  }

  .node-group:hover .node-dot {
    r: 6px;
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
  }

  .event-badge {
    font-family: 'DM Mono', monospace;
    font-size: 7.5px;
    font-weight: 800;
  }

  .badge-ace { fill: #ffd700; }
  .badge-clutch { fill: #3ecf8e; }
  .badge-multikill { fill: #fa4454; }

  .momentum-tooltip {
    position: absolute;
    bottom: -8px;
    transform: translateX(-50%) translateY(100%);
    background: rgba(18, 18, 24, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 6px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    z-index: 20;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
  }

  .tt-head {
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    font-size: 8.5px;
    letter-spacing: 0.5px;
  }

  .tt-result {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 13px;
  }

  .tt-result.win { color: #3ecf8e; }
  .tt-result.loss { color: #fa4454; }

  .tt-highlight {
    font-size: 9px;
    font-weight: 700;
    margin-top: 2px;
  }

  .tt-highlight.ace { color: #ffd700; }
  .tt-highlight.clutch { color: #3ecf8e; }

  .tt-sub {
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    margin-top: 2px;
  }

  @media (max-width: 600px) {
    .momentum-wrap {
      padding: 10px 12px;
    }
    .momentum-legend {
      display: none;
    }
  }
</style>

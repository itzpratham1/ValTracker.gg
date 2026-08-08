<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

  Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

  export let stats = null;
  export let onStatClick = (key) => {};

  let canvasEl;
  let chartInstance = null;

  // Raw numeric values for animation
  $: rawKd = stats?.kd ?? null;
  $: rawKills = stats?.avgKills ?? null;
  $: rawDeaths = stats?.avgDeaths ?? null;
  $: rawAssists = stats?.avgAssists ?? null;
  $: rawACS = stats?.avgACS ?? null;
  $: rawHS = stats?.hsRate ?? null;

  // Displayed (possibly animated) values
  let dispKd = '—';
  let dispKills = '—';
  let dispDeaths = '—';
  let dispAssists = '—';
  let dispACS = '—';
  let dispHS = '—%';

  // Conditional accent classes
  $: kdClass = rawKd !== null ? (rawKd >= 1.0 ? 'accent-good' : 'accent-bad') : '';
  $: hsClass = rawHS !== null ? (rawHS >= 25 ? 'accent-good' : rawHS >= 15 ? 'accent-warn' : 'accent-bad') : '';

  $: kast = stats?.kast != null ? stats.kast + '%' : '—%';
  $: damageDeltaPerRound = stats?.damageDeltaPerRound != null ? (stats.damageDeltaPerRound > 0 ? '+' : '') + stats.damageDeltaPerRound : '—';
  $: ddColor = stats?.damageDeltaPerRound >= 0 ? '#3ecf8e' : '#ff5757';
  $: ddRgb = stats?.damageDeltaPerRound >= 0 ? '62,207,142' : '255,87,87';
  $: kadRatio = stats?.kadRatio?.toFixed(2) ?? '—';
  $: killsPerRound = stats?.killsPerRound?.toFixed(2) ?? '—';
  $: firstBloods = stats?.firstBloods ?? '—';
  $: flawlessRounds = stats?.flawlessRounds ?? '—';
  $: aces = stats?.aces ?? '—';

  // ── Count-up animation ──
  let animated = false;
  let cardWrapEl;
  let countObserver;

  function animateCounter(from, to, decimals, duration, setter) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const val = from + (to - from) * ease;
      setter(val.toFixed(decimals));
      if (t < 1) requestAnimationFrame(tick);
      else setter(to.toFixed(decimals));
    }
    requestAnimationFrame(tick);
  }

  function startCountUps() {
    if (animated || !stats) return;
    animated = true;
    if (rawKd !== null)     animateCounter(0, rawKd,      2, 900, v => dispKd      = v);
    if (rawKills !== null)  animateCounter(0, rawKills,   1, 900, v => dispKills   = v);
    if (rawDeaths !== null) animateCounter(0, rawDeaths,  1, 900, v => dispDeaths  = v);
    if (rawAssists !== null)animateCounter(0, rawAssists, 1, 900, v => dispAssists = v);
    if (rawACS !== null)    animateCounter(0, rawACS,     0, 900, v => dispACS     = v);
    if (rawHS !== null)     animateCounter(0, rawHS,      0, 900, v => dispHS      = v + '%');
  }

  // Initialize display from stats on first data load
  $: if (stats && !animated) {
    dispKd      = stats.kd?.toFixed(2) ?? '—';
    dispKills   = stats.avgKills?.toFixed(1) ?? '—';
    dispDeaths  = stats.avgDeaths?.toFixed(1) ?? '—';
    dispAssists = stats.avgAssists?.toFixed(1) ?? '—';
    dispACS     = stats.avgACS?.toString() ?? '—';
    dispHS      = (stats.hsRate != null ? stats.hsRate + '%' : '—%');
  }

  $: if (stats && canvasEl) {
    renderRadar();
  }

  onMount(() => {
    renderRadar();
    // Set up IntersectionObserver to trigger count-up once
    if (typeof IntersectionObserver !== 'undefined') {
      countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(e => {
            if (e.isIntersecting && stats) {
              startCountUps();
              countObserver.disconnect();
            }
          });
        },
        { threshold: 0.2 }
      );
      if (cardWrapEl) countObserver.observe(cardWrapEl);
    }
  });

  onDestroy(() => {
    if (chartInstance) chartInstance.destroy();
    if (countObserver) countObserver.disconnect();
  });

  function renderRadar() {
    if (!canvasEl || !stats) return;
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    // Scale values to range [0, 100] for balanced radar chart rendering
    const kdVal = Math.min(100, Math.max(0, ((stats.kd || 0) / 2.0) * 100));
    const kastVal = stats.kast || 70;
    const acsVal = Math.min(100, Math.max(0, ((stats.avgACS || 0) / 350) * 100));
    const hsVal = Math.min(100, Math.max(0, ((stats.hsRate || 0) / 45) * 100));
    const ddVal = Math.min(100, Math.max(0, (((stats.damageDeltaPerRound || 0) + 50) / 100) * 100));
    const fbVal = Math.min(100, Math.max(0, ((stats.firstBloods || 0) / (stats.matchesCount || 20) / 5) * 100));

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    const ctx = canvasEl.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['K/D Ratio', 'KAST %', 'ACS', 'HS %', 'Damage Delta', 'First Bloods'],
        datasets: [{
          label: 'Combat Shape',
          data: [kdVal, kastVal, acsVal, hsVal, ddVal, fbVal],
      backgroundColor: 'rgba(250, 68, 84, 0.38)',
      borderColor: '#fa4454',
      borderWidth: 2.5,
          pointBackgroundColor: '#fa4454',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#fa4454',
          pointRadius: isMobile ? 3 : 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: isMobile ? { top: 12, bottom: 12, left: 16, right: 16 } : 10
        },
        scales: {
          r: {
            angleLines: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.04)'
            },
            pointLabels: {
              color: '#a0a0ab',
              font: {
                family: "'Inter', sans-serif",
                size: isMobile ? 8 : 10,
                weight: '600'
              }
            },
            ticks: {
              display: false,
              maxTicksLimit: 4
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0b0b0f',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: '#e2e2e9',
            titleFont: { family: "'Exo 2', sans-serif", size: 11, weight: 'bold' },
            bodyFont: { family: "'DM Mono', monospace", size: 10 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                if (label === 'K/D Ratio') return ` K/D Ratio: ${stats.kd?.toFixed(2)}`;
                if (label === 'KAST %') return ` KAST %: ${stats.kast}%`;
                if (label === 'ACS') return ` Avg ACS: ${stats.avgACS}`;
                if (label === 'HS %') return ` HS Rate: ${stats.hsRate}%`;
                if (label === 'Damage Delta') return ` DDΔ/Round: ${stats.damageDeltaPerRound}`;
                if (label === 'First Bloods') return ` First Bloods: ${stats.firstBloods}`;
                return ` ${label}: ${context.raw}`;
              }
            }
          }
        }
      }
    });
  }
</script>

{#if stats}
  <!-- 6 core stats cards grid -->
  <div class="stat-cards-wrapper" bind:this={cardWrapEl}>
    <button class="card clickable visible {kdClass}" on:click={() => onStatClick('kd')}>
      <div class="card-accent-line"></div>
      <div class="card-label">K/D Ratio</div>
      <div class="card-val">{dispKd}</div>
      <div class="card-sub">Competitive</div>
    </button>
    <button class="card clickable visible" on:click={() => onStatClick('kills')}>
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Kills</div>
      <div class="card-val">{dispKills}</div>
      <div class="card-sub">Per match</div>
    </button>
    <button class="card clickable visible" on:click={() => onStatClick('deaths')}>
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Deaths</div>
      <div class="card-val">{dispDeaths}</div>
      <div class="card-sub">Per match</div>
    </button>
    <button class="card clickable visible" on:click={() => onStatClick('assists')}>
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Assists</div>
      <div class="card-val">{dispAssists}</div>
      <div class="card-sub">Per match</div>
    </button>
    <button class="card clickable visible" on:click={() => onStatClick('acs')}>
      <div class="card-accent-line"></div>
      <div class="card-label">Avg ACS</div>
      <div class="card-val">{dispACS}</div>
      <div class="card-sub">Combat Score</div>
    </button>
    <button class="card clickable visible {hsClass}" on:click={() => onStatClick('hs')}>
      <div class="card-accent-line"></div>
      <div class="card-label">HS Rate</div>
      <div class="card-val">{dispHS}</div>
      <div class="card-sub">Headshots</div>
    </button>
  </div>

  <!-- Large Combat Shape Analysis card spanning full width -->
  <div class="card visible combat-bento-card">
    <div class="card-accent-line"></div>
    <div class="combat-bento-header">
      <div class="card-label">Combat Shape Analysis</div>
      <div class="card-sub">Interactive tactical playstyle profile shape</div>
    </div>
    
    <div class="combat-bento-body">
      <div class="radar-chart-container">
        <canvas bind:this={canvasEl}></canvas>
      </div>
      
      <div class="combat-stats-list">
        <!-- KAST Card -->
        <div class="combat-stat-item" style="--accent-color:#e8ff47; --accent-rgb:232,255,71;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">KAST %</span>
          </div>
          <span class="stat-value">{kast}</span>
        </div>
        <!-- DDΔ/Round Card -->
        <div class="combat-stat-item" style="--accent-color:{ddColor}; --accent-rgb:{ddRgb};">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">DDΔ/Round</span>
          </div>
          <span class="stat-value">{damageDeltaPerRound}</span>
        </div>
        <!-- KAD Ratio Card -->
        <div class="combat-stat-item" style="--accent-color:#60a5fa; --accent-rgb:96,165,250;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">KAD Ratio</span>
          </div>
          <span class="stat-value">{kadRatio}</span>
        </div>
        <!-- Kills/Round Card -->
        <div class="combat-stat-item" style="--accent-color:#a78bfa; --accent-rgb:167,139,250;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">Kills/Round</span>
          </div>
          <span class="stat-value">{killsPerRound}</span>
        </div>
        <!-- First Bloods Card -->
        <div class="combat-stat-item" style="--accent-color:#fb923c; --accent-rgb:251,146,60;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">First Bloods</span>
          </div>
          <span class="stat-value">{firstBloods}</span>
        </div>
        <!-- Flawless Rounds Card -->
        <div class="combat-stat-item" style="--accent-color:#06b6d4; --accent-rgb:6,182,212;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">Flawless Rounds</span>
          </div>
          <span class="stat-value">{flawlessRounds}</span>
        </div>
        <!-- Aces Card -->
        <div class="combat-stat-item" style="--accent-color:#f43f5e; --accent-rgb:244,63,94;">
          <div class="stat-meta">
            <span class="stat-dot" style="background:var(--accent-color); box-shadow: 0 0 8px var(--accent-color);"></span>
            <span class="stat-title">Aces</span>
          </div>
          <span class="stat-value">{aces}</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .stat-cards-wrapper,
  .combat-bento-card {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .stat-cards-wrapper {
    display: grid !important;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
  }

  /* Conditional accent borders on stat cards */
  .stat-cards-wrapper .card.accent-good {
    border-left: 3px solid #3ecf8e !important;
    box-shadow: inset 3px 0 12px rgba(62,207,142,0.08) !important;
  }
  .stat-cards-wrapper .card.accent-bad {
    border-left: 3px solid #ff5757 !important;
    box-shadow: inset 3px 0 12px rgba(255,87,87,0.08) !important;
  }
  .stat-cards-wrapper .card.accent-warn {
    border-left: 3px solid #e8ff47 !important;
    box-shadow: inset 3px 0 12px rgba(232,255,71,0.08) !important;
  }

  /* Stronger hover glow */
  .stat-cards-wrapper .card:hover {
    box-shadow: 0 0 24px rgba(250,68,84,0.22), 0 8px 32px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(250,68,84,0.28) !important;
    transform: translateY(-5px) !important;
  }
  @media (max-width: 900px) {
    .stat-cards-wrapper {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 10px !important;
    }
  }
  @media (max-width: 600px) {
    .stat-cards-wrapper {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    .stat-cards-wrapper .card {
      width: 100% !important;
      grid-column: span 1 !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      padding: 12px 10px !important;
      margin: 0 !important;
    }
    .stat-cards-wrapper .card-val {
      font-size: 24px !important;
      line-height: 1.1 !important;
    }
    .stat-cards-wrapper .card-label {
      font-size: 10px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .stat-cards-wrapper .card-sub {
      font-size: 9px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .combat-stats-list {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
  }
</style>



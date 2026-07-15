<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

  Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

  export let stats = null;
  export let onStatClick = (key) => {};

  let canvasEl;
  let chartInstance = null;

  $: kd = stats?.kd?.toFixed(2) ?? '—';
  $: avgKills = stats?.avgKills?.toFixed(1) ?? '—';
  $: avgDeaths = stats?.avgDeaths?.toFixed(1) ?? '—';
  $: avgAssists = stats?.avgAssists?.toFixed(1) ?? '—';
  $: avgACS = stats?.avgACS ?? '—';
  $: hsRate = stats?.hsRate != null ? stats.hsRate + '%' : '—%';

  // Secondary stats
  $: kast = stats?.kast != null ? stats.kast + '%' : '—%';
  $: damageDeltaPerRound = stats?.damageDeltaPerRound != null ? (stats.damageDeltaPerRound > 0 ? '+' : '') + stats.damageDeltaPerRound : '—';
  $: kadRatio = stats?.kadRatio?.toFixed(2) ?? '—';
  $: killsPerRound = stats?.killsPerRound?.toFixed(2) ?? '—';
  $: firstBloods = stats?.firstBloods ?? '—';
  $: flawlessRounds = stats?.flawlessRounds ?? '—';
  $: aces = stats?.aces ?? '—';

  $: if (stats && canvasEl) {
    renderRadar();
  }

  onMount(() => {
    renderRadar();
  });

  onDestroy(() => {
    if (chartInstance) chartInstance.destroy();
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

    const ctx = canvasEl.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['K/D Ratio', 'KAST %', 'ACS', 'HS %', 'Damage Delta', 'First Bloods'],
        datasets: [{
          label: 'Combat Shape',
          data: [kdVal, kastVal, acsVal, hsVal, ddVal, fbVal],
          backgroundColor: 'rgba(250, 68, 84, 0.18)',
          borderColor: '#fa4454',
          borderWidth: 2,
          pointBackgroundColor: '#fa4454',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#fa4454',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                size: 10,
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
  <!-- 6 core stats cards -->
  <button class="card span-2 clickable visible" on:click={() => onStatClick('kd')}>
    <div class="card-accent-line"></div>
    <div class="card-label">K/D Ratio</div>
    <div class="card-val">{kd}</div>
    <div class="card-sub">Competitive</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('kills')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Kills</div>
    <div class="card-val">{avgKills}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('deaths')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Deaths</div>
    <div class="card-val">{avgDeaths}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('assists')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Assists</div>
    <div class="card-val">{avgAssists}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('acs')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg ACS</div>
    <div class="card-val">{avgACS}</div>
    <div class="card-sub">Combat Score</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('hs')}>
    <div class="card-accent-line"></div>
    <div class="card-label">HS Rate</div>
    <div class="card-val">{hsRate}</div>
    <div class="card-sub">Headshots</div>
  </button>

  <!-- Large Combat Shape Analysis card spanning 12 columns -->
  <div class="card span-12 visible combat-bento-card">
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
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#e8ff47; box-shadow: 0 0 8px #e8ff47;"></span>
            <span class="stat-title">KAST %</span>
          </div>
          <span class="stat-value">{kast}</span>
        </div>
        <!-- DDΔ/Round Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#3ecf8e; box-shadow: 0 0 8px #3ecf8e;"></span>
            <span class="stat-title">DDΔ/Round</span>
          </div>
          <span class="stat-value">{damageDeltaPerRound}</span>
        </div>
        <!-- KAD Ratio Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#60a5fa; box-shadow: 0 0 8px #60a5fa;"></span>
            <span class="stat-title">KAD Ratio</span>
          </div>
          <span class="stat-value">{kadRatio}</span>
        </div>
        <!-- Kills/Round Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#a78bfa; box-shadow: 0 0 8px #a78bfa;"></span>
            <span class="stat-title">Kills/Round</span>
          </div>
          <span class="stat-value">{killsPerRound}</span>
        </div>
        <!-- First Bloods Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#fb923c; box-shadow: 0 0 8px #fb923c;"></span>
            <span class="stat-title">First Bloods</span>
          </div>
          <span class="stat-value">{firstBloods}</span>
        </div>
        <!-- Flawless Rounds Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#f43f5e; box-shadow: 0 0 8px #f43f5e;"></span>
            <span class="stat-title">Flawless Rounds</span>
          </div>
          <span class="stat-value">{flawlessRounds}</span>
        </div>
        <!-- Aces Card -->
        <div class="combat-stat-item">
          <div class="stat-meta">
            <span class="stat-dot" style="background:#22c55e; box-shadow: 0 0 8px #22c55e;"></span>
            <span class="stat-title">Aces</span>
          </div>
          <span class="stat-value">{aces}</span>
        </div>
      </div>
    </div>
  </div>
{/if}



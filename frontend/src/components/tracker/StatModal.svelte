<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

  export let open = false;
  export let statKey = '';
  export let matches = [];
  export let onClose = () => {};

  let chartCanvas;
  let chartInstance = null;

  const STAT_CONFIG = {
    kd:     { label: 'K/D Ratio', color: '#e8ff47', fn: m => m.deaths ? +(m.kills/m.deaths).toFixed(2) : m.kills, fmt: v => v.toFixed(2), good: v => v >= 1.0 },
    kills:  { label: 'Kills',     color: '#3ecf8e', fn: m => m.kills,                               fmt: v => v,            good: v => v >= 15  },
    deaths: { label: 'Deaths',    color: '#ff5757', fn: m => m.deaths,                              fmt: v => v,            good: v => v <= 12  },
    assists:{ label: 'Assists',   color: '#60a5fa', fn: m => m.assists,                             fmt: v => v,            good: v => v >= 4   },
    acs:    { label: 'ACS',       color: '#a78bfa', fn: m => m.acs || Math.round((m.score||0) / Math.max(1, String(m.rounds||'1-1').split('-').reduce((a,b)=>Number(a)+Number(b),0))),  fmt: v => v,            good: v => v >= 200 },
    hs:     { label: 'HS %',      color: '#fb923c', fn: m => m.shots ? Math.round((m.hs/m.shots)*100) : 0, fmt: v => v+'%', good: v => v >= 20  },
  };

  $: cfg = STAT_CONFIG[statKey] || STAT_CONFIG.kd;
  $: values = matches.map(m => cfg.fn(m));
  $: avg = values.length ? values.reduce((s,v)=>s+v,0) / values.length : 0;
  $: max = values.length ? Math.max(...values) : 0;
  $: min = values.length ? Math.min(...values) : 0;
  $: last5avg = values.length ? values.slice(-5).reduce((s,v)=>s+v,0) / Math.min(5, values.length) : 0;
  $: trend = last5avg > avg ? '▲ Improving' : last5avg < avg - (avg*0.05) ? '▼ Declining' : '→ Stable';
  $: trendCol = last5avg > avg ? 'var(--win)' : last5avg < avg - (avg*0.05) ? 'var(--loss)' : 'var(--muted)';
  $: labels = matches.map((m, i) => {
    const ag = (m.agentName||'').substring(0,3).toUpperCase();
    return `#${i+1} ${ag}`;
  });
  $: barColors = values.map(v =>
    cfg.good(v) ? 'rgba(62,207,142,0.75)' : 'rgba(255,87,87,0.65)'
  );
  $: borderColors = values.map((v, i) =>
    i >= values.length - 5 ? cfg.color : 'transparent'
  );

  $: if (open && chartCanvas && values.length) {
    renderChart();
  }

  function renderChart() {
    if (!chartCanvas) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    const isMobile = window.innerWidth <= 600;
    chartInstance = new Chart(chartCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: cfg.label,
            data: values,
            backgroundColor: barColors,
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 3,
            borderSkipped: false,
          },
          {
            label: 'Average',
            data: values.map(() => +avg.toFixed(2)),
            type: 'line',
            borderColor: cfg.color,
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            fill: false,
            tension: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1f',
            borderColor: '#2a2a2f',
            borderWidth: 1,
            titleColor: '#888',
            bodyColor: '#f0f0f2',
            titleFont: { family: 'DM Mono', size: 9 },
            bodyFont: { family: 'Barlow Condensed', size: 15, weight: '700' },
            padding: 10,
            callbacks: {
              title: (items) => {
                const m = matches[items[0].dataIndex];
                return `${m.agentName} on ${m.map} · ${m.won?'WIN':'LOSS'}`;
              },
              label: (item) => {
                if (item.datasetIndex === 1) return `Avg: ${cfg.fmt(item.raw)}`;
                const m = matches[item.dataIndex];
                return `${cfg.label}: ${cfg.fmt(item.raw)}  |  K/D/A: ${m.kills}/${m.deaths}/${m.assists}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: !isMobile, color: 'rgba(255,255,255,0.04)' },
            ticks: {
              display: !isMobile,
              color: '#555',
              font: { family: 'DM Mono', size: 8 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 20
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: {
              color: '#666',
              font: { family: 'DM Mono', size: 9 },
              callback: v => cfg.fmt(v)
            },
            min: statKey === 'kd' ? 0 : undefined,
          }
        }
      }
    });
  }

  function handleClose() {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    onClose();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) handleClose();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (chartInstance) chartInstance.destroy();
  });
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="stat-modal-overlay" on:click={handleClose}>
    <div class="stat-modal" on:click|stopPropagation>
      <button class="stat-modal-close" on:click={handleClose}>✕</button>
      <div class="stat-modal-header">
        <div class="stat-modal-title" id="stat-modal-title">{cfg.label} — Per Match Trend</div>
        <div class="stat-modal-count">Based on <span>{matches.length}</span> matches</div>
      </div>
      <div class="stat-modal-avgs" id="stat-modal-avgs">
        <div class="stat-modal-avg">AVG <span>{cfg.fmt(+avg.toFixed(2))}</span></div>
        <div class="stat-modal-avg">BEST <span style="color:var(--win)">{cfg.fmt(max)}</span></div>
        <div class="stat-modal-avg">WORST <span style="color:var(--loss)">{cfg.fmt(min)}</span></div>
        <div class="stat-modal-avg">LAST 5 AVG <span>{cfg.fmt(+last5avg.toFixed(2))}</span></div>
        <div class="stat-modal-avg">TREND <span style="color:{trendCol}">{trend}</span></div>
      </div>
      <div class="stat-chart-wrap">
        <canvas bind:this={chartCanvas} id="stat-chart-canvas"></canvas>
      </div>
    </div>
  </div>
{/if}

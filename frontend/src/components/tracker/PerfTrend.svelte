<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';

  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

  export let matches = [];

  let canvas;
  let chart = null;

  $: hasData = matches && matches.length >= 2;

  $: if (hasData && canvas) {
    renderChart(matches);
  } else if (chart) {
    chart.destroy();
    chart = null;
  }

  onMount(() => {
    if (hasData) renderChart(matches);
  });

  onDestroy(() => {
    if (chart) { chart.destroy(); chart = null; }
  });

  function renderChart(data) {
    if (chart) { chart.destroy(); chart = null; }

    const isMobile = window.innerWidth <= 600;
    const reversed = data.slice().reverse(); // oldest → newest

    const labels = reversed.map((m, i) => {
      const ag = (m.agentName || '').substring(0, 3).toUpperCase();
      return `#${i + 1} ${ag}`;
    });

    const kdVals = reversed.map(m => m.deaths > 0 ? +(m.kills / m.deaths).toFixed(2) : m.kills);
    const acsVals = reversed.map(m => +(m.acs / 100).toFixed(2));
    const hsVals = reversed.map(m => +((m.hs / Math.max(1, m.shots)) * 100).toFixed(1));
    const hsScaled = hsVals.map(v => +(v / 10).toFixed(2));

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'K/D',
            data: kdVals,
            borderColor: '#e8ff47',
            backgroundColor: 'rgba(232,255,71,0.06)',
            borderWidth: 2,
            pointRadius: isMobile ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#e8ff47',
            tension: 0.35,
            fill: false,
          },
          {
            label: 'ACS/100',
            data: acsVals,
            borderColor: '#3ecf8e',
            backgroundColor: 'rgba(62,207,142,0.06)',
            borderWidth: 2,
            pointRadius: isMobile ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#3ecf8e',
            tension: 0.35,
            fill: false,
          },
          {
            label: 'HS%',
            data: hsScaled,
            borderColor: '#ff5757',
            backgroundColor: 'rgba(255,87,87,0.06)',
            borderWidth: 2,
            pointRadius: isMobile ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ff5757',
            tension: 0.35,
            fill: false,
            borderDash: [4, 3],
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1f',
            borderColor: '#2a2a2f',
            borderWidth: 1,
            titleColor: '#888',
            bodyColor: '#f0f0f2',
            titleFont: { family: 'DM Mono', size: 9 },
            bodyFont: { family: 'Barlow Condensed', size: 14, weight: '700' },
            padding: 10,
            callbacks: {
              title: (items) => {
                const m = reversed[items[0].dataIndex];
                return `${m.agentName} · ${m.map} · ${m.won ? 'WIN' : 'LOSS'}`;
              },
              label: (item) => {
                const m = reversed[item.dataIndex];
                if (item.datasetIndex === 0) return `K/D: ${item.raw}`;
                if (item.datasetIndex === 1) return `ACS: ${m.acs}`;
                return `HS%: ${hsVals[item.dataIndex]}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: !isMobile, color: 'rgba(255,255,255,0.04)' },
            ticks: { display: !isMobile, color: '#555', font: { family: 'DM Mono', size: 8 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#555', font: { family: 'DM Mono', size: 9 } },
            min: 0
          }
        }
      }
    });
  }
</script>

<div class="card span-12 visible" id="perf-trend-card" style="min-height:200px;">
  <div class="card-accent-line"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
    <div class="card-label" style="margin:0;">KD / ACS / HS% — Last 20 Matches</div>
    <div style="display:flex;gap:8px;">
      <div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:2px;background:#e8ff47;border-radius:1px;"></div><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">K/D</span></div>
      <div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:2px;background:#3ecf8e;border-radius:1px;"></div><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">ACS/100</span></div>
      <div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:2px;background:#ff5757;border-radius:1px;"></div><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">HS%</span></div>
    </div>
  </div>
  <div style="position:relative;height:160px;width:100%;">
    {#if hasData}
      <canvas bind:this={canvas}></canvas>
    {:else}
      <div class="placeholder-txt" id="perf-trend-placeholder">Fetch stats to see trend</div>
    {/if}
  </div>
</div>

<style>
</style>

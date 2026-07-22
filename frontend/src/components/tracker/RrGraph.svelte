<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
  import { RANKS, RANK_COLORS, getRankFromRR, getRankColor } from '../../lib/constants';

  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

  export let history = [];
  export let currentRR = 0;
  export let mmrHistory = {};

  let canvas;
  let chart = null;

  $: hasData = history && history.length > 0;

  $: if (hasData && canvas) {
    renderChart(history, currentRR, mmrHistory);
  } else if (chart) {
    chart.destroy();
    chart = null;
  }

  onMount(() => {
    if (hasData) renderChart(history, currentRR, mmrHistory);
  });

  onDestroy(() => {
    if (chart) { chart.destroy(); chart = null; }
  });

  function renderChart(hist, currentTotalRR, mmrHist) {
    if (chart) { chart.destroy(); chart = null; }

    const isMobile = window.innerWidth <= 600;
    const hasRealRR = hist.some(m => mmrHist[m.matchId] !== undefined);
    let totalRR = currentTotalRR || 600;
    const points = [];

    if (hasRealRR) {
      hist.forEach(m => {
        points.unshift(totalRR);
        const c = mmrHist[m.matchId];
        if (c !== undefined) totalRR -= c;
        else totalRR -= m.won ? 20 : -18;
        totalRR = Math.max(0, totalRR);
      });
    } else {
      hist.forEach(m => {
        points.unshift(totalRR);
        totalRR -= m.won ? 20 : -18;
        totalRR = Math.max(0, totalRR);
      });
    }

    const data = points;
    const colors = data.map(v => getRankColor(getRankFromRR(v).name));
    const rankLabels = data.map((v, i) => {
      const r = getRankFromRR(v);
      const rc = mmrHist[hist[i]?.matchId];
      return { rank: r.name, rr: v - r.rr, change: rc };
    });
    const labels = hist.map((_, i) => `G${i + 1}`);

    const rankZones = [];
    for (let i = 0; i < RANKS.length - 1; i++) {
      const t = RANKS[i].name.split(' ')[0];
      rankZones.push({ yMin: RANKS[i].rr, yMax: RANKS[i + 1].rr, color: RANK_COLORS[t] || '#fff', label: RANKS[i].name });
    }

    const minRR = Math.max(0, Math.min(...data) - 150);
    const maxRR = Math.max(...data) + 150;

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: 'rgba(232,255,71,0.9)',
          backgroundColor: 'rgba(232,255,71,0.04)',
          borderWidth: 2,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: isMobile ? 0 : 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141416',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#f0f0f2',
            bodyColor: '#f0f0f2',
            titleFont: { family: 'DM Mono', size: 9 },
            bodyFont: { family: 'Barlow Condensed', size: 16 },
            callbacks: {
              title: c => `Match ${c[0].label} · ${rankLabels[c[0].dataIndex]?.rank || ''}`,
              label: c => {
                const rl = rankLabels[c.dataIndex];
                const cs = rl?.change != null
                  ? (rl.change > 0 ? ` (+${rl.change})` : ` (${rl.change})`)
                  : '';
                return rl ? ` ${rl.rr} RR${cs}` : ` ${c.parsed.y} RR`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: !isMobile, color: 'rgba(255,255,255,0.03)' },
            ticks: { display: !isMobile, color: '#3a3a40', font: { family: 'DM Mono', size: 8 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: '#4a4a52',
              font: { family: 'DM Mono', size: isMobile ? 7 : 8 },
              callback: v => {
                const r = getRankFromRR(v);
                if (!r) return '';
                return isMobile ? r.name.split(' ')[0] : r.name;
              }
            },
            min: minRR,
            max: maxRR
          }
        }
      },
      plugins: [{
        id: 'rankBands',
        beforeDraw(chart) {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;
          rankZones.forEach(zone => {
            const yTop = scales.y.getPixelForValue(Math.min(zone.yMax, maxRR));
            const yBot = scales.y.getPixelForValue(Math.max(zone.yMin, minRR));
            if (yBot < chartArea.top || yTop > chartArea.bottom) return;
            ctx.save();
            ctx.fillStyle = zone.color + '12';
            ctx.fillRect(chartArea.left, Math.max(yTop, chartArea.top), chartArea.width, Math.min(yBot, chartArea.bottom) - Math.max(yTop, chartArea.top));
            if (!isMobile) {
              ctx.fillStyle = zone.color + '66';
              ctx.font = '8px DM Mono';
              ctx.fillText(zone.label, chartArea.left + 6, Math.min(yBot, chartArea.bottom) - 4);
            }
            ctx.restore();
          });
        }
      }]
    });
  }
</script>

<div class="card graph-card span-8 visible" id="rr-graph-card">
  <div class="card-accent-line"></div>
  <div class="card-label">RR Progression</div>
  <div class="graph-canvas-wrap">
    {#if hasData}
      <canvas bind:this={canvas}></canvas>
    {:else}
      <div class="placeholder-txt">Fetch stats to see RR graph</div>
    {/if}
  </div>
  {#if hasData}
    <div class="graph-note">
      {#if history.some(m => mmrHistory[m.matchId] !== undefined)}
        ✓ Real RR data from stored match history
      {:else}
        * Estimated from win/loss — stored history unavailable
      {/if}
    </div>
  {/if}
</div>

<style>
</style>

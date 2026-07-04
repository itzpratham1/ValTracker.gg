<script>
  export let wins = 0;
  export let losses = 0;
  export let totalKills = 0;
  export let matchCount = 0;
  export let agentMap = {};

  $: total = wins + losses;
  $: topKD = Object.entries(agentMap)
    .filter(([, s]) => s.matches >= 2)
    .sort((a, b) => (b[1].kills / (b[1].deaths || 1)) - (a[1].kills / (a[1].deaths || 1)))[0] || null;
  $: topWR = Object.entries(agentMap)
    .filter(([, s]) => s.matches >= 2)
    .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0] || null;
  $: estFB = Math.round(totalKills * 0.18);
  $: estMulti = Math.round(matchCount * 0.35);

  $: cards = [
    { icon: '💀', label: 'Total Kills', val: totalKills, sub: `${total} matches` },
    { icon: '🎯', label: 'Est. First Bloods', val: estFB, sub: '~18% of kills' },
    { icon: '⚡', label: 'Est. Multi-Kills', val: estMulti, sub: '3K+ rounds' },
    { icon: '🏆', label: 'Wins', val: wins, sub: `${total} total` },
    { icon: '🔫', label: 'Best K/D Agent', val: topKD ? (topKD[1].kills / (topKD[1].deaths || 1)).toFixed(2) : '—', sub: topKD ? topKD[0] : 'Play more' },
    { icon: '👑', label: 'Best WR Agent', val: topWR ? Math.round((topWR[1].wins / topWR[1].matches) * 100) + '%' : '—', sub: topWR ? topWR[0] : 'Play more' },
  ];
</script>

<div class="clutch-grid">
  {#each cards as c, i}
    <div class="impact-bento" style="animation-delay:{i * 60}ms">
      <div class="impact-icon">{c.icon}</div>
      <div class="impact-label">{c.label}</div>
      <div class="impact-val">{c.val}</div>
      <div class="impact-sub">{c.sub}</div>
    </div>
  {/each}
</div>

<style>
</style>

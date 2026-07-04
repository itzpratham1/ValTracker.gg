<script>
  export let stats = null;
  export let onStatClick = (key) => {};

  $: kd = stats?.kd?.toFixed(2) ?? '—';
  $: avgKills = stats?.avgKills?.toFixed(1) ?? '—';
  $: avgDeaths = stats?.avgDeaths?.toFixed(1) ?? '—';
  $: avgAssists = stats?.avgAssists?.toFixed(1) ?? '—';
  $: avgACS = stats?.avgACS ?? '—';
  $: hsRate = stats?.hsRate != null ? stats.hsRate + '%' : '—%';
</script>

{#if stats}
  <button class="card span-2 clickable" on:click={() => onStatClick('kd')}>
    <div class="card-accent-line"></div>
    <div class="card-label">K/D Ratio</div>
    <div class="card-val">{kd}</div>
    <div class="card-sub">Competitive</div>
  </button>
  <button class="card span-2 clickable" on:click={() => onStatClick('kills')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Kills</div>
    <div class="card-val">{avgKills}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable" on:click={() => onStatClick('deaths')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Deaths</div>
    <div class="card-val">{avgDeaths}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable" on:click={() => onStatClick('assists')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg Assists</div>
    <div class="card-val">{avgAssists}</div>
    <div class="card-sub">Per match</div>
  </button>
  <button class="card span-2 clickable" on:click={() => onStatClick('acs')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Avg ACS</div>
    <div class="card-val">{avgACS}</div>
    <div class="card-sub">Combat Score</div>
  </button>
  <button class="card span-2 clickable" on:click={() => onStatClick('hs')}>
    <div class="card-accent-line"></div>
    <div class="card-label">HS Rate</div>
    <div class="card-val">{hsRate}</div>
    <div class="card-sub">Headshots</div>
  </button>
{/if}

<script>
  export let stats = null;
  export let onStatClick = (key) => {};

  $: kd = stats?.kd?.toFixed(2) ?? '—';
  $: avgKills = stats?.avgKills?.toFixed(1) ?? '—';
  $: avgDeaths = stats?.avgDeaths?.toFixed(1) ?? '—';
  $: avgAssists = stats?.avgAssists?.toFixed(1) ?? '—';
  $: avgACS = stats?.avgACS ?? '—';
  $: hsRate = stats?.hsRate != null ? stats.hsRate + '%' : '—%';

  // New stats
  $: kast = stats?.kast != null ? stats.kast + '%' : '—%';
  $: damageDeltaPerRound = stats?.damageDeltaPerRound != null ? (stats.damageDeltaPerRound > 0 ? '+' : '') + stats.damageDeltaPerRound : '—';
  $: kadRatio = stats?.kadRatio?.toFixed(2) ?? '—';
  $: killsPerRound = stats?.killsPerRound?.toFixed(2) ?? '—';
  $: firstBloods = stats?.firstBloods ?? '—';
  $: flawlessRounds = stats?.flawlessRounds ?? '—';
  $: aces = stats?.aces ?? '—';
</script>

{#if stats}
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

  <!-- New 7 bento stats cards -->
  <button class="card span-2 clickable visible" on:click={() => onStatClick('kast')}>
    <div class="card-accent-line"></div>
    <div class="card-label">KAST</div>
    <div class="card-val">{kast}</div>
    <div class="card-sub">Rounds</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('dd')}>
    <div class="card-accent-line"></div>
    <div class="card-label">DDΔ/Round</div>
    <div class="card-val">{damageDeltaPerRound}</div>
    <div class="card-sub">Damage Delta</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('kad')}>
    <div class="card-accent-line"></div>
    <div class="card-label">KAD Ratio</div>
    <div class="card-val">{kadRatio}</div>
    <div class="card-sub">Ratio</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('killsPerRound')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Kills/Round</div>
    <div class="card-val">{killsPerRound}</div>
    <div class="card-sub">Avg Kills</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('firstBloods')}>
    <div class="card-accent-line"></div>
    <div class="card-label">First Bloods</div>
    <div class="card-val">{firstBloods}</div>
    <div class="card-sub">Opening Kills</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('flawless')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Flawless</div>
    <div class="card-val">{flawlessRounds}</div>
    <div class="card-sub">Perfect Rounds</div>
  </button>
  <button class="card span-2 clickable visible" on:click={() => onStatClick('aces')}>
    <div class="card-accent-line"></div>
    <div class="card-label">Aces</div>
    <div class="card-val">{aces}</div>
    <div class="card-sub">5-Kill Rounds</div>
  </button>
{/if}


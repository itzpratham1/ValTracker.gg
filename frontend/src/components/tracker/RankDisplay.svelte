<script>
  import { getRankImgUrl, RANK_COLORS, ACTS_TIMELINE, SEASONS_MAP } from '../../lib/constants';
  import { player } from '../../lib/appStore';
  import { getRankPrediction } from '../../lib/processMatches';

  export let mmrData = null;
  export let stats = null;
  export let mmrHistory = {};

  $: selectedAct = $player.act;
  $: isCurrentOrAll = selectedAct === 'all' || selectedAct === 'v26a4';

  $: displayRank = getDisplayRank(mmrData, selectedAct);
  $: rankImg = getRankImgUrl(displayRank.name);
  $: rankColor = RANK_COLORS[displayRank.name?.split(' ')[0]] || '#fff';
  $: currentRR = mmrData?.current?.rr ?? 0;
  $: peakName = mmrData?.peak?.tier?.name || '—';
  $: peakImg = getRankImgUrl(peakName);

  $: prediction = stats && isCurrentOrAll
    ? getRankPrediction(
        stats.recentMatches.map(m => ({ metadata: { matchid: m.matchId } })),
        $player.name,
        $player.tag,
        mmrHistory,
        mmrData?.current?.rr ?? 0
      )
    : null;

  function getDisplayRank(mmr, act) {
    if (!mmr) return { name: 'UNRANKED', rr: 0 };
    if (act === 'all' || act === 'v26a4') {
      return {
        name: mmr.current?.tier?.name || 'UNRANKED',
        rr: mmr.current?.rr ?? 0
      };
    }
    const apiSeason = SEASONS_MAP[act];
    const seasonData = mmr.by_season?.[apiSeason];
    if (seasonData && !seasonData.error) {
      return {
        name: seasonData.final_rank_patched || 'UNRANKED',
        rr: 0
      };
    }
    return { name: 'UNRANKED', rr: 0 };
  }
</script>

<div class="rank-display-card">
  <div class="card-accent-line"></div>
  <div class="rd-header">
    <div class="rd-icon">
      {#if rankImg}
        <img src={rankImg} alt={displayRank.name}>
      {:else}
        <div class="rd-icon-placeholder"></div>
      {/if}
    </div>
    <div class="rd-info">
      <div class="rd-name" style="color: {rankColor}">{displayRank.name.toUpperCase()}</div>
      {#if isCurrentOrAll && mmrData}
        <div class="rd-rr">
          {#if peakImg}
            <img class="rd-peak-icon" src={peakImg} alt={peakName}>
          {/if}
          {currentRR} RR · Peak: {peakName}
        </div>
      {:else}
        <div class="rd-rr">Season Concluded</div>
      {/if}
    </div>
  </div>

  {#if prediction}
    <div class="rd-prediction">{prediction}</div>
  {/if}
</div>

<style>
  .rank-display-card {
    background: rgba(18, 18, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .rd-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .rd-icon {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }

  .rd-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5));
  }

  .rd-icon-placeholder {
    width: 100%;
    height: 100%;
    background: var(--surface2);
    border-radius: 8px;
  }

  .rd-info {
    min-width: 0;
  }

  .rd-name {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 1.5px;
    line-height: 1.1;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .rd-rr {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.5px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .rd-peak-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .rd-prediction {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--accent);
    letter-spacing: 0.5px;
    line-height: 1.5;
  }
</style>

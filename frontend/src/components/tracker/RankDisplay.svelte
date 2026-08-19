<script>
  import { getRankImgUrl, RANK_COLORS, ACTS_TIMELINE, SEASONS_MAP, isCurrentAct, RANKS } from '../../lib/constants';
  import { player } from '../../lib/appStore';
  import { getRankPrediction } from '../../lib/processMatches';

  export let mmrData = null;
  export let stats = null;
  export let mmrHistory = {};

  $: selectedAct = $player.act;
  $: isCurrentOrAll = isCurrentAct(selectedAct);

  $: displayRank = getDisplayRank(mmrData, selectedAct, stats, $player.name, $player.tag);
  $: rankImg = getRankImgUrl(displayRank.name);
  $: rankColor = RANK_COLORS[displayRank.name?.split(' ')[0]] || '#fff';
  $: currentRR = displayRank.rr;
  $: peakName = mmrData?.peak?.tier?.name || mmrData?.highest_rank?.patched_tier || '—';
  $: peakImg = getRankImgUrl(peakName);
  $: peakRR = mmrData?.peak?.rr ?? mmrData?.peak?.ranking_in_tier ?? mmrData?.highest_rank?.rr ?? null;

  $: prediction = stats && isCurrentOrAll
    ? getRankPrediction(
        stats.recentMatches.map(m => ({ metadata: { matchid: m.matchId } })),
        $player.name,
        $player.tag,
        mmrHistory,
        currentRR
      )
    : null;

  function extractRankFromMmr(mmr) {
    if (!mmr) return null;
    const name = mmr.current?.tier?.name || 
                 mmr.current_data?.currenttierpatched || 
                 mmr.currenttierpatched || 
                 mmr.data?.current?.tier?.name || 
                 mmr.data?.current_data?.currenttierpatched || null;
    const rr = mmr.current?.rr ?? 
               mmr.current_data?.ranking_in_tier ?? 
               mmr.ranking_in_tier ?? 
               mmr.data?.current?.rr ?? 0;
    if (name && name.toUpperCase() !== 'UNRANKED') {
      return { name, rr };
    }
    return null;
  }

  function getDisplayRank(mmr, act, currentStats, pName = '', pTag = '') {
    const mmrRank = extractRankFromMmr(mmr);
    const hasPlayed = (currentStats?.matchesCount > 0);

    if (act === 'all') {
      return mmrRank || { name: 'UNRANKED', rr: 0 };
    }
    if (isCurrentAct(act)) {
      const hasPlayedCurrent = hasPlayed || 
        (mmr?.by_season?.[SEASONS_MAP[act]] && mmr.by_season[SEASONS_MAP[act]].number_of_games > 0);
      if (!hasPlayedCurrent) {
        return { name: 'UNRANKED', rr: 0 };
      }
      return mmrRank || { name: 'UNRANKED', rr: 0 };
    }
    const apiSeason = SEASONS_MAP[act] || act;
    const seasonData = mmr?.by_season?.[apiSeason];
    if (seasonData && !seasonData.error && seasonData.final_rank_patched) {
      return {
        name: seasonData.final_rank_patched,
        rr: 0
      };
    }
    if (hasPlayed) {
      return mmrRank || { name: 'UNRANKED', rr: 0 };
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
      <div class="rd-name" style="color: {rankColor}">
        {displayRank.name.toUpperCase()}
        {#if displayRank.name !== 'UNRANKED' && isCurrentOrAll && mmrData}
          <span class="rd-current-rr">· {currentRR} RR</span>
        {/if}
      </div>
      {#if isCurrentOrAll && mmrData}
        <div class="rd-rr">
          Peak: {peakName}{#if peakRR !== null && peakRR !== undefined && peakRR > 0} ({peakRR} RR){/if}
          {#if peakImg}
            <img class="rd-peak-icon" src={peakImg} alt={peakName} style="margin-left: 2px;">
          {/if}
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
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rd-current-rr {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.5px;
    text-shadow: none;
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

<script>
  import { player } from '../../lib/appStore';
  import { getRankImgUrl, getRankFromRR, ACTS_TIMELINE } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  export let mmrData = null;
  export let accountData = null;
  export let matches = [];

  $: rankName = mmrData?.current?.tier?.name || 'UNRANKED';
  $: rankImg = getRankImgUrl(rankName);
  $: currentRR = mmrData?.current?.rr ?? 0;
  $: peakName = mmrData?.peak?.tier?.name || '—';
  $: peakImg = getRankImgUrl(peakName);
  $: tierId = mmrData?.current?.tier?.id ?? 0;
  $: playerName = $player.name || '—';
  $: playerTag = $player.tag || '';
  $: modeLabel = { competitive:'Competitive', unrated:'Unrated', deathmatch:'Deathmatch', teamdeathmatch:'Team Deathmatch', swiftplay:'Swiftplay', spikerush:'Spike Rush' }[$player.mode] || $player.mode;

  $: accountLevel = accountData?.data?.account_level || '—';
  $: cardUrl = accountData?.data?.card?.wide || accountData?.data?.card?.large || null;
  $: smallCardUrl = accountData?.data?.card?.small || null;

  $: isRanked = $player.mode === 'competitive';

  $: streak = computeStreak(matches);

  function computeStreak(allMatches) {
    if (!allMatches || !allMatches.length) return { count: 0, type: null };
    const first = allMatches[0];
    const me0 = first.players?.all_players?.find(p =>
      p.name?.toLowerCase() === $player.name?.toLowerCase() &&
      p.tag?.toLowerCase() === $player.tag?.toLowerCase()
    ) || first.players?.[0];
    if (!me0) return { count: 0, type: null };
    const firstWon = first.teams?.[me0.team?.toLowerCase()]?.has_won || false;
    let count = 1;
    for (let i = 1; i < allMatches.length; i++) {
      const me = allMatches[i].players?.all_players?.find(p =>
        p.name?.toLowerCase() === $player.name?.toLowerCase() &&
        p.tag?.toLowerCase() === $player.tag?.toLowerCase()
      ) || allMatches[i].players?.[0];
      if (!me) break;
      const won = allMatches[i].teams?.[me.team?.toLowerCase()]?.has_won || false;
      if (won === firstWon) count++;
      else break;
    }
    return { count, type: firstWon ? 'win' : 'loss' };
  }

  $: splitName = splitPlayerName(playerName);

  function splitPlayerName(name) {
    if (!name || name === '—') return { base: '—', suffix: '' };
    const match = name.match(/^([A-Za-z0-9_\-]+)(.*)$/);
    return {
      base: match ? match[1] : name,
      suffix: match ? match[2] : ''
    };
  }
</script>

<section class="hero-section">
  {#if cardUrl}
    <div class="hero-card-bg" style="background-image: url('{cardUrl}')"></div>
  {/if}

  <div class="hero-content">
    <div class="hero-left">
      <div class="hero-avatar-wrap">
        {#if smallCardUrl}
          <img class="hero-avatar-img" src={smallCardUrl} alt={playerName}>
        {:else}
          <div class="hero-avatar-fallback">👤</div>
        {/if}
      </div>
      <div class="hero-player-details">
        <div class="hero-eyebrow">{modeLabel} Tracker</div>
        <div class="hero-title">
          {escapeHtml(splitName.base)}{#if splitName.suffix}<span class="dim">{escapeHtml(splitName.suffix)}</span>{/if}
        </div>
        <div class="hero-sub">
          <span class="hero-tag">#{escapeHtml(playerTag)}</span>
          <span class="hero-level">LVL {accountLevel}</span>
        </div>
      </div>
    </div>

    <div class="hero-right">
      {#if isRanked}
        <div class="hero-rank-block">
          <div class="hero-rank-icon">
            {#if rankImg}
              <img src={rankImg} alt={rankName}>
            {:else}
              <div class="rank-placeholder"></div>
            {/if}
          </div>
          <div class="hero-rank-info">
            <div class="hero-rank-name">{rankName.toUpperCase()}</div>
            <div class="hero-rank-rr">
              {#if peakImg}
                <img class="hero-peak-icon" src={peakImg} alt={peakName}>
              {/if}
              {currentRR} RR · Peak: {peakName}
            </div>
          </div>
        </div>
      {/if}

      {#if streak.count >= 2}
        <div class="hero-streak" class:win-streak={streak.type === 'win'} class:loss-streak={streak.type === 'loss'}>
          <span class="streak-icon">
            {#if streak.type === 'win'}
              {streak.count >= 5 ? '🔥' : '✅'}
            {:else}
              {streak.count >= 5 ? '💀' : '❌'}
            {/if}
          </span>
          <div class="streak-info">
            <div class="streak-label">Current Streak</div>
            <div class="streak-val">
              {streak.count}{streak.type === 'win' ? 'W' : 'L'} Streak
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .hero-section {
    position: relative;
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
  }

  .hero-card-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0.26;
    pointer-events: none;
    transition: opacity 0.5s;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .hero-avatar-wrap {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.08);
  }

  .hero-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-avatar-fallback {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.4);
  }

  .hero-player-details {
    min-width: 0;
  }

  .hero-eyebrow {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted);
    margin-bottom: 2px;
  }

  .hero-title {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 28px;
    color: #fff;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hero-title :global(.dim) {
    color: var(--muted);
  }

  .hero-sub {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 2px;
  }

  .hero-tag {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.5px;
  }

  .hero-level {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .hero-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  .hero-rank-block {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hero-rank-icon {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }

  .hero-rank-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .rank-placeholder {
    width: 100%;
    height: 100%;
    background: var(--surface2);
    border-radius: 8px;
  }

  .hero-rank-info {
    min-width: 0;
  }

  .hero-rank-name {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #fff;
    letter-spacing: 1px;
  }

  .hero-rank-rr {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hero-peak-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .hero-streak {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
  }

  .streak-icon {
    font-size: 18px;
  }

  .streak-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
  }

  .streak-val {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: #fff;
  }

  .win-streak {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.06);
  }

  .win-streak .streak-val {
    color: var(--win);
  }

  .loss-streak {
    border-color: rgba(244, 63, 94, 0.3);
    background: rgba(244, 63, 94, 0.06);
  }

  .loss-streak .streak-val {
    color: var(--loss);
  }

  @media (max-width: 768px) {
    .hero-content {
      flex-direction: column;
      align-items: flex-start;
    }
    .hero-right {
      width: 100%;
      flex-wrap: wrap;
    }
    .hero-title {
      font-size: 22px;
    }
    .hero-avatar-wrap {
      width: 44px;
      height: 44px;
    }
  }
</style>

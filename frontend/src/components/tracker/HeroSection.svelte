<script>
  import { player } from '../../lib/appStore';
  import { getRankImgUrl, getRankFromRR } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  export let mmrData = null;
  export let accountData = null;
  export let matches = [];

  $: rankName = mmrData?.current?.tier?.name || 'UNRANKED';
  $: rankImg = getRankImgUrl(rankName);
  $: currentRR = mmrData?.current?.rr ?? 0;
  $: peakName = mmrData?.peak?.tier?.name || '—';
  $: peakImg = getRankImgUrl(peakName);
  $: playerName = $player.name || '—';
  $: playerTag = $player.tag || '';
  $: modeLabel = { competitive:'Competitive', unrated:'Unrated', deathmatch:'Deathmatch', teamdeathmatch:'Team Deathmatch', swiftplay:'Swiftplay', spikerush:'Spike Rush' }[$player.mode] || $player.mode;

  $: accountLevel = accountData?.account_level || '—';
  $: cardId = (typeof accountData?.card === 'string') ? accountData.card : (accountData?.card?.id || null);
  $: cardUrl = accountData?.card?.wide || accountData?.card?.large || (cardId ? `https://media.valorant-api.com/playercards/${cardId}/wideart.png` : null);
  $: smallCardUrl = accountData?.card?.small || (cardId ? `https://media.valorant-api.com/playercards/${cardId}/smallart.png` : null);

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

<div class="hero">
  <div id="player-card-bg" style="background-image: url('{cardUrl || ''}'); opacity: {cardUrl ? 0.26 : 0};"></div>
  <div class="hero-content">
    <div class="hero-left">
      <div class="hero-avatar-wrap">
        {#if smallCardUrl}
          <img class="player-avatar-img" src={smallCardUrl} alt={playerName}>
        {:else}
          <div class="hero-avatar-fallback">👤</div>
        {/if}
      </div>
      <div class="hero-player-details">
        <div class="hero-eyebrow" id="hero-eyebrow">{modeLabel} Tracker</div>
        <div class="hero-title" id="hero-title">
          {escapeHtml(splitName.base)}{#if splitName.suffix}<span class="dim">{escapeHtml(splitName.suffix)}</span>{/if}
        </div>
        <div class="hero-sub" id="hero-sub">
          <span class="hero-tag" id="player-tag-display">#{escapeHtml(playerTag)}</span>
          <span class="hero-level-badge-new" id="player-level">LVL {accountLevel}</span>
        </div>
      </div>
    </div>

    <div class="hero-right">
      {#if isRanked}
        <div class="hero-rank-block">
          <div id="rank-icon">
            {#if rankImg}
              <img class="hero-rank-img" src={rankImg} alt={rankName}>
            {:else}
              <div style="width:56px;height:56px;background:var(--surface2);border-radius:8px;"></div>
            {/if}
          </div>
          <div class="hero-rank-info">
            <div class="hero-rank-name" id="rank-display">{rankName}</div>
            <div class="hero-rank-rr">
              <span id="peak-icon">
                {#if peakImg}
                  <img style="width:16px;height:16px;object-fit:contain;" src={peakImg} alt={peakName}>
                {/if}
              </span>
              <span id="rank-rr-txt">{currentRR} RR · Peak: {peakName}</span>
            </div>
          </div>
        </div>
      {/if}

      {#if streak.count >= 2}
        <div class="hero-streak-block" id="streak-block">
          <div class="streak-icon" id="streak-icon">
            {#if streak.type === 'win'}
              {streak.count >= 5 ? '🔥' : '✅'}
            {:else}
              {streak.count >= 5 ? '💀' : '❌'}
            {/if}
          </div>
          <div class="streak-info">
            <div class="streak-label">Current Streak</div>
            <div class="streak-val" id="streak-val">
              {streak.count}{streak.type === 'win' ? 'W' : 'L'} Streak
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

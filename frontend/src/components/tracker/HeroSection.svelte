<script>
  import { createEventDispatcher } from 'svelte';
  import { player } from '../../lib/appStore';
  import { getRankImgUrl, getRankFromRR } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';
  import { isWrappedSeasonActive } from '../../lib/wrappedEngine';

  const dispatch = createEventDispatcher();

  export let mmrData = null;
  export let accountData = null;
  export let matches = [];

  let copied = false;

  $: isWrappedActive = isWrappedSeasonActive(matches, $player.act);

  $: rankName = mmrData?.current?.tier?.name || 'UNRANKED';
  $: rankImg = getRankImgUrl(rankName);
  $: currentRR = mmrData?.current?.rr ?? 0;
  $: peakName = mmrData?.peak?.tier?.name || '—';
  $: peakImg = getRankImgUrl(peakName);
  $: peakRR = mmrData?.peak?.rr ?? mmrData?.peak?.ranking_in_tier ?? mmrData?.highest_rank?.rr ?? null;
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

  function copyRiotId() {
    const riotId = `${playerName}#${playerTag}`;
    navigator.clipboard.writeText(riotId).then(() => {
      copied = true;
      if (window.showToast) window.showToast(`Copied ${riotId}`, 'copy');
      setTimeout(() => { copied = false; }, 2000);
    }).catch(() => {
      if (window.showToast) window.showToast('Copy failed', 'error');
    });
  }

  function copyShareLink() {
    const url = `${window.location.origin}/app?name=${encodeURIComponent(playerName)}&tag=${encodeURIComponent(playerTag)}&region=${encodeURIComponent($player.region || 'ap')}&mode=${encodeURIComponent($player.mode || 'competitive')}`;
    navigator.clipboard.writeText(url).then(() => {
      if (window.showToast) window.showToast('Share link copied!', 'copy');
    }).catch(() => {
      if (window.showToast) window.showToast('Copy failed', 'error');
    });
  }
</script>

<div class="hero" data-tour="hero-overview">
  <div id="player-card-bg" style="background-image: url('{cardUrl || ''}'); opacity: {cardUrl ? 0.42 : 0}; filter: saturate(1.3) brightness(0.72);"></div>
  <div class="hero-content">
    <div class="hero-left">
      <div
        class="story-avatar-outer-ring"
        class:active={isWrappedActive}
        on:click={() => { if (isWrappedActive) dispatch('openWrapped'); }}
        title={isWrappedActive ? 'Click to view Wrapped Story ⚡' : playerName}
        role={isWrappedActive ? 'button' : undefined}
        tabindex={isWrappedActive ? 0 : undefined}
      >
        <div class="hero-avatar-wrap">
          {#if smallCardUrl}
            <img class="player-avatar-img" src={smallCardUrl} alt={playerName}>
          {:else}
            <div class="hero-avatar-fallback">👤</div>
          {/if}
        </div>
        {#if isWrappedActive}
          <div class="story-avatar-badge">⚡ WRAPPED</div>
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
          <!-- Copy Riot ID button -->
          {#if playerName && playerName !== '—'}
            <button
              class="copy-id-btn"
              class:copied
              on:click={copyRiotId}
              title={copied ? 'Copied!' : `Copy ${playerName}#${playerTag}`}
              aria-label="Copy Riot ID"
            >
              {#if copied}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {:else}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              {/if}
            </button>
          {/if}
          <!-- Share link copy button -->
          {#if playerName && playerName !== '—'}
            <button
              class="copy-id-btn"
              on:click={copyShareLink}
              title="Copy share link"
              aria-label="Copy share link"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="hero-right">
      {#if isRanked}
        <div class="hero-rank-block">
          <div id="rank-icon" class="hero-rank-icon-wrap">
            {#if rankImg}
              <img class="hero-rank-img" src={rankImg} alt={rankName}>
            {:else}
              <div style="width:56px;height:56px;background:var(--surface2);border-radius:8px;"></div>
            {/if}
          </div>
          <div class="hero-rank-info">
            <div class="hero-rank-name" id="rank-display">
              {rankName}
              {#if rankName !== 'UNRANKED'}
                <span class="hero-current-rr">· {currentRR} RR</span>
              {/if}
            </div>
            {#if rankName !== 'UNRANKED'}
              <div class="hero-rr-progress-bar-wrap" title="{currentRR} / 100 RR to next rank">
                <div class="hero-rr-progress-bar">
                  <div class="hero-rr-progress-fill" style="width: {Math.min(currentRR, 100)}%"></div>
                </div>
                <span class="hero-rr-progress-label">{currentRR} / 100 RR</span>
              </div>
            {/if}
            <div class="hero-rank-rr">
              <span id="rank-rr-txt">
                Peak: {peakName}{#if peakRR !== null && peakRR !== undefined && peakRR > 0} ({peakRR} RR){/if}
              </span>
              <span id="peak-icon">
                {#if peakImg}
                  <img style="width:16px;height:16px;object-fit:contain;margin-left:2px;" src={peakImg} alt={peakName}>
                {/if}
              </span>
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

<style>
  /* ── Hero entrance animations ── */
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rankPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(250,68,84,0.45)); }
    50%       { filter: drop-shadow(0 0 22px rgba(250,68,84,0.85)); }
  }
  @keyframes rrFill {
    from { width: 0%; }
  }

  /* Apply entrance animations */
  :global(.tracker-layout) .hero-left {
    animation: heroFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both;
  }
  :global(.tracker-layout) .hero-right {
    animation: heroFadeUp 0.55s 0.15s cubic-bezier(0.16,1,0.3,1) both;
  }

  /* Rank icon pulse */
  .hero-rank-icon-wrap {
    animation: rankPulse 3s ease-in-out infinite;
  }
  .hero-rank-block:hover .hero-rank-icon-wrap {
    animation: none;
    filter: drop-shadow(0 0 28px rgba(250,68,84,1));
    transition: filter 0.2s;
  }

  /* RR Progress bar */
  .hero-rr-progress-bar-wrap {
    margin-top: 6px;
    margin-bottom: 2px;
  }
  .hero-rr-progress-bar {
    width: 160px;
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 4px;
    overflow: hidden;
  }
  .hero-rr-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff5757, var(--accent, #fa4454));
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(250,68,84,0.5);
    animation: rrFill 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both;
  }
  .hero-rr-progress-label {
    font-size: 10px;
    color: var(--muted, #71717a);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.3px;
    margin-top: 3px;
    display: block;
  }

  .story-avatar-outer-ring {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    padding: 3px;
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .story-avatar-outer-ring.active {
    cursor: pointer;
    background: linear-gradient(135deg, #fa4454, #ff007f, #e8ff47, #00f2fe, #fa4454);
    background-size: 300% 300%;
    animation: storyRingGlow 4s linear infinite;
    box-shadow: 0 0 24px rgba(250, 68, 84, 0.65), inset 0 0 10px rgba(232, 255, 71, 0.4);
  }

  .story-avatar-outer-ring.active:hover {
    transform: scale(1.08) rotate(1.5deg);
  }

  .story-avatar-badge {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #fa4454, #ff007f);
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 10px;
    letter-spacing: 0.8px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.4);
    z-index: 10;
    pointer-events: none;
  }

  @keyframes storyRingGlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>

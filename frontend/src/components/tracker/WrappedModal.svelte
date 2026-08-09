<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { generateWrappedData } from '../../lib/wrappedEngine';
  import {
    getRankImgUrl,
    getLargeRankImgUrl,
    AGENT_UUIDS,
    MAP_IMAGES_FALLBACK,
    getAgentFullPortraitUrl,
    getAgentBackgroundUrl,
    getAgentIconUrl,
    AGENT_THEME_COLORS
  } from '../../lib/constants';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';
  export let mmrData = null;
  export let accountData = null;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  $: data = generateWrappedData(matches, playerName, playerTag, mmrData, accountData);
  $: rankImg = getRankImgUrl(data.rankName);
  $: rankLargeImg = getLargeRankImgUrl(data.rankName);
  
  $: agentPortraitUrl = getAgentFullPortraitUrl(data.topAgent);
  $: agentBgUrl = getAgentBackgroundUrl(data.topAgent);
  $: agentIconUrl = getAgentIconUrl(data.topAgent);
  
  $: victimPortraitUrl = getAgentFullPortraitUrl(data.topVictimAgent);
  $: victimIconUrl = getAgentIconUrl(data.topVictimAgent);

  $: mapSplashUrl = MAP_IMAGES_FALLBACK[data.topMap] || MAP_IMAGES_FALLBACK['Ascent'];

  $: agentTheme = AGENT_THEME_COLORS[data.topAgent?.toLowerCase()] || { primary: '#fa4454', accent: '#e8ff47' };
  $: victimTheme = AGENT_THEME_COLORS[data.topVictimAgent?.toLowerCase()] || { primary: '#ff5757', accent: '#ff8c00' };

  let currentSlide = 0;
  const TOTAL_SLIDES = 7;
  let isPaused = false;
  let progress = 0;
  let progressTimer = null;
  let copied = false;
  let isExporting = false;
  let slideKey = 0; // force re-animation on slide change

  $: if (isOpen) {
    currentSlide = 0;
    slideKey = 0;
    startSlideTimer();
  } else {
    clearTimers();
  }

  function clearTimers() {
    if (progressTimer) clearInterval(progressTimer);
  }

  function startSlideTimer() {
    clearTimers();
    if (isPaused || currentSlide >= TOTAL_SLIDES - 1) return;

    progress = 0;
    const interval = 50;
    const duration = 6000;
    const step = (interval / duration) * 100;

    progressTimer = setInterval(() => {
      if (!isPaused) {
        progress += step;
        if (progress >= 100) {
          nextSlide();
        }
      }
    }, interval);
  }

  function nextSlide() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      currentSlide++;
      slideKey++;
      startSlideTimer();
    } else {
      clearTimers();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      slideKey++;
      startSlideTimer();
    }
  }

  function closeModal() {
    clearTimers();
    dispatch('close');
  }

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }

  function handleStoryContainerClick(e) {
    if (!e || !e.currentTarget) return;
    if (e.target && e.target.closest('button, .share-flex-btn, .story-close-btn, a')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;

    if (ratio < 0.35) {
      prevSlide();
    } else {
      nextSlide();
    }
  }

  async function shareStory(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();

    const shareUrl = `${window.location.origin}/app?name=${encodeURIComponent(playerName)}&tag=${encodeURIComponent(playerTag)}&wrapped=1`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
        if (window.showToast) window.showToast('Wrapped Share Link Copied to Clipboard!', 'copy');
        else alert('Wrapped Share Link Copied to Clipboard!\n' + shareUrl);
        setTimeout(() => copied = false, 3000);
        return;
      }
    } catch (err) {}

    try {
      const input = document.createElement('textarea');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copied = true;
      if (window.showToast) window.showToast('Wrapped Share Link Copied to Clipboard!', 'copy');
      else alert('Wrapped Share Link Copied!\n' + shareUrl);
      setTimeout(() => copied = false, 3000);
      return;
    } catch(err) {}

    window.prompt('Copy your Wrapped Story Link:', shareUrl);
  }

  async function generateCanvasStoryPng(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();

    isExporting = true;
    if (window.showToast) window.showToast('Generating PNG Story Image...', 'info');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#080812';
        ctx.fillRect(0, 0, 1080, 1920);

        const grad = ctx.createLinearGradient(0, 0, 1080, 0);
        grad.addColorStop(0, '#fa4454');
        grad.addColorStop(1, '#ff007f');
        ctx.fillStyle = grad;
        ctx.fillRect(60, 80, 960, 160);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px sans-serif';
        ctx.fillText('⚡ VALTRACKER WRAPPED', 100, 170);

        ctx.font = '800 36px sans-serif';
        ctx.fillStyle = '#e8ff47';
        ctx.fillText((data.periodTitle || 'VALORANT RECAP').toUpperCase(), 100, 215);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(60, 280, 960, 240);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 72px sans-serif';
        ctx.fillText(`${data.playerName} #${data.playerTag}`, 100, 390);

        ctx.fillStyle = '#ffd700';
        ctx.font = '800 44px sans-serif';
        ctx.fillText(`Rank: ${data.rankName} | Level ${data.accountLevel}`, 100, 460);

        const drawTile = (x, y, w, h, icon, title, value) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 54px sans-serif';
          ctx.fillText(String(value), x + 40, y + 140);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '700 30px sans-serif';
          ctx.fillText(`${icon} ${title}`, x + 40, y + 200);
        };

        drawTile(60, 560, 460, 260, '👤', 'MAIN OPERATIVE', data.topAgent);
        drawTile(560, 560, 460, 260, '🎯', 'HEADSHOT RATE', `${data.headshotPct}%`);
        drawTile(60, 860, 460, 260, '🔥', 'WIN RATE', `${data.winRate}%`);
        drawTile(560, 860, 460, 260, '🕒', 'PEAK EGO HOUR', `${data.peakHour}:00`);

        ctx.fillStyle = 'rgba(232, 255, 71, 0.15)';
        ctx.fillRect(60, 1160, 960, 140);
        ctx.strokeStyle = '#e8ff47';
        ctx.strokeRect(60, 1160, 960, 140);

        ctx.fillStyle = '#e8ff47';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(`PERSONA: ${data.personaTitle.toUpperCase()}`, 100, 1245);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(60, 1340, 960, 360);

        ctx.fillStyle = '#fa4454';
        ctx.font = '900 42px sans-serif';
        ctx.fillText(`🛡️ ${data.vandalShieldEquiv} Heavy Shields Bought`, 100, 1420);

        ctx.fillStyle = '#e8ff47';
        ctx.font = '900 42px sans-serif';
        ctx.fillText(`💥 ${data.damageDealt.toLocaleString()} HP Damage Dealt`, 100, 1510);

        ctx.fillStyle = '#00c6ff';
        ctx.font = '900 42px sans-serif';
        ctx.fillText(`🎯 ${data.highestKillGame} Single-Game Kill High`, 100, 1600);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('Generated on ValTracker.gg', 380, 1840);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ValTracker_Wrapped_${playerName || 'Player'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);

        if (window.showToast) window.showToast('Story PNG Saved!', 'success');
        else alert('Wrapped Story PNG Saved to Downloads!');
      }
    } catch (err) {
      console.error('PNG export error:', err);
      if (window.showToast) window.showToast('Failed to save PNG image', 'error');
      else alert('Failed to save PNG image');
    } finally {
      isExporting = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
  <div class="wrapped-backdrop" on:click|self={closeModal} role="dialog" aria-modal="true">
    <div
      class="wrapped-story-container"
      on:click={handleStoryContainerClick}
      on:mousedown={() => isPaused = true}
      on:mouseup={() => { isPaused = false; startSlideTimer(); }}
      on:touchstart={() => isPaused = true}
      on:touchend={() => { isPaused = false; startSlideTimer(); }}
    >

      <!-- ═══ PROGRESS BARS ═══ -->
      <div class="story-progress-rail">
        {#each Array(TOTAL_SLIDES) as _, idx}
          <div class="spr-track">
            <div
              class="spr-fill"
              style="width: {idx < currentSlide ? '100%' : (idx === currentSlide ? `${progress}%` : '0%')}"
            ></div>
          </div>
        {/each}
      </div>

      <!-- ═══ TOP BAR ═══ -->
      <div class="story-topbar">
        <div class="story-brand">
          <span class="brand-bolt">⚡</span>
          <span class="brand-label">VALORANT WRAPPED</span>
        </div>
        <button class="story-close-btn" on:click={closeModal} title="Close">✕</button>
      </div>

      <!-- ═══ SLIDES ═══ -->

      {#if currentSlide === 0}
        <!-- SLIDE 0: TITLE INTRO -->
        <div class="slide slide-0" key={slideKey}>
          <!-- Layered atmospheric bg -->
          {#if data.cardUrl}
            <div class="s0-banner-bg" style="background-image:url('{data.cardUrl}')"></div>
          {/if}
          <div class="s0-gradient-overlay"></div>
          <div class="s0-noise"></div>

          <div class="s0-content">
            <!-- Eyebrow chip -->
            <div class="eyebrow-chip">
              <span class="eyebrow-dot"></span>
              {data.periodTitle.toUpperCase()}
            </div>

            <!-- Giant title -->
            <div class="s0-title-block">
              <div class="s0-title-sub">YOUR SEASONAL RECAP</div>
              <h1 class="s0-title-main">VALORANT<br><span class="s0-title-accent">WRAPPED</span></h1>
            </div>

            <!-- Player identity card -->
            <div class="s0-id-card">
              {#if data.cardUrl}
                <img src={data.cardUrl} alt="" class="s0-card-banner" />
              {/if}
              <div class="s0-id-inner">
                <div class="s0-id-name">
                  <span class="s0-name">{data.playerName}</span><span class="s0-tag">#{data.playerTag}</span>
                </div>
                <div class="s0-rank-pill">
                  {#if rankImg}<img src={rankImg} alt="" class="s0-rank-img" />{/if}
                  <span>{data.rankName}</span>
                </div>
              </div>
            </div>

            <!-- Hero stat trio -->
            <div class="s0-stat-trio">
              <div class="s0-stat">
                <div class="s0-stat-val">{data.totalGames}</div>
                <div class="s0-stat-lbl">MATCHES</div>
              </div>
              <div class="s0-stat featured">
                <div class="s0-stat-val accent">{data.winRate}%</div>
                <div class="s0-stat-lbl">WIN RATE</div>
              </div>
              <div class="s0-stat">
                <div class="s0-stat-val">{data.kdRatio}</div>
                <div class="s0-stat-lbl">K/D RATIO</div>
              </div>
            </div>

            <!-- Season hours footer -->
            <div class="s0-hours-footer">
              <span class="s0-hours-ico">⏱</span>
              <span>~{data.totalHoursPlayed} hours of Valorant this act</span>
            </div>
          </div>
        </div>

      {:else if currentSlide === 1}
        <!-- SLIDE 1: SIGNATURE AGENT -->
        <div class="slide slide-1" key={slideKey}>
          <!-- Full-slide agent bg stencil -->
          {#if agentBgUrl}
            <img class="s1-agent-stencil" src={agentBgUrl} alt="" />
          {/if}
          <!-- Gradient overlay keyed to agent color -->
          <div class="s1-color-wash" style="background: radial-gradient(ellipse at 50% 0%, {agentTheme.primary}44 0%, {agentTheme.primary}11 50%, transparent 100%)"></div>

          <div class="s1-content">
            <div class="s1-header">
              <div class="slide-kicker">THE SIGNATURE OPERATIVE</div>
              <h2 class="s1-agent-name" style="color: {agentTheme.primary}; text-shadow: 0 0 40px {agentTheme.primary}88">{data.topAgent.toUpperCase()}</h2>
            </div>

            <!-- Massive centered agent portrait -->
            <div class="s1-portrait-stage">
              {#if agentPortraitUrl}
                <img class="s1-portrait" src={agentPortraitUrl} alt={data.topAgent} style="filter: drop-shadow(0 0 40px {agentTheme.primary}66)" />
              {/if}
              <!-- Glow disc under agent -->
              <div class="s1-glow-disc" style="background: radial-gradient(circle, {agentTheme.primary}33 0%, transparent 70%)"></div>
            </div>

            <!-- Stats bento -->
            <div class="s1-bento-row">
              <div class="s1-bento-box">
                <img src={agentIconUrl} alt="" class="s1-agent-icon" />
                <div class="s1-bento-val">{data.topAgentCount}</div>
                <div class="s1-bento-lbl">MATCHES</div>
              </div>
              <div class="s1-bento-box accent-box" style="border-color: {agentTheme.primary}66; box-shadow: 0 0 20px {agentTheme.primary}22">
                <div class="s1-bento-val" style="color: {agentTheme.primary}">{data.topAgentWinRate}%</div>
                <div class="s1-bento-lbl">WIN RATE</div>
              </div>
            </div>

            <!-- Top maps -->
            <div class="s1-maps-card">
              <div class="s1-maps-header">TOP MAP PERFORMANCE</div>
              {#each data.topMaps as mapItem}
                <div class="s1-map-row">
                  <span class="s1-map-name">{mapItem.map}</span>
                  <div class="s1-map-bar-track">
                    <div class="s1-map-bar-fill" style="width: {mapItem.winRate}%; background: linear-gradient(90deg, {agentTheme.primary}, {agentTheme.accent || agentTheme.primary})"></div>
                  </div>
                  <span class="s1-map-stat">{mapItem.games}G · {mapItem.winRate}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

      {:else if currentSlide === 2}
        <!-- SLIDE 2: PEAK EGO HOUR -->
        <div class="slide slide-2" key={slideKey}>
          <div class="s2-aurora-bg"></div>

          <div class="s2-content">
            <div class="slide-kicker">GAMING HABITS</div>
            <h2 class="s2-title">PEAK EGO<br>HOUR</h2>

            <!-- Big time display -->
            <div class="s2-time-hero">
              <div class="s2-time-ring">
                <div class="s2-time-inner">
                  <div class="s2-time-val">{data.egoHourText.split(' on ')[0]}</div>
                  <div class="s2-time-day">on {data.egoHourText.split(' on ')[1] || ''}</div>
                </div>
              </div>
              <div class="s2-time-sub">PEAK LOBBY PERFORMANCE WINDOW</div>
            </div>

            <!-- Activity heatmap -->
            <div class="s2-heat-card">
              <div class="s2-heat-title">24-HOUR ACTIVITY MAP</div>
              <div class="s2-bars-wrap">
                {#each data.hourDistribution as cnt, hr}
                  <div
                    class="s2-bar"
                    class:peak={hr === data.peakHour}
                    class:near-peak={Math.abs(hr - data.peakHour) <= 1 && hr !== data.peakHour}
                    style="height: {cnt > 0 ? Math.max(12, (cnt / Math.max(1, Math.max(...data.hourDistribution))) * 100) : 6}%"
                    title="{hr}:00 — {cnt} matches"
                  ></div>
                {/each}
              </div>
              <div class="s2-bar-labels">
                <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
              </div>
            </div>

            <!-- Persona badge -->
            <div class="s2-persona">
              <div class="s2-persona-eyebrow">YOUR GAMING PERSONA</div>
              <div class="s2-persona-title">{data.personaTitle.toUpperCase()}</div>
            </div>
          </div>
        </div>

      {:else if currentSlide === 3}
        <!-- SLIDE 3: WAR ECONOMY -->
        <div class="slide slide-3" key={slideKey}>
          <div class="s3-bg-mesh"></div>

          <div class="s3-content">
            <div class="slide-kicker">WAR ECONOMY & COMBAT</div>
            <h2 class="s3-title">VALORANT<br>ARSENAL</h2>

            <div class="s3-stack">
              <!-- Armor stat -->
              <div class="s3-lore-card">
                <div class="s3-lore-icon s3-icon-red">🛡️</div>
                <div class="s3-lore-body">
                  <div class="s3-lore-headline">{data.vandalShieldEquiv} HEAVY SHIELDS</div>
                  <div class="s3-lore-sub">Worth <strong>{data.vandalShieldEquiv} Vandal skins</strong> in armor bought</div>
                </div>
              </div>

              <!-- Damage stat -->
              <div class="s3-lore-card">
                <div class="s3-lore-icon s3-icon-yellow">💥</div>
                <div class="s3-lore-body">
                  <div class="s3-lore-headline yellow">{(data.damageDealt).toLocaleString()} HP DAMAGE</div>
                  <div class="s3-lore-sub">Equivalent of <strong>{data.radiantsEliminated} Radiants</strong> eliminated</div>
                </div>
              </div>

              <!-- Hit distribution -->
              <div class="s3-hit-card">
                <div class="s3-hit-title">HIT LOCATION DISTRIBUTION</div>
                <div class="s3-hit-bar">
                  <div class="s3-hit-seg head" style="width: {data.headshotPct}%" title="Head: {data.headshotPct}%"></div>
                  <div class="s3-hit-seg body" style="width: {data.bodyshotPct}%" title="Body: {data.bodyshotPct}%"></div>
                  <div class="s3-hit-seg leg" style="width: {data.legshotPct}%" title="Leg: {data.legshotPct}%"></div>
                </div>
                <div class="s3-hit-legend">
                  <span class="s3-hl head-hl">🎯 Head: {data.headshotPct}%</span>
                  <span class="s3-hl body-hl">Body: {data.bodyshotPct}%</span>
                  <span class="s3-hl leg-hl">Leg: {data.legshotPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {:else if currentSlide === 4}
        <!-- SLIDE 4: AIM & LETHALITY -->
        <div class="slide slide-4" key={slideKey}>
          <div class="s4-radial-bg"></div>

          <div class="s4-content">
            <div class="slide-kicker">AIM & LETHALITY</div>
            <h2 class="s4-title">HEADSHOT<br>RADAR</h2>

            <!-- Animated reticle -->
            <div class="s4-reticle-wrap">
              <div class="s4-reticle-ring s4-ring-outer"></div>
              <div class="s4-reticle-ring s4-ring-mid"></div>
              <div class="s4-reticle-center">
                <div class="s4-hs-pct">{data.headshotPct}%</div>
                <div class="s4-hs-lbl">HEADSHOT</div>
              </div>
            </div>

            <!-- Quad stat grid -->
            <div class="s4-quad">
              <div class="s4-qcard">
                <div class="s4-qval">{data.highestKillGame}</div>
                <div class="s4-qlbl">SINGLE GAME<br>KILL HIGH</div>
              </div>
              <div class="s4-qcard featured">
                <div class="s4-qval accent">{data.longestWinStreak}</div>
                <div class="s4-qlbl">WIN<br>STREAK</div>
              </div>
              <div class="s4-qcard">
                <div class="s4-qval">{data.clutchCount}</div>
                <div class="s4-qlbl">20+ KILL<br>GAMES</div>
              </div>
              <div class="s4-qcard">
                <div class="s4-qval">{data.avgCombatScore}</div>
                <div class="s4-qlbl">AVG<br>ACS</div>
              </div>
            </div>

            <!-- Total kills callout -->
            <div class="s4-kills-banner">
              <span class="s4-kills-num">{data.totalKills.toLocaleString()}</span>
              <span class="s4-kills-lbl">TOTAL KILLS THIS ACT</span>
            </div>
          </div>
        </div>

      {:else if currentSlide === 5}
        <!-- SLIDE 5: NEMESIS -->
        <div class="slide slide-5" key={slideKey}>
          {#if victimPortraitUrl}
            <img class="s5-victim-bg" src={victimPortraitUrl} alt="" />
          {/if}
          <div class="s5-blood-wash"></div>

          <div class="s5-content">
            <div class="slide-kicker red-kicker">TARGET LOCKED</div>
            <h2 class="s5-title red-glow">FAVORITE<br>TARGET</h2>

            <!-- Wanted poster -->
            <div class="s5-poster">
              <div class="s5-poster-stamp">MOST HUNTED</div>
              <div class="s5-victim-stage">
                {#if victimPortraitUrl}
                  <img src={victimPortraitUrl} alt={data.topVictimAgent} class="s5-victim-img" />
                {/if}
              </div>
              <div class="s5-victim-name" style="color: {victimTheme.primary}">{data.topVictimAgent.toUpperCase()}</div>
              <div class="s5-victim-sub">Your most eliminated agent archetype</div>
            </div>

            <!-- Duo card -->
            <div class="s5-duo-card">
              <div class="s5-duo-label">🤝 TOP DUO PARTNER</div>
              <div class="s5-duo-name">{data.topTeammateName}</div>
            </div>
          </div>
        </div>

      {:else if currentSlide === 6}
        <!-- SLIDE 6: SHAREABLE FLEX CARD -->
        <div class="slide slide-6" key={slideKey}>
          <div class="s6-content">
            <!-- Header -->
            <div class="s6-header">
              <div class="s6-brand">⚡ VALTRACKER.GG</div>
              <div class="s6-period">{data.periodTitle.toUpperCase()}</div>
            </div>

            <!-- Player banner -->
            <div class="s6-player-banner">
              {#if data.cardUrl}
                <img src={data.cardUrl} alt="" class="s6-banner-img" />
              {/if}
              <div class="s6-player-overlay">
                <div class="s6-player-name">{data.playerName} <span class="s6-player-tag">#{data.playerTag}</span></div>
                <div class="s6-player-rank">
                  {#if rankImg}<img src={rankImg} alt="" class="s6-rank-img" />{/if}
                  <span>{data.rankName}</span>
                </div>
              </div>
            </div>

            <!-- 2x2 flex grid -->
            <div class="s6-grid">
              <div class="s6-tile">
                <div class="s6-tile-icon"><img src={agentIconUrl} alt="" class="s6-agent-icon" /></div>
                <div class="s6-tile-val">{data.topAgent}</div>
                <div class="s6-tile-lbl">MAIN · {data.topAgentWinRate}% WR</div>
              </div>
              <div class="s6-tile">
                <div class="s6-tile-icon">🎯</div>
                <div class="s6-tile-val">{data.headshotPct}%</div>
                <div class="s6-tile-lbl">HEADSHOT</div>
              </div>
              <div class="s6-tile">
                <div class="s6-tile-icon">🕒</div>
                <div class="s6-tile-val">{data.peakHour}:00</div>
                <div class="s6-tile-lbl">EGO HOUR</div>
              </div>
              <div class="s6-tile accent-tile">
                <div class="s6-tile-icon">🔥</div>
                <div class="s6-tile-val accent">{data.winRate}%</div>
                <div class="s6-tile-lbl">{data.totalGames} GAMES</div>
              </div>
            </div>

            <!-- Persona ribbon -->
            <div class="s6-persona-ribbon">
              <span class="s6-pr-label">PERSONA</span>
              <span class="s6-pr-value">{data.personaTitle.toUpperCase()}</span>
            </div>

            <!-- Action buttons -->
            <div class="s6-actions">
              <button
                type="button"
                class="s6-btn s6-btn-primary"
                on:click|preventDefault|stopPropagation={shareStory}
              >
                <span class="s6-btn-icon">📲</span>
                <span>{copied ? 'COPIED!' : 'SHARE STORY'}</span>
              </button>
              <button
                type="button"
                class="s6-btn s6-btn-secondary"
                on:click|preventDefault|stopPropagation={generateCanvasStoryPng}
                disabled={isExporting}
              >
                <span class="s6-btn-icon">📸</span>
                <span>{isExporting ? 'SAVING...' : 'SAVE PNG'}</span>
              </button>
            </div>
          </div>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  /* ══════════════════════════════
     BACKDROP & CONTAINER
  ══════════════════════════════ */
  .wrapped-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(2, 2, 8, 0.96);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', -apple-system, sans-serif;
  }

  .wrapped-story-container {
    position: relative;
    width: min(420px, 100vw);
    height: min(780px, 96vh);
    background: #08080f;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow:
      0 0 0 1px rgba(250,68,84,0.15),
      0 40px 100px rgba(0,0,0,0.9),
      0 0 60px rgba(250,68,84,0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    user-select: none;
    cursor: pointer;
  }

  /* ══════════════════════════════
     PROGRESS RAIL
  ══════════════════════════════ */
  .story-progress-rail {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    z-index: 200;
    display: flex;
    gap: 4px;
  }
  .spr-track {
    flex: 1;
    height: 3px;
    background: rgba(255,255,255,0.18);
    border-radius: 2px;
    overflow: hidden;
  }
  .spr-fill {
    height: 100%;
    background: #fff;
    border-radius: 2px;
    transition: width 0.05s linear;
    box-shadow: 0 0 6px rgba(255,255,255,0.6);
  }

  /* ══════════════════════════════
     TOP BAR
  ══════════════════════════════ */
  .story-topbar {
    position: absolute;
    top: 28px;
    left: 16px;
    right: 16px;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .story-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.8px;
    color: rgba(255,255,255,0.9);
  }
  .brand-bolt {
    font-size: 14px;
    filter: drop-shadow(0 0 8px #e8ff47);
    color: #e8ff47;
  }
  .story-close-btn {
    width: 30px;
    height: 30px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, transform 0.2s;
    pointer-events: all;
  }
  .story-close-btn:hover { background: #fa4454; transform: scale(1.1); }

  /* ══════════════════════════════
     SHARED SLIDE BASE
  ══════════════════════════════ */
  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .slide-kicker {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2.5px;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
  }

  /* ══════════════════════════════
     SLIDE 0 — TITLE INTRO
  ══════════════════════════════ */
  .slide-0 {
    background: radial-gradient(ellipse at 30% 0%, #3a0814 0%, #0c0c18 55%, #08080f 100%);
  }
  .s0-banner-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    opacity: 0.18;
    filter: blur(2px) saturate(1.5);
  }
  .s0-gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8,8,15,0) 0%, rgba(8,8,15,0.6) 40%, #08080f 80%);
  }
  .s0-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
    pointer-events: none;
  }

  .s0-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 14px;
    justify-content: space-between;
  }

  .eyebrow-chip {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(250,68,84,0.2);
    border: 1px solid rgba(250,68,84,0.5);
    border-radius: 30px;
    padding: 5px 14px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #fa4454;
  }
  .eyebrow-dot {
    width: 5px;
    height: 5px;
    background: #fa4454;
    border-radius: 50%;
    box-shadow: 0 0 8px #fa4454;
    animation: blink 1.5s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:0.4} 50%{opacity:1} }

  .s0-title-block {
    display: flex;
    flex-direction: column;
  }
  .s0-title-sub {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #e8ff47;
    margin-bottom: 6px;
  }
  .s0-title-main {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 52px;
    font-weight: 900;
    line-height: 0.95;
    color: #fff;
    text-shadow: 0 6px 30px rgba(0,0,0,0.8);
    letter-spacing: -1px;
  }
  .s0-title-accent {
    color: #fa4454;
    text-shadow: 0 0 30px rgba(250,68,84,0.8), 0 0 60px rgba(250,68,84,0.4);
  }

  .s0-id-card {
    position: relative;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 18px;
    overflow: hidden;
  }
  .s0-card-banner {
    width: 100%;
    height: 80px;
    object-fit: cover;
    display: block;
    opacity: 0.5;
  }
  .s0-id-inner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: linear-gradient(90deg, rgba(8,8,15,0.7) 0%, transparent 100%);
  }
  .s0-id-name {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .s0-name { font-size: 20px; font-weight: 900; color: #fff; }
  .s0-tag { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.5); }
  .s0-rank-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,215,0,0.4);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 800;
    color: #ffd700;
  }
  .s0-rank-img { width: 20px; height: 20px; object-fit: contain; }

  .s0-stat-trio {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .s0-stat {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px 8px;
    text-align: center;
  }
  .s0-stat.featured {
    background: rgba(250,68,84,0.12);
    border-color: rgba(250,68,84,0.4);
  }
  .s0-stat-val { font-size: 24px; font-weight: 900; color: #fff; }
  .s0-stat-val.accent { color: #fa4454; }
  .s0-stat-lbl { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-top: 3px; }

  .s0-hours-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.4);
    padding-bottom: 4px;
  }
  .s0-hours-ico { font-size: 14px; }

  /* ══════════════════════════════
     SLIDE 1 — SIGNATURE AGENT
  ══════════════════════════════ */
  .slide-1 {
    background: #0a0a14;
  }
  .s1-agent-stencil {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.12;
    pointer-events: none;
  }
  .s1-color-wash {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .s1-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 12px;
  }
  .s1-header { display: flex; flex-direction: column; gap: 2px; }
  .s1-agent-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 44px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -1px;
    margin-top: 2px;
  }

  .s1-portrait-stage {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }
  .s1-portrait {
    height: 100%;
    max-height: 240px;
    width: auto;
    object-fit: contain;
    animation: floatAgent 4s ease-in-out infinite alternate;
    position: relative;
    z-index: 2;
  }
  @keyframes floatAgent { from { transform: translateY(0) } to { transform: translateY(-10px) } }
  .s1-glow-disc {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 60px;
    border-radius: 50%;
    filter: blur(20px);
  }

  .s1-bento-row { display: flex; gap: 10px; }
  .s1-bento-box {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .s1-bento-box.accent-box { background: rgba(255,255,255,0.04); }
  .s1-agent-icon { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
  .s1-bento-val { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; }
  .s1-bento-lbl { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; }

  .s1-maps-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px;
  }
  .s1-maps-header { font-size: 10px; font-weight: 900; color: #e8ff47; letter-spacing: 1px; margin-bottom: 10px; }
  .s1-map-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .s1-map-row:last-child { margin-bottom: 0; }
  .s1-map-name { width: 52px; font-size: 11px; font-weight: 800; color: #fff; }
  .s1-map-bar-track { flex: 1; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
  .s1-map-bar-fill { height: 100%; border-radius: 3px; }
  .s1-map-stat { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6); width: 58px; text-align: right; }

  /* ══════════════════════════════
     SLIDE 2 — PEAK EGO HOUR
  ══════════════════════════════ */
  .slide-2 {
    background: radial-gradient(ellipse at 50% 100%, #1a0535 0%, #0c0820 60%, #08080f 100%);
  }
  .s2-aurora-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(127,0,255,0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 30%, rgba(90,0,220,0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .s2-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 16px;
    text-align: center;
  }
  .s2-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 0.95;
    letter-spacing: -1px;
    text-align: left;
    margin-top: 4px;
  }

  .s2-time-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .s2-time-ring {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 2px solid rgba(127,0,255,0.5);
    box-shadow: 0 0 30px rgba(127,0,255,0.3), inset 0 0 30px rgba(127,0,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(127,0,255,0.08);
    animation: ringPulse 3s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%,100% { box-shadow: 0 0 20px rgba(127,0,255,0.3), inset 0 0 20px rgba(127,0,255,0.1); }
    50%      { box-shadow: 0 0 50px rgba(127,0,255,0.5), inset 0 0 40px rgba(127,0,255,0.2); }
  }
  .s2-time-inner { text-align: center; }
  .s2-time-val { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 900; color: #fff; }
  .s2-time-day { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .s2-time-sub { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); }

  .s2-heat-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 14px;
  }
  .s2-heat-title { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; color: rgba(255,255,255,0.45); margin-bottom: 10px; }
  .s2-bars-wrap {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 48px;
    margin-bottom: 6px;
  }
  .s2-bar {
    flex: 1;
    background: rgba(255,255,255,0.12);
    border-radius: 2px 2px 0 0;
    transition: background 0.3s;
  }
  .s2-bar.peak {
    background: #7f00ff;
    box-shadow: 0 0 12px rgba(127,0,255,0.7), 0 0 4px rgba(127,0,255,0.9);
  }
  .s2-bar.near-peak {
    background: rgba(127,0,255,0.4);
  }
  .s2-bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
  }

  .s2-persona {
    background: rgba(232,255,71,0.08);
    border: 1px solid rgba(232,255,71,0.3);
    border-radius: 14px;
    padding: 14px;
    margin-top: auto;
  }
  .s2-persona-eyebrow { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); }
  .s2-persona-title { font-size: 18px; font-weight: 900; color: #e8ff47; margin-top: 4px; text-shadow: 0 0 20px rgba(232,255,71,0.5); }

  /* ══════════════════════════════
     SLIDE 3 — WAR ECONOMY
  ══════════════════════════════ */
  .slide-3 {
    background: radial-gradient(ellipse at 50% 50%, #1a200a 0%, #0e100a 60%, #08080f 100%);
  }
  .s3-bg-mesh {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 80% 20%, rgba(232,255,71,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 20% 80%, rgba(250,68,84,0.06) 0%, transparent 50%);
    pointer-events: none;
  }

  .s3-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 14px;
  }
  .s3-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 0.95;
    letter-spacing: -1px;
    margin-top: 4px;
  }

  .s3-stack { display: flex; flex-direction: column; gap: 10px; flex: 1; }

  .s3-lore-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px;
  }
  .s3-lore-icon { font-size: 32px; flex-shrink: 0; }
  .s3-lore-body { flex: 1; }
  .s3-lore-headline { font-size: 15px; font-weight: 900; color: #fa4454; }
  .s3-lore-headline.yellow { color: #e8ff47; }
  .s3-lore-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px; line-height: 1.4; }
  .s3-lore-sub strong { color: #ffd700; }

  .s3-hit-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px;
  }
  .s3-hit-title { font-size: 10px; font-weight: 900; color: #e8ff47; letter-spacing: 1px; margin-bottom: 10px; }
  .s3-hit-bar {
    display: flex;
    height: 14px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255,255,255,0.08);
    margin-bottom: 10px;
  }
  .s3-hit-seg { transition: width 0.6s ease; }
  .s3-hit-seg.head { background: linear-gradient(90deg, #00c6ff, #0080ff); }
  .s3-hit-seg.body { background: linear-gradient(90deg, #fa4454, #ff6b35); }
  .s3-hit-seg.leg { background: linear-gradient(90deg, #666, #444); }
  .s3-hit-legend { display: flex; justify-content: space-between; }
  .s3-hl { font-size: 10px; font-weight: 700; }
  .head-hl { color: #00c6ff; }
  .body-hl { color: rgba(255,255,255,0.7); }
  .leg-hl { color: rgba(255,255,255,0.4); }

  /* ══════════════════════════════
     SLIDE 4 — AIM & LETHALITY
  ══════════════════════════════ */
  .slide-4 {
    background: radial-gradient(ellipse at 50% 30%, #001d2b 0%, #080e12 60%, #08080f 100%);
  }
  .s4-radial-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 42%, rgba(0,198,255,0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .s4-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 16px;
    align-items: center;
    text-align: center;
  }
  .s4-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 0.95;
    letter-spacing: -1px;
    align-self: flex-start;
    text-align: left;
    margin-top: 4px;
    width: 100%;
  }

  .s4-reticle-wrap {
    position: relative;
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .s4-reticle-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(0,198,255,0.4);
  }
  .s4-ring-outer {
    inset: 0;
    animation: spinRing 12s linear infinite;
    border-top-color: #00c6ff;
    box-shadow: 0 0 20px rgba(0,198,255,0.3);
  }
  .s4-ring-mid {
    inset: 16px;
    animation: spinRing 8s linear infinite reverse;
    border-top-color: rgba(0,198,255,0.7);
  }
  @keyframes spinRing { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  .s4-reticle-center {
    position: relative;
    z-index: 5;
    text-align: center;
    background: rgba(0,198,255,0.08);
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .s4-hs-pct { font-size: 30px; font-weight: 900; color: #00c6ff; line-height: 1; text-shadow: 0 0 20px rgba(0,198,255,0.8); }
  .s4-hs-lbl { font-size: 8px; font-weight: 900; letter-spacing: 1px; color: rgba(255,255,255,0.6); margin-top: 2px; }

  .s4-quad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }
  .s4-qcard {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px;
    text-align: center;
  }
  .s4-qcard.featured {
    background: rgba(0,198,255,0.08);
    border-color: rgba(0,198,255,0.35);
  }
  .s4-qval { font-size: 28px; font-weight: 900; color: #fff; }
  .s4-qval.accent { color: #00c6ff; text-shadow: 0 0 20px rgba(0,198,255,0.6); }
  .s4-qlbl { font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.5); margin-top: 4px; letter-spacing: 0.3px; line-height: 1.3; }

  .s4-kills-banner {
    width: 100%;
    background: linear-gradient(135deg, rgba(250,68,84,0.15), rgba(250,68,84,0.05));
    border: 1px solid rgba(250,68,84,0.3);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
  }
  .s4-kills-num { font-size: 30px; font-weight: 900; color: #fa4454; text-shadow: 0 0 20px rgba(250,68,84,0.6); }
  .s4-kills-lbl { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.6); letter-spacing: 1px; }

  /* ══════════════════════════════
     SLIDE 5 — NEMESIS
  ══════════════════════════════ */
  .slide-5 {
    background: #08080f;
  }
  .s5-victim-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 75%;
    object-fit: cover;
    object-position: top center;
    opacity: 0.12;
    filter: saturate(0.5);
    pointer-events: none;
  }
  .s5-blood-wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(220,20,20,0.25) 0%, transparent 55%),
      linear-gradient(180deg, transparent 30%, #08080f 80%);
    pointer-events: none;
  }

  .s5-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 68px 20px 20px;
    gap: 14px;
    text-align: center;
    align-items: center;
  }
  .red-kicker { color: rgba(255,87,87,0.8) !important; }
  .s5-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 44px;
    font-weight: 900;
    color: #fff;
    line-height: 0.95;
    letter-spacing: -1px;
    margin-top: 4px;
    align-self: flex-start;
    text-align: left;
  }
  .red-glow { text-shadow: 0 0 30px rgba(255,87,87,0.5); color: #ff5757 !important; }

  .s5-poster {
    width: 100%;
    background: rgba(25,10,10,0.9);
    border: 2px dashed rgba(255,87,87,0.5);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: 1;
  }
  .s5-poster-stamp {
    position: absolute;
    top: 10px;
    right: 12px;
    background: #ff5757;
    color: #000;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 4px;
  }
  .s5-victim-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .s5-victim-img {
    max-height: 200px;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 30px rgba(255,87,87,0.5));
    animation: floatAgent 4s ease-in-out infinite alternate;
  }
  .s5-victim-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  .s5-victim-sub { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; }

  .s5-duo-card {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 14px;
  }
  .s5-duo-label { font-size: 10px; font-weight: 900; color: #e8ff47; letter-spacing: 1px; }
  .s5-duo-name { font-size: 18px; font-weight: 900; color: #fff; margin-top: 4px; }

  /* ══════════════════════════════
     SLIDE 6 — FLEX CARD
  ══════════════════════════════ */
  .slide-6 {
    background: linear-gradient(160deg, #12080e 0%, #08080f 50%, #0a0812 100%);
    border: none;
  }

  .s6-content {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 60px 18px 18px;
    gap: 12px;
  }

  .s6-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 10px;
  }
  .s6-brand { font-size: 12px; font-weight: 900; color: #fa4454; letter-spacing: 1.5px; }
  .s6-period { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.5); }

  .s6-player-banner {
    position: relative;
    height: 80px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.12);
    flex-shrink: 0;
  }
  .s6-banner-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
  }
  .s6-player-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: linear-gradient(90deg, rgba(8,8,15,0.75) 0%, transparent 100%);
  }
  .s6-player-name { font-size: 20px; font-weight: 900; color: #fff; }
  .s6-player-tag { font-size: 14px; color: rgba(255,255,255,0.5); }
  .s6-player-rank { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; color: #ffd700; }
  .s6-rank-img { width: 18px; height: 18px; object-fit: contain; }

  .s6-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    flex: 1;
  }
  .s6-tile {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 5px;
  }
  .s6-tile.accent-tile {
    background: rgba(250,68,84,0.1);
    border-color: rgba(250,68,84,0.35);
  }
  .s6-tile-icon { font-size: 22px; }
  .s6-agent-icon { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
  .s6-tile-val { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; }
  .s6-tile-val.accent { color: #fa4454; text-shadow: 0 0 16px rgba(250,68,84,0.5); }
  .s6-tile-lbl { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 0.3px; }

  .s6-persona-ribbon {
    background: rgba(232,255,71,0.1);
    border: 1px solid rgba(232,255,71,0.35);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .s6-pr-label { font-size: 9px; font-weight: 900; color: rgba(232,255,71,0.6); letter-spacing: 1px; }
  .s6-pr-value { font-size: 13px; font-weight: 900; color: #e8ff47; text-shadow: 0 0 16px rgba(232,255,71,0.4); }

  .s6-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .s6-btn {
    position: relative;
    z-index: 9999;
    pointer-events: all;
    flex: 1;
    padding: 14px 10px;
    border-radius: 14px;
    border: none;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: 'Outfit', sans-serif;
    transition: transform 0.2s, opacity 0.2s;
  }
  .s6-btn:hover { transform: translateY(-2px); }
  .s6-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .s6-btn-primary {
    background: linear-gradient(135deg, #fa4454, #e8003c);
    color: #fff;
    box-shadow: 0 8px 24px rgba(250,68,84,0.45);
  }
  .s6-btn-secondary {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .s6-btn-icon { font-size: 14px; }
</style>

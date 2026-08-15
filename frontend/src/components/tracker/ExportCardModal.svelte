<script>
  import { tick, onMount } from 'svelte';
  import { 
    EXPORT_THEMES, 
    renderMatchCardToCanvas, 
    renderProfileCardToCanvas 
  } from '../../lib/exportCardRenderer';
  import { getAgentIconUrl, getAgentPortraitUrl, getMapImg } from '../../lib/assets';
  import { getRankImgUrl } from '../../lib/constants';
  import { formatMatchDate, getPlayerList } from '../../lib/utils';
  import { createShareCard } from '../../lib/api';

  export let open = false;
  export let cardType = 'match'; // 'match' | 'profile'
  export let match = null;
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let allPlayers = [];
  export let rawMatch = null;
  export let playerBannerUrl = '';
  export let playerLevel = '';
  
  // Profile Mode Props
  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let mmrHistory = {};
  export let actFilteredMatches = [];
  export let onClose = () => {};

  let loading = true;
  let canvasEl;
  let activeThemeId = 'obsidian';
  let aspectFormat = '16:9'; // '16:9' | '1:1'
  let customHeadline = '';
  let showScoreboard = true;
  let showTimeline = true;
  let showFeats = true;

  let copyFeedback = false;
  let copyFeedbackMsg = '';
  let shareUrl = '';
  let shareId = '';
  let downloading = false;
  let copying = false;

  // 3D Tilt Preview state
  let rotateX = 0;
  let rotateY = 0;
  let previewGlowing = false;

  $: activeTheme = EXPORT_THEMES.find(t => t.id === activeThemeId) || EXPORT_THEMES[0];

  $: if (open && (match || stats || accountData)) {
    renderCard();
  }

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rotateX = ((y - centerY) / centerY) * -8;
    rotateY = ((x - centerX) / centerX) * 8;
    previewGlowing = true;
  }

  function handleMouseLeave() {
    rotateX = 0;
    rotateY = 0;
    previewGlowing = false;
  }

  async function renderCard() {
    loading = true;
    await tick();
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // Fallback
      }
    }
    if (!canvasEl) return;

    try {
      if (cardType === 'match' && match) {
        const myNameUpper = (playerName || '').toUpperCase();
        const me = (allPlayers || []).find(p => (p.name || '').toUpperCase() === myNameUpper) || {};

        const rounds = (rawMatch?.rounds || []).map(r => ({
          won: r.winning_team === (me.team || 'Red'),
          isClutch: false
        }));

        const alliedPlayers = (allPlayers || []).filter(p => p.team === me.team).map(p => ({
          name: p.name,
          tag: p.tag,
          iconUrl: getAgentIconUrl(p.agent),
          kda: `${p.kills}/${p.deaths}/${p.assists}`,
          acs: p.score ? Math.round(p.score / Math.max(1, rawMatch?.rounds?.length || 1)) : 0,
          isMe: (p.name || '').toUpperCase() === myNameUpper
        }));

        const enemyPlayers = (allPlayers || []).filter(p => p.team !== me.team).map(p => ({
          name: p.name,
          tag: p.tag,
          iconUrl: getAgentIconUrl(p.agent),
          kda: `${p.kills}/${p.deaths}/${p.assists}`,
          acs: p.score ? Math.round(p.score / Math.max(1, rawMatch?.rounds?.length || 1)) : 0
        }));

        const matchData = {
          playerName: playerName || 'VALORANT PLAYER',
          playerTag: playerTag || '0000',
          playerLevel: playerLevel || '100',
          playerBannerUrl: playerBannerUrl || accountData?.card?.wide || accountData?.card?.large || '',
          agentName: match.agent || 'Jett',
          agentIconUrl: getAgentIconUrl(match.agent),
          agentPortraitUrl: getAgentPortraitUrl(match.agent),
          mapName: match.map || 'Ascent',
          mapImgUrl: getMapImg(match.map),
          won: match.result === 'WIN',
          score: match.score || '13 - 10',
          gameDate: formatMatchDate(match.date),
          kills: match.kills || 0,
          deaths: match.deaths || 0,
          assists: match.assists || 0,
          kd: match.kd || '1.0',
          acs: match.acs || 0,
          hsPct: match.hsPct || 0,
          adr: match.adr || 0,
          perfGrade: match.ratingGrade || 'S',
          coolTitle: match.coolTitle || 'DOMINANT PERFORMANCE',
          customHeadline: customHeadline,
          isMatchMVP: match.isMatchMVP,
          isTeamMVP: match.isTeamMVP,
          userRank: mmrData?.current?.tier?.name || 'Unranked',
          userRankImgUrl: getRankImgUrl(mmrData?.current?.tier?.name),
          rounds,
          alliedPlayers,
          enemyPlayers
        };

        await renderMatchCardToCanvas(canvasEl, matchData, activeTheme, {
          format: aspectFormat,
          showScoreboard,
          showTimeline,
          showFeats
        });
      } else {
        // Profile Mode
        let topAgents = [];
        if (stats?.agentMap && Object.keys(stats.agentMap).length) {
          topAgents = Object.entries(stats.agentMap)
            .sort((a, b) => b[1].matches - a[1].matches)
            .slice(0, 3)
            .map(([name, data]) => ({
              name,
              iconUrl: getAgentIconUrl(name),
              matches: data.matches || 0,
              winRate: Math.round(((data.wins || 0) / Math.max(1, data.matches || 1)) * 100)
            }));
        }

        const matchesList = actFilteredMatches || [];
        const totalMatches = matchesList.length || stats?.matches || 0;
        const totalWins = matchesList.filter(m => m.result === 'WIN').length || stats?.wins || 0;
        const totalLosses = totalMatches - totalWins;

        const profileData = {
          playerName: playerName || 'VALORANT PLAYER',
          playerTag: playerTag || '0000',
          region: region || 'ap',
          playerBannerUrl: accountData?.card?.wide || accountData?.card?.large || playerBannerUrl || '',
          currentRank: mmrData?.current?.tier?.name || 'Unranked',
          currentRankImgUrl: getRankImgUrl(mmrData?.current?.tier?.name),
          currentRR: mmrData?.current?.rr ?? 0,
          peakRank: mmrData?.peak?.tier?.name || 'Unranked',
          peakRankImgUrl: getRankImgUrl(mmrData?.peak?.tier?.name),
          matchesPlayed: totalMatches,
          winRate: totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0,
          wins: totalWins,
          losses: totalLosses,
          kdRatio: stats?.kd || 1.0,
          avgAcs: stats?.acs || 200,
          hsPct: stats?.hs || 20,
          topAgents,
          customHeadline: customHeadline
        };

        await renderProfileCardToCanvas(canvasEl, profileData, activeTheme, {
          format: aspectFormat
        });
      }
    } catch (e) {
      console.error('Error rendering export card canvas:', e);
    } finally {
      loading = false;
    }
  }

  async function downloadPNG() {
    if (!canvasEl) return;
    downloading = true;
    const link = document.createElement('a');
    link.download = `ValTracker_${playerName}_${cardType}_${Date.now()}.png`;
    link.href = canvasEl.toDataURL('image/png');
    link.click();
    showToast('✅ PNG Downloaded!', 'success');
    setTimeout(() => { downloading = false; }, 1200);
  }

  async function copyImageToClipboard() {
    if (!canvasEl) return;
    copying = true;
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        showToast("⚠️ Clipboard not supported. Use Download!", 'warning');
        copying = false;
        return;
      }
      canvasEl.toBlob(async (blob) => {
        if (!blob) {
          showToast("⚠️ Failed to generate image.", 'warning');
          copying = false;
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('✨ Image copied to clipboard!', 'success');
        } catch (writeErr) {
          console.error('Clipboard write error:', writeErr);
          showToast("⚠️ Browser blocked clipboard. Try downloading.", 'warning');
        }
        copying = false;
      }, 'image/png');
    } catch (e) {
      console.error('Copy to clipboard failed:', e);
      showToast('⚠️ Copy failed. Use download.', 'warning');
      copying = false;
    }
  }

  async function shareNative() {
    if (!canvasEl) return;
    try {
      canvasEl.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `ValTracker_${playerName}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${playerName}#${playerTag} — ValTracker.gg`,
            text: `Check out my Valorant stats on ValTracker.gg!`,
            files: [file]
          });
        } else {
          downloadPNG();
        }
      }, 'image/png');
    } catch (e) {
      console.error('Native share failed:', e);
    }
  }

  function shareTwitter() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = origin ? `${origin}/app?name=${encodeURIComponent(playerName)}&tag=${encodeURIComponent(playerTag)}` : '';
    const text = `Check out my ${cardType === 'match' ? 'Match Performance' : 'Valorant Profile Stats'} on ValTracker.gg! 🔥 #VALORANT @ValTracker`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function shareReddit() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = origin ? `${origin}/app?name=${encodeURIComponent(playerName)}&tag=${encodeURIComponent(playerTag)}` : '';
    const title = `[ValTracker] ${playerName}#${playerTag} ${cardType === 'match' ? 'Match Highlight' : 'Profile Stats'}`;
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`, '_blank');
  }

  function showToast(msg, type = 'success') {
    copyFeedbackMsg = msg;
    copyFeedback = true;
    setTimeout(() => {
      copyFeedback = false;
    }, 2800);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="ecm-backdrop" on:click|self={onClose}>
    <div class="ecm-container" style="--theme-accent: {activeTheme.accent}; --theme-accent-shadow: {activeTheme.accentShadow}; --theme-border: {activeTheme.border};">
      
      <!-- ═══ MODAL HEADER ═══ -->
      <div class="ecm-header">
        <div class="ecm-header-left">
          <div class="ecm-header-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h2 class="ecm-title">EXPORT STATS CARD</h2>
            <p class="ecm-subtitle">Generate high-res graphics to flex on social media</p>
          </div>
        </div>

        <div class="ecm-header-right">
          <!-- Card Type Toggle -->
          <div class="ecm-type-toggle">
            <button 
              class="ecm-type-btn" 
              class:active={cardType === 'match'}
              disabled={!match}
              on:click={() => { cardType = 'match'; renderCard(); }}
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14.5A6.5 6.5 0 1110 3.5a6.5 6.5 0 010 13z"/>
                <path d="M8 7l5 3-5 3V7z"/>
              </svg>
              MATCH CARD
            </button>
            <button 
              class="ecm-type-btn"
              class:active={cardType === 'profile'}
              on:click={() => { cardType = 'profile'; renderCard(); }}
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/>
              </svg>
              PROFILE CARD
            </button>
          </div>

          <button class="ecm-close-btn" on:click={onClose} title="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ═══ MODAL BODY ═══ -->
      <div class="ecm-body">
        
        <!-- LEFT: Canvas Preview -->
        <div class="ecm-preview-panel">
          <div class="ecm-preview-label">
            <span class="ecm-preview-dot"></span>
            LIVE PREVIEW
            {#if !loading}
              <span class="ecm-res-tag">{aspectFormat === '1:1' ? '1620 × 1620' : '2880 × 1620'}</span>
            {/if}
          </div>

          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div 
            class="ecm-canvas-tilt"
            class:glowing={previewGlowing}
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseLeave}
            style="transform: perspective(1200px) rotateX({rotateX}deg) rotateY({rotateY}deg);"
          >
            {#if loading}
              <div class="ecm-loading-overlay">
                <div class="ecm-spinner" style="border-top-color: {activeTheme.accent};"></div>
                <span class="ecm-loading-text">RENDERING CANVAS...</span>
              </div>
            {/if}
            <canvas 
              bind:this={canvasEl} 
              class="ecm-canvas"
              class:landscape={aspectFormat === '16:9'}
              class:square={aspectFormat === '1:1'}
              style="opacity: {loading ? 0 : 1};"
            ></canvas>
          </div>

          <div class="ecm-tilt-hint">
            <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor" style="opacity:0.5">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14.5A6.5 6.5 0 1110 3.5a6.5 6.5 0 010 13z"/>
              <path d="M10 6v4l3 3-1.5 1.5L8 11V6h2z"/>
            </svg>
            Hover for 3D tilt effect
          </div>
        </div>

        <!-- RIGHT: Customizer Sidebar -->
        <div class="ecm-sidebar">
          
          <!-- ─ THEME SECTION ─ -->
          <div class="ecm-section">
            <div class="ecm-section-label">
              <span class="ecm-section-icon">🎨</span>
              SELECT THEME
            </div>
            <div class="ecm-theme-grid">
              {#each EXPORT_THEMES as th}
                <button 
                  class="ecm-theme-card"
                  class:active={activeThemeId === th.id}
                  style="--t-accent: {th.accent}; --t-bg: {th.cardBg};"
                  on:click={() => { activeThemeId = th.id; renderCard(); }}
                >
                  <span class="ecm-theme-swatch" style="background: {th.accent}; box-shadow: 0 0 8px {th.accentShadow};"></span>
                  <span class="ecm-theme-name">{th.name}</span>
                  {#if activeThemeId === th.id}
                    <span class="ecm-theme-check">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <!-- ─ ASPECT RATIO SECTION ─ -->
          <div class="ecm-section">
            <div class="ecm-section-label">
              <span class="ecm-section-icon">📐</span>
              ASPECT RATIO
            </div>
            <div class="ecm-ratio-group">
              <button 
                class="ecm-ratio-btn"
                class:active={aspectFormat === '16:9'}
                on:click={() => { aspectFormat = '16:9'; renderCard(); }}
              >
                <div class="ecm-ratio-thumb landscape-thumb"></div>
                <div class="ecm-ratio-info">
                  <span class="ecm-ratio-name">16:9 LANDSCAPE</span>
                  <span class="ecm-ratio-desc">Twitter · Discord · Reddit</span>
                </div>
                {#if aspectFormat === '16:9'}
                  <div class="ecm-ratio-check">✓</div>
                {/if}
              </button>
              <button 
                class="ecm-ratio-btn"
                class:active={aspectFormat === '1:1'}
                on:click={() => { aspectFormat = '1:1'; renderCard(); }}
              >
                <div class="ecm-ratio-thumb square-thumb"></div>
                <div class="ecm-ratio-info">
                  <span class="ecm-ratio-name">1:1 SQUARE</span>
                  <span class="ecm-ratio-desc">Instagram · Avatar · Story</span>
                </div>
                {#if aspectFormat === '1:1'}
                  <div class="ecm-ratio-check">✓</div>
                {/if}
              </button>
            </div>
          </div>

          <!-- ─ CUSTOM HEADLINE ─ -->
          <div class="ecm-section">
            <div class="ecm-section-label">
              <span class="ecm-section-icon">✏️</span>
              CUSTOM HEADLINE
            </div>
            <div class="ecm-input-wrap">
              <input 
                type="text" 
                class="ecm-headline-input" 
                placeholder="e.g. RANK UP TO DIAMOND!" 
                bind:value={customHeadline}
                on:input={renderCard}
                maxlength="45"
              />
              {#if customHeadline}
                <span class="ecm-char-count">{customHeadline.length}/45</span>
              {/if}
            </div>
          </div>

          <!-- ─ DISPLAY TOGGLES (Match Mode Only) ─ -->
          {#if cardType === 'match'}
            <div class="ecm-section">
              <div class="ecm-section-label">
                <span class="ecm-section-icon">⚙️</span>
                DISPLAY ELEMENTS
              </div>
              <div class="ecm-toggles">
                <label class="ecm-toggle-row">
                  <div class="ecm-toggle-switch" class:on={showTimeline}>
                    <input type="checkbox" bind:checked={showTimeline} on:change={renderCard} />
                    <span class="ecm-toggle-knob"></span>
                  </div>
                  <span class="ecm-toggle-label">Round Timeline</span>
                </label>
                {#if aspectFormat === '16:9'}
                  <label class="ecm-toggle-row">
                    <div class="ecm-toggle-switch" class:on={showScoreboard}>
                      <input type="checkbox" bind:checked={showScoreboard} on:change={renderCard} />
                      <span class="ecm-toggle-knob"></span>
                    </div>
                    <span class="ecm-toggle-label">Scoreboard</span>
                  </label>
                {/if}
              </div>
            </div>
          {/if}

          <!-- ─ DIVIDER ─ -->
          <div class="ecm-divider"></div>

          <!-- ─ ACTION BUTTONS ─ -->
          <div class="ecm-actions">
            <button 
              class="ecm-btn-primary" 
              class:loading={downloading}
              on:click={downloadPNG}
              disabled={loading}
            >
              {#if downloading}
                <div class="ecm-btn-spinner"></div>
              {:else}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              {/if}
              DOWNLOAD PNG
            </button>

            <button 
              class="ecm-btn-secondary"
              class:loading={copying}
              on:click={copyImageToClipboard}
              disabled={loading}
            >
              {#if copying}
                <div class="ecm-btn-spinner" style="border-top-color: rgba(255,255,255,0.8)"></div>
              {:else}
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              {/if}
              COPY TO CLIPBOARD
            </button>

            <div class="ecm-social-row">
              <button class="ecm-social-btn ecm-native" on:click={shareNative} disabled={loading}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                SHARE
              </button>
              <button class="ecm-social-btn ecm-twitter" on:click={shareTwitter} disabled={loading}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                TWITTER
              </button>
              <button class="ecm-social-btn ecm-reddit" on:click={shareReddit} disabled={loading}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                REDDIT
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Toast notification -->
      {#if copyFeedback}
        <div class="ecm-toast" class:warning={copyFeedbackMsg.includes('⚠️')}>
          {copyFeedbackMsg}
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  /* ═══════════════════════════════════════════
     BACKDROP
  ═══════════════════════════════════════════ */
  .ecm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(3, 3, 7, 0.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: ecmFadeIn 0.25s ease;
  }

  @keyframes ecmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ═══════════════════════════════════════════
     MAIN CONTAINER
  ═══════════════════════════════════════════ */
  .ecm-container {
    background: #0b0b10;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    width: 100%;
    max-width: 1240px;
    max-height: 94vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 32px 80px rgba(0, 0, 0, 0.85),
      0 0 60px rgba(0,0,0,0.5);
    position: relative;
    animation: ecmSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes ecmSlideIn {
    from { opacity: 0; transform: scale(0.94) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Ambient glow border effect that follows theme */
  .ecm-container::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 21px;
    background: linear-gradient(135deg, var(--theme-accent, #fa4454) 0%, transparent 50%, transparent 100%);
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }

  /* ═══════════════════════════════════════════
     HEADER
  ═══════════════════════════════════════════ */
  .ecm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .ecm-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ecm-header-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, var(--theme-accent, #fa4454), rgba(250,68,84,0.4));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 16px var(--theme-accent-shadow, rgba(250,68,84,0.3));
    flex-shrink: 0;
  }

  .ecm-title {
    font-family: 'Barlow Condensed', 'DM Mono', sans-serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #ffffff;
    margin: 0;
    text-transform: uppercase;
  }

  .ecm-subtitle {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin: 3px 0 0 0;
    letter-spacing: 0.3px;
  }

  .ecm-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Type Toggle */
  .ecm-type-toggle {
    display: flex;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    padding: 3px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 2px;
  }

  .ecm-type-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 7px 14px;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .ecm-type-btn:hover:not(:disabled) {
    color: #fff;
    background: rgba(255,255,255,0.06);
  }

  .ecm-type-btn.active {
    background: var(--theme-accent, #fa4454);
    color: #fff;
    box-shadow: 0 2px 12px var(--theme-accent-shadow, rgba(250,68,84,0.35));
  }

  .ecm-type-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Close Button */
  .ecm-close-btn {
    width: 34px;
    height: 34px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%;
    color: rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .ecm-close-btn:hover {
    background: rgba(250,68,84,0.2);
    border-color: rgba(250,68,84,0.5);
    color: #fa4454;
    transform: rotate(90deg);
  }

  /* ═══════════════════════════════════════════
     BODY LAYOUT
  ═══════════════════════════════════════════ */
  .ecm-body {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 0;
    overflow: hidden;
    flex: 1;
    min-height: 0;
  }

  /* ═══════════════════════════════════════════
     PREVIEW PANEL (LEFT)
  ═══════════════════════════════════════════ */
  .ecm-preview-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 32px;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(var(--theme-accent, 250, 68, 84), 0.06) 0%, transparent 60%),
      #08080d;
    border-right: 1px solid rgba(255,255,255,0.06);
    position: relative;
    overflow: hidden;
    gap: 14px;
  }

  /* Subtle dot pattern */
  .ecm-preview-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .ecm-preview-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    align-self: flex-start;
  }

  .ecm-preview-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--theme-accent, #fa4454);
    box-shadow: 0 0 8px var(--theme-accent, #fa4454);
    animation: ecmPulse 2s ease infinite;
  }

  @keyframes ecmPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .ecm-res-tag {
    margin-left: auto;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    letter-spacing: 0.5px;
  }

  /* Canvas Tilt Wrapper */
  .ecm-canvas-tilt {
    transition: transform 0.1s cubic-bezier(0.2, 0, 0.2, 1);
    transform-style: preserve-3d;
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    border-radius: 14px;
  }

  .ecm-canvas-tilt.glowing {
    filter: drop-shadow(0 0 20px var(--theme-accent-shadow, rgba(250,68,84,0.2)));
  }

  /* Loading Overlay */
  .ecm-loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 14, 0.9);
    border-radius: 14px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .ecm-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(250,68,84,0.15);
    border-top-color: #fa4454;
    border-radius: 50%;
    animation: ecmSpin 0.75s linear infinite;
  }

  @keyframes ecmSpin {
    to { transform: rotate(360deg); }
  }

  .ecm-loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--theme-accent, #fa4454);
  }

  /* Canvas */
  .ecm-canvas {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow:
      0 20px 50px rgba(0,0,0,0.7),
      0 0 0 1px rgba(255,255,255,0.08);
    transition: box-shadow 0.3s ease, opacity 0.4s ease;
    display: block;
  }

  .ecm-canvas.landscape { max-height: 440px; }
  .ecm-canvas.square { max-height: 440px; aspect-ratio: 1/1; }

  .ecm-canvas-tilt:hover .ecm-canvas {
    box-shadow:
      0 28px 70px rgba(0,0,0,0.8),
      0 0 40px var(--theme-accent-shadow, rgba(250,68,84,0.2)),
      0 0 0 1px var(--theme-border, rgba(250,68,84,0.3));
  }

  .ecm-tilt-hint {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.3px;
    align-self: center;
  }

  /* ═══════════════════════════════════════════
     SIDEBAR (RIGHT)
  ═══════════════════════════════════════════ */
  .ecm-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    padding: 20px 22px;
    background: #0c0c13;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }

  .ecm-sidebar::-webkit-scrollbar {
    width: 4px;
  }
  .ecm-sidebar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
  }

  /* Section */
  .ecm-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .ecm-section-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
  }

  .ecm-section-icon {
    font-size: 12px;
  }

  /* ─ THEME GRID ─ */
  .ecm-theme-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .ecm-theme-card {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 9px;
    padding: 9px 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: left;
  }

  .ecm-theme-card:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.15);
  }

  .ecm-theme-card.active {
    background: rgba(255,255,255,0.07);
    border-color: var(--t-accent);
    box-shadow: 0 0 16px rgba(0,0,0,0.3), inset 0 0 0 1px var(--t-accent);
  }

  .ecm-theme-swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ecm-theme-name {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    letter-spacing: 0.3px;
    flex: 1;
  }

  .ecm-theme-check {
    font-size: 11px;
    color: var(--t-accent);
    font-weight: 900;
  }

  /* ─ ASPECT RATIO ─ */
  .ecm-ratio-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ecm-ratio-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .ecm-ratio-btn:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.15);
  }

  .ecm-ratio-btn.active {
    background: rgba(250,68,84,0.08);
    border-color: var(--theme-accent, #fa4454);
    box-shadow: 0 0 12px rgba(250,68,84,0.08);
  }

  .ecm-ratio-thumb {
    border-radius: 4px;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.25);
    flex-shrink: 0;
  }

  .landscape-thumb { width: 28px; height: 16px; }
  .square-thumb { width: 20px; height: 20px; }

  .ecm-ratio-btn.active .ecm-ratio-thumb {
    background: var(--theme-accent-shadow, rgba(250,68,84,0.3));
    border-color: var(--theme-accent, #fa4454);
  }

  .ecm-ratio-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .ecm-ratio-name {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
  }

  .ecm-ratio-desc {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.3px;
  }

  .ecm-ratio-check {
    color: var(--theme-accent, #fa4454);
    font-size: 13px;
    font-weight: 900;
  }

  /* ─ HEADLINE INPUT ─ */
  .ecm-input-wrap {
    position: relative;
  }

  .ecm-headline-input {
    width: 100%;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px;
    padding: 10px 13px;
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }

  .ecm-headline-input::placeholder {
    color: rgba(255,255,255,0.25);
  }

  .ecm-headline-input:focus {
    border-color: var(--theme-accent, #fa4454);
    box-shadow: 0 0 0 3px var(--theme-accent-shadow, rgba(250,68,84,0.15));
  }

  .ecm-char-count {
    position: absolute;
    right: 10px;
    bottom: -18px;
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    font-family: 'DM Mono', monospace;
  }

  /* ─ TOGGLES ─ */
  .ecm-toggles {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ecm-toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .ecm-toggle-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.15);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .ecm-toggle-switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .ecm-toggle-switch.on {
    background: var(--theme-accent, #fa4454);
    border-color: var(--theme-accent, #fa4454);
    box-shadow: 0 0 8px var(--theme-accent-shadow, rgba(250,68,84,0.3));
  }

  .ecm-toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  .ecm-toggle-switch.on .ecm-toggle-knob {
    transform: translateX(16px);
  }

  .ecm-toggle-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
  }

  /* ─ DIVIDER ─ */
  .ecm-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    margin-bottom: 20px;
    flex-shrink: 0;
  }

  /* ─ ACTION BUTTONS ─ */
  .ecm-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }

  .ecm-btn-primary {
    width: 100%;
    padding: 13px 16px;
    background: linear-gradient(135deg, var(--theme-accent, #fa4454) 0%, #c4303f 100%);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px var(--theme-accent-shadow, rgba(250,68,84,0.3));
    position: relative;
    overflow: hidden;
  }

  .ecm-btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.4s ease;
  }

  .ecm-btn-primary:hover:not(:disabled)::before {
    left: 100%;
  }

  .ecm-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px var(--theme-accent-shadow, rgba(250,68,84,0.45));
  }

  .ecm-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .ecm-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ecm-btn-secondary {
    width: 100%;
    padding: 11px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: rgba(255,255,255,0.85);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .ecm-btn-secondary:hover:not(:disabled) {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.22);
    color: #fff;
  }

  .ecm-btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ecm-btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ecmSpin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Social Buttons */
  .ecm-social-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }

  .ecm-social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 9px 6px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ecm-social-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ecm-native {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.7);
  }

  .ecm-native:hover:not(:disabled) {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .ecm-twitter {
    background: rgba(29, 155, 240, 0.1);
    border-color: rgba(29, 155, 240, 0.25);
    color: #1d9bf0;
  }

  .ecm-twitter:hover:not(:disabled) {
    background: rgba(29, 155, 240, 0.2);
    border-color: #1d9bf0;
    color: #fff;
  }

  .ecm-reddit {
    background: rgba(255, 69, 0, 0.1);
    border-color: rgba(255, 69, 0, 0.25);
    color: #ff4500;
  }

  .ecm-reddit:hover:not(:disabled) {
    background: rgba(255, 69, 0, 0.2);
    border-color: #ff4500;
    color: #fff;
  }

  /* ═══════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════ */
  .ecm-toast {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: #3ecf8e;
    color: #000;
    font-family: 'DM Mono', monospace;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 0.5px;
    padding: 10px 22px;
    border-radius: 30px;
    box-shadow: 0 8px 28px rgba(62, 207, 142, 0.4);
    animation: ecmToastPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    white-space: nowrap;
    z-index: 100;
  }

  .ecm-toast.warning {
    background: rgba(20, 20, 30, 0.97);
    color: #ff5757;
    border: 1px solid rgba(255, 87, 87, 0.4);
    box-shadow: 0 8px 28px rgba(255, 87, 87, 0.2);
  }

  @keyframes ecmToastPop {
    from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.9); }
    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  /* ═══════════════════════════════════════════
     RESPONSIVE
  ═══════════════════════════════════════════ */
  @media (max-width: 900px) {
    .ecm-body {
      grid-template-columns: 1fr;
      overflow-y: auto;
    }

    .ecm-preview-panel {
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 20px;
    }

    .ecm-sidebar {
      max-height: 50vh;
    }

    .ecm-type-toggle {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .ecm-backdrop {
      padding: 8px;
    }

    .ecm-container {
      border-radius: 14px;
      max-height: 98vh;
    }

    .ecm-header {
      padding: 14px 16px;
    }

    .ecm-title {
      font-size: 15px;
    }
  }
</style>

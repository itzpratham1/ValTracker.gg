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

  // 3D Tilt Preview state
  let rotateX = 0;
  let rotateY = 0;

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
    rotateX = ((y - centerY) / centerY) * -6;
    rotateY = ((x - centerX) / centerX) * 6;
  }

  function handleMouseLeave() {
    rotateX = 0;
    rotateY = 0;
  }

  async function renderCard() {
    loading = true;
    await tick();
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
    const link = document.createElement('a');
    link.download = `ValTracker_${playerName}_${cardType}_${Date.now()}.png`;
    link.href = canvasEl.toDataURL('image/png');
    link.click();
    showToast('PNG Downloaded!');
  }

  async function copyImageToClipboard() {
    if (!canvasEl) return;
    try {
      canvasEl.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Image copied to clipboard!');
        } else {
          showToast('Direct clipboard copy not supported by browser.');
        }
      }, 'image/png');
    } catch (e) {
      console.error('Copy to clipboard failed:', e);
      showToast('Failed to copy image.');
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
    const txt = encodeURIComponent(`Check out my ${cardType === 'match' ? 'Match Performance' : 'Valorant Profile Stats'} on ValTracker.gg! 🔥 #VALORANT @ValTracker`);
    window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank');
  }

  function shareReddit() {
    const title = encodeURIComponent(`[ValTracker] ${playerName}#${playerTag} ${cardType === 'match' ? 'Match Highlight' : 'Profile Stats'}`);
    window.open(`https://www.reddit.com/submit?title=${title}`, '_blank');
  }

  function showToast(msg) {
    copyFeedbackMsg = msg;
    copyFeedback = true;
    setTimeout(() => {
      copyFeedback = false;
    }, 2500);
  }
</script>

{#if open}
  <div class="export-modal-backdrop" on:click|self={onClose}>
    <div class="export-modal-container">
      
      <!-- Modal Header -->
      <div class="export-modal-header">
        <div class="header-title-group">
          <h2>EXPORT STATS CARD</h2>
          <p class="subtitle">Generate high-res graphics to flex your performance on social media</p>
        </div>

        <div class="header-right">
          <!-- Card Type Toggle -->
          <div class="type-toggle-group">
            <button 
              class="type-btn {cardType === 'match' ? 'active' : ''}" 
              disabled={!match}
              on:click={() => { cardType = 'match'; renderCard(); }}
            >
              🎮 MATCH CARD
            </button>
            <button 
              class="type-btn {cardType === 'profile' ? 'active' : ''}" 
              on:click={() => { cardType = 'profile'; renderCard(); }}
            >
              👤 PROFILE CARD
            </button>
          </div>

          <button class="close-btn" on:click={onClose}>✕</button>
        </div>
      </div>

      <!-- Modal Main Layout -->
      <div class="export-modal-body">
        
        <!-- Left: Interactive Canvas Preview -->
        <div class="preview-section">
          <div 
            class="canvas-tilt-wrapper"
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseLeave}
            style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg);"
          >
            {#if loading}
              <div class="canvas-loading-overlay">
                <div class="spinner"></div>
                <span>RENDERING HIGH-DPI CANVAS...</span>
              </div>
            {/if}

            <canvas 
              bind:this={canvasEl} 
              class="export-canvas {aspectFormat === '1:1' ? 'square' : 'landscape'}"
            ></canvas>
          </div>

          <div class="preview-hint">
            💡 Hover over the card to preview 3D tilt. High resolution export: {aspectFormat === '1:1' ? '1620x1620' : '2880x1620'}
          </div>
        </div>

        <!-- Right: Customizer Sidebar -->
        <div class="customizer-sidebar">
          
          <!-- Section 1: Themes -->
          <div class="setting-group">
            <label class="setting-label">SELECT BROADCAST THEME</label>
            <div class="theme-grid">
              {#each EXPORT_THEMES as th}
                <button 
                  class="theme-card {activeThemeId === th.id ? 'active' : ''}"
                  style="--theme-accent: {th.accent}; --theme-bg: {th.cardBg};"
                  on:click={() => { activeThemeId = th.id; renderCard(); }}
                >
                  <span class="theme-accent-dot"></span>
                  <span class="theme-name">{th.name}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Section 2: Format / Aspect Ratio -->
          <div class="setting-group">
            <label class="setting-label">EXPORT ASPECT RATIO</label>
            <div class="format-toggle-bar">
              <button 
                class="format-btn {aspectFormat === '16:9' ? 'active' : ''}"
                on:click={() => { aspectFormat = '16:9'; renderCard(); }}
              >
                📐 16:9 LANDSCAPE (Twitter / Discord)
              </button>
              <button 
                class="format-btn {aspectFormat === '1:1' ? 'active' : ''}"
                on:click={() => { aspectFormat = '1:1'; renderCard(); }}
              >
                ⬛ 1:1 SQUARE (Instagram / Avatar)
              </button>
            </div>
          </div>

          <!-- Section 3: Custom Headline -->
          <div class="setting-group">
            <label class="setting-label">CUSTOM HEADLINE / BANNER</label>
            <input 
              type="text" 
              class="headline-input" 
              placeholder="e.g. CHAMPIONS ROUND 2 or RANK UP TO DIAMOND!" 
              bind:value={customHeadline}
              on:input={renderCard}
              maxlength="45"
            />
          </div>

          <!-- Section 4: Display Toggles (Match Mode) -->
          {#if cardType === 'match'}
            <div class="setting-group">
              <label class="setting-label">DISPLAY ELEMENTS</label>
              <div class="toggles-row">
                <label class="toggle-checkbox">
                  <input type="checkbox" bind:checked={showTimeline} on:change={renderCard} />
                  <span>Timeline Dots</span>
                </label>
                {#if aspectFormat === '16:9'}
                  <label class="toggle-checkbox">
                    <input type="checkbox" bind:checked={showScoreboard} on:change={renderCard} />
                    <span>Scoreboard</span>
                  </label>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="actions-section">
            <button class="primary-action-btn download" on:click={downloadPNG}>
              📥 DOWNLOAD PNG
            </button>
            
            <button class="primary-action-btn copy" on:click={copyImageToClipboard}>
              📋 COPY TO CLIPBOARD
            </button>

            <button class="secondary-action-btn share" on:click={shareNative}>
              📲 NATIVE SHARE
            </button>

            <div class="social-share-row">
              <button class="social-btn twitter" on:click={shareTwitter}>
                🐦 TWITTER / X
              </button>
              <button class="social-btn reddit" on:click={shareReddit}>
                🤖 REDDIT
              </button>
            </div>
          </div>

        </div>

      </div>

      {#if copyFeedback}
        <div class="toast-feedback">
          {copyFeedbackMsg}
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  .export-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 4, 8, 0.88);
    backdrop-filter: blur(12px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .export-modal-container {
    background: rgba(12, 12, 18, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    width: 100%;
    max-width: 1280px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    position: relative;
  }

  .export-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }

  .header-title-group h2 {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #ffffff;
    margin: 0;
  }

  .header-title-group .subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 4px 0 0 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .type-toggle-group {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .type-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 800;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-btn:hover:not(:disabled) {
    color: #ffffff;
  }

  .type-btn.active {
    background: #fa4454;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.4);
  }

  .type-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(250, 68, 84, 0.2);
    border-color: #fa4454;
    color: #fa4454;
  }

  .export-modal-body {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    padding: 24px 28px;
    overflow-y: auto;
    max-height: calc(92vh - 85px);
  }

  /* Preview Section */
  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .canvas-tilt-wrapper {
    transition: transform 0.1s cubic-bezier(0.2, 0, 0.2, 1);
    transform-style: preserve-3d;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .canvas-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(4px);
    border-radius: 16px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #fa4454;
    font-weight: 800;
    font-size: 14px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(250, 68, 84, 0.2);
    border-top-color: #fa4454;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .export-canvas {
    max-width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }

  .canvas-tilt-wrapper:hover .export-canvas {
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(250, 68, 84, 0.25), 0 0 0 1px rgba(250, 68, 84, 0.4);
  }

  .export-canvas.landscape {
    max-height: 480px;
  }

  .export-canvas.square {
    max-height: 440px;
    aspect-ratio: 1 / 1;
  }

  .preview-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 16px;
    text-align: center;
  }

  /* Sidebar */
  .customizer-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-label {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
    color: rgba(255, 255, 255, 0.5);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .theme-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .theme-card.active {
    border-color: var(--theme-accent);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px var(--theme-accent);
  }

  .theme-accent-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--theme-accent);
  }

  .theme-name {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
  }

  .format-toggle-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .format-btn {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .format-btn.active {
    background: rgba(250, 68, 84, 0.15);
    border-color: #fa4454;
    color: #ffffff;
  }

  .headline-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 10px 14px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .headline-input:focus {
    border-color: #fa4454;
  }

  .toggles-row {
    display: flex;
    gap: 16px;
  }

  .toggle-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
  }

  /* Action Buttons */
  .actions-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .primary-action-btn {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .primary-action-btn.download {
    background: linear-gradient(135deg, #fa4454 0%, #cc2b3a 100%);
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(250, 68, 84, 0.3);
  }

  .primary-action-btn.download:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(250, 68, 84, 0.45);
  }

  .primary-action-btn.copy {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .primary-action-btn.copy:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  .secondary-action-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .social-share-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .social-btn {
    padding: 9px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.8);
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .social-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .toast-feedback {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #3ecf8e;
    color: #000000;
    font-weight: 900;
    font-size: 13px;
    padding: 10px 24px;
    border-radius: 30px;
    box-shadow: 0 8px 24px rgba(62, 207, 142, 0.4);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes popIn {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  @media (max-width: 900px) {
    .export-modal-body {
      grid-template-columns: 1fr;
    }
  }
</style>

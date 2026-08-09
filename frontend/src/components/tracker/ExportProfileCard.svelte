<script>
  import { tick } from 'svelte';
  import { getAgentIconUrl, getAgentPortraitUrl } from '../../lib/assets';
  import { getRankImgUrl } from '../../lib/constants';

  export let open = false;
  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let mmrHistory = {};
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let mode = 'competitive';
  export let onClose = () => {};

  let loading = false;
  let loaded = false;
  let loadingTxt = 'GENERATING STATS CARD...';
  let imgPreview = '';
  let copyFeedback = false;

  // Theme Options
  const FLEX_THEMES = [
    {
      id: 'champions',
      name: 'VCT Champions',
      badge: '🏆 CHAMPIONS',
      accent: '#ffd700',
      accentShadow: 'rgba(255, 215, 0, 0.4)',
      border: 'rgba(255, 215, 0, 0.45)',
      bgGradient: 'radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.16) 0%, rgba(18, 14, 4, 0.97) 70%, rgba(8, 6, 2, 0.99) 100%)',
      cardBg: '#090805'
    },
    {
      id: 'obsidian',
      name: 'Obsidian Valor',
      badge: '🔥 OBSIDIAN',
      accent: '#fa4454',
      accentShadow: 'rgba(250, 68, 84, 0.35)',
      border: 'rgba(250, 68, 84, 0.4)',
      bgGradient: 'radial-gradient(circle at 20% 30%, rgba(250, 68, 84, 0.12) 0%, rgba(10, 10, 15, 0.96) 70%, rgba(4, 4, 6, 0.99) 100%)',
      cardBg: '#050508'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      badge: '⚡ CYBERPUNK',
      accent: '#00f3ff',
      accentShadow: 'rgba(0, 243, 255, 0.4)',
      border: 'rgba(0, 243, 255, 0.4)',
      bgGradient: 'radial-gradient(circle at 80% 20%, rgba(255, 0, 85, 0.15) 0%, rgba(6, 12, 24, 0.97) 70%, rgba(3, 6, 14, 0.99) 100%)',
      cardBg: '#040810'
    },
    {
      id: 'icebox',
      name: 'Icebox Frost',
      badge: '❄️ FROST',
      accent: '#38bdf8',
      accentShadow: 'rgba(56, 189, 248, 0.4)',
      border: 'rgba(56, 189, 248, 0.4)',
      bgGradient: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.18) 0%, rgba(10, 20, 30, 0.96) 70%, rgba(4, 8, 15, 0.99) 100%)',
      cardBg: '#060c14'
    },
    {
      id: 'sovereign',
      name: 'Sovereign Minimal',
      badge: '☯️ SOVEREIGN',
      accent: '#ffffff',
      accentShadow: 'rgba(255, 255, 255, 0.25)',
      border: 'rgba(255, 255, 255, 0.25)',
      bgGradient: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.06) 0%, rgba(15, 15, 18, 0.98) 70%, rgba(8, 8, 10, 0.99) 100%)',
      cardBg: '#09090b'
    }
  ];

  let selectedThemeId = 'champions';
  $: activeTheme = FLEX_THEMES.find(t => t.id === selectedThemeId) || FLEX_THEMES[0];

  // 3D Tilt Preview
  let rotateX = 0;
  let rotateY = 0;

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

  $: if (open) generateCard();

  function getRankName() {
    return mmrData?.current?.tier?.name || 'Unranked';
  }

  function getRRText() {
    const rr = mmrData?.current?.rr;
    return rr != null ? `${rr} RR` : '';
  }

  function getPeakName() {
    return mmrData?.peak?.tier?.name || '';
  }

  function getTopAgent() {
    if (!stats?.agentMap) return '—';
    const entries = Object.entries(stats.agentMap);
    if (!entries.length) return '—';
    return entries.sort((a, b) => b[1].matches - a[1].matches)[0][0];
  }

  async function selectTheme(themeId) {
    if (selectedThemeId === themeId) return;
    selectedThemeId = themeId;
    activeTheme = FLEX_THEMES.find(t => t.id === themeId) || FLEX_THEMES[0];
    await tick();
    await generateCard();
  }

  async function generateCard() {
    if (!open || !stats) return;
    loading = true;
    loaded = false;
    loadingTxt = 'COMPILING PROFILE FLEX CARD...';

    const matches = stats.recentMatches || [];
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const total = wins + losses;
    const wr = total ? Math.round((wins / total) * 100) : 0;
    const kd = stats.kd || '0.00';
    const totalK = matches.reduce((s, m) => s + (m.kills || 0), 0);
    const totalD = matches.reduce((s, m) => s + (m.deaths || 0), 0);
    const avgACS = stats.avgACS || 0;
    const avgHS = stats.hsRate || 0;
    const rankName = getRankName();
    const rrTxt = getRRText();
    const regionUpper = (region || 'ap').toUpperCase();
    const modeName = mode === 'competitive' ? 'Competitive' : (mode || 'competitive').toUpperCase();

    const topAgent = getTopAgent();
    const topAgentIcon = getAgentIconUrl(topAgent);
    const topAgentPortrait = getAgentPortraitUrl(topAgent) || topAgentIcon || '';

    const peakName = getPeakName();

    const rImg = getRankImgUrl(rankName);
    const rankImgHtml = rImg
      ? `<img src="${rImg}" crossorigin="anonymous" style="width:36px; height:36px; object-fit:contain;">`
      : `<div style="font-size:18px; color:#ffd700;">🏆</div>`;

    const bannerUrl = accountData?.card?.wide || accountData?.card?.large || '';
    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const formMatches = matches.slice(0, 10);
    const recentFormHtml = formMatches.map(m => {
      const isWin = m.won;
      const aIcon = getAgentIconUrl(m.agentName);
      const rr = mmrHistory[m.matchId];
      const rrDisplay = rr !== undefined ? (rr > 0 ? `+${rr}` : `${rr}`) : '';
      const rrColor = rr > 0 ? '#3ecf8e' : '#ff5757';

      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; padding:6px 4px; background:${isWin ? 'rgba(62,207,142,0.06)' : 'rgba(255,87,87,0.05)'}; border:1px solid ${isWin ? 'rgba(62,207,142,0.25)' : 'rgba(255,87,87,0.18)'}; border-radius:10px; box-sizing:border-box;">
          <span style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:900; color:${isWin ? '#3ecf8e' : '#ff5757'}; line-height:1;">${isWin ? 'W' : 'L'}</span>
          ${aIcon ? `<img src="${aIcon}" crossorigin="anonymous" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255,255,255,0.15);">` : `<div style="width:20px; height:20px; background:rgba(255,255,255,0.05); border-radius:50%;"></div>`}
          <span style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.45); text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${(m.agentName || '').substring(0, 4)}</span>
          ${rrDisplay ? `<span style="font-family:'DM Mono',monospace; font-size:8px; font-weight:700; color:${rrColor}; line-height:1;">${rrDisplay}</span>` : `<span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); line-height:1;">--</span>`}
        </div>
      `;
    }).join('');

    const playerTopAgentIcon = getAgentIconUrl(topAgent);
    const avatarHtml = playerTopAgentIcon
      ? `<img src="${playerTopAgentIcon}" crossorigin="anonymous" style="width:100%; height:100%; object-fit:cover;">`
      : `<div style="font-size:24px; color:rgba(255,255,255,0.4)">👤</div>`;

    document.getElementById('export-profile-capture').innerHTML = `
      <div id="profile-capture-target" style="width: 780px; height: 460px; padding: 24px; background: ${activeTheme.cardBg}; border: 1.5px solid ${activeTheme.border}; border-radius: 22px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box; position:relative; overflow:hidden; box-shadow:0 30px 70px rgba(0,0,0,0.95), 0 0 35px ${activeTheme.accentShadow}; display:flex; flex-direction:column; justify-content:space-between;">
        ${bannerUrl ? `<img src="${bannerUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.22; filter: blur(1px); pointer-events:none; z-index:0;">` : ''}
        <div style="position:absolute; inset:0; background: ${activeTheme.bgGradient}; z-index:1; pointer-events:none;"></div>
        <div style="position:absolute; left:0; top:0; bottom:0; width:5px; background:${activeTheme.accent}; border-radius:22px 0 0 22px; z-index:4; box-shadow:3px 0 18px ${activeTheme.accentShadow};"></div>

        <!-- Agent Portrait Silhouette (Right Side) -->
        ${topAgentPortrait ? `<img src="${topAgentPortrait}" crossorigin="anonymous" style="position:absolute; right:-15px; bottom:-20px; height:105%; object-fit:contain; opacity:0.22; filter:drop-shadow(0 0 18px ${activeTheme.accentShadow}); pointer-events:none; z-index:2;" />` : ''}

        <div style="position:relative; z-index:3; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
          <!-- Header Row (Height: 56px) -->
          <div style="display:flex; justify-content:space-between; align-items:center; height:56px; border-bottom:1px solid rgba(255, 255, 255, 0.08); padding-bottom:10px; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:14px;">
              <img src="/logo.png" style="height:26px; width:auto; filter:drop-shadow(0 0 8px ${activeTheme.accentShadow}); display:block;" alt="ValTracker Logo" />
              <div style="width:48px; height:48px; border-radius:50%; border:2px solid ${activeTheme.accent}; display:flex; align-items:center; justify-content:center; background:rgba(0, 0, 0, 0.5); overflow:hidden; flex-shrink:0; box-shadow:0 0 12px ${activeTheme.accentShadow};">
                ${avatarHtml}
              </div>
              <div>
                <div style="display:flex; align-items:baseline; gap:6px;">
                  <span style="font-size:26px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; color:#fff; line-height:1;">${playerName}</span>
                  <span style="font-family:'DM Mono',monospace; font-size:14px; color:${activeTheme.accent}; font-weight:700;">#${playerTag}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                  <span style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.5); text-transform:uppercase; border:1px solid rgba(255,255,255,0.12); padding:2px 6px; border-radius:4px; line-height:1;">${regionUpper} Region</span>
                  <span style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.5); text-transform:uppercase; border:1px solid rgba(255,255,255,0.12); padding:2px 6px; border-radius:4px; line-height:1;">${modeName}</span>
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.1); padding:6px 14px; border-radius:30px; height:44px; box-sizing:border-box;">
              ${rankImgHtml}
              <div style="text-align:left;">
                <div style="font-size:13px; font-weight:900; text-transform:uppercase; color:#fff; line-height:1.1;">${rankName}</div>
                <div style="font-family:'DM Mono',monospace; font-size:9px; font-weight:bold; margin-top:1px; line-height:1; display:flex; align-items:center; gap:6px;">
                  ${rrTxt ? `<span style="color:#ffb01f;">${rrTxt}</span>` : ''}
                  ${peakName ? `<span style="color:rgba(255,255,255,0.4); font-size:8.5px;">Peak: ${peakName}</span>` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Stat Matrix (Height: 74px) -->
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:10px; height:74px; box-sizing:border-box; margin-top:12px;">
            <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:10px 8px; border-radius:12px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;">
              <div style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.45); letter-spacing:0.8px; text-transform:uppercase; line-height:1;">K / D Ratio</div>
              <div style="font-size:24px; font-weight:900; color:${parseFloat(kd) >= 1 ? '#3ecf8e' : '#fa4454'}; line-height:1;">${kd}</div>
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.25); line-height:1;">${totalK} K / ${totalD} D</div>
            </div>
            <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:10px 8px; border-radius:12px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;">
              <div style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.45); letter-spacing:0.8px; text-transform:uppercase; line-height:1;">Win Rate</div>
              <div style="font-size:24px; font-weight:900; color:${wr >= 50 ? '#3ecf8e' : '#ff5757'}; line-height:1;">${wr}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.25); line-height:1;">${wins}W - ${losses}L</div>
            </div>
            <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:10px 8px; border-radius:12px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;">
              <div style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.45); letter-spacing:0.8px; text-transform:uppercase; line-height:1;">AVG ACS</div>
              <div style="font-size:24px; font-weight:900; color:#fff; line-height:1;">${avgACS}</div>
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.25); line-height:1;">Per Match</div>
            </div>
            <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:10px 8px; border-radius:12px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;">
              <div style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.45); letter-spacing:0.8px; text-transform:uppercase; line-height:1;">Headshot %</div>
              <div style="font-size:24px; font-weight:900; color:${avgHS >= 25 ? '#3ecf8e' : avgHS >= 15 ? '#ffd700' : '#fa4454'}; line-height:1;">${avgHS}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.25); line-height:1;">Hit Accuracy</div>
            </div>
            <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:10px 8px; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;">
              <div style="font-family:'DM Mono',monospace; font-size:8.5px; color:rgba(255,255,255,0.45); letter-spacing:0.8px; text-transform:uppercase; line-height:1;">Top Agent</div>
              <div style="display:flex; align-items:center; gap:5px;">
                ${topAgentIconHtml ? topAgentIconHtml : ''}
                <span style="font-size:15px; font-weight:900; color:#fff; text-transform:uppercase; line-height:1;">${topAgent}</span>
              </div>
              <div style="font-family:'DM Mono',monospace; font-size:7.5px; color:rgba(255,255,255,0.25); line-height:1;">${Object.entries(stats.agentMap || {}).sort((a, b) => b[1].matches - a[1].matches)[0]?.[1]?.matches || 0} Matches</div>
            </div>
          </div>

          <!-- Recent Form (Height: 80px) -->
          <div style="background:rgba(15, 15, 22, 0.75); border:1px solid rgba(255, 255, 255, 0.08); padding:12px; border-radius:14px; box-sizing:border-box; margin-top:12px; height:80px; display:flex; flex-direction:column; justify-content:space-between;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:${activeTheme.accent}; letter-spacing:1.2px; text-transform:uppercase; font-weight:700; line-height:1;">RECENT PERFORMANCE (LAST ${formMatches.length} MATCHES)</div>
            <div style="display:flex; gap:6px; justify-content:space-between; height:50px;">
              ${recentFormHtml}
            </div>
          </div>

          <!-- Footer Row (Height: 20px) -->
          <div style="display:flex; justify-content:space-between; align-items:center; font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); margin-top:12px; height:20px; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:6px; line-height:1;">
              <img src="/logo.png" style="height:13px; width:auto; display:block;" alt="" />
              <span>Generated by ValTracker.gg · ${now}</span>
            </div>
            <div style="color:${activeTheme.accent}; font-weight:bold; letter-spacing:0.8px; line-height:1;">TRACK. ANALYZE. CONQUER.</div>
          </div>
        </div>
      </div>
    `;

    await tick();

    setTimeout(async () => {
      try {
        if (typeof html2canvas === 'undefined') {
          loadingTxt = 'Loading engine...';
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        const el = document.getElementById('profile-capture-target');
        if (!el) { loading = false; return; }

        const canvas = await html2canvas(el, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true
        });

        imgPreview = canvas.toDataURL('image/png');
        loading = false;
        loaded = true;
      } catch (e) {
        console.error('[Profile Card Capture Error]', e);
        loadingTxt = 'Failed to compile stats card.';
        loading = false;
      }
    }, 120);
  }

  async function copyImageToClipboard() {
    try {
      const el = document.getElementById('profile-capture-target');
      if (!el || typeof html2canvas === 'undefined') return;

      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2.0,
        useCORS: true
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copyFeedback = true;
          setTimeout(() => { copyFeedback = false; }, 3000);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  }

  function downloadCard() {
    if (!imgPreview) return;
    const a = document.createElement('a');
    a.href = imgPreview;
    a.download = `valtracker_${activeTheme.id}_stats_${playerName}_${Date.now()}.png`;
    a.click();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="share-modal-overlay" class:open={open} on:click|self={onClose}>
  <div class="share-modal">
    <div class="share-modal-header">
      <div class="share-modal-title">
        <img src="/logo.png" style="height:22px; width:auto;" alt="Logo" />
        Export Profile Flex Card
      </div>
      <button class="share-modal-close" on:click={onClose}>&#10005;</button>
    </div>

    <div class="share-modal-body">
      <!-- Interactive Theme Bar -->
      <div class="theme-bar-wrap">
        <div class="theme-bar-label">SELECT LUXURY THEME:</div>
        <div class="theme-pills">
          {#each FLEX_THEMES as theme}
            <button 
              class="theme-pill" 
              class:active={selectedThemeId === theme.id}
              style="--t-accent:{theme.accent}; --t-border:{theme.border}"
              on:click={() => selectTheme(theme.id)}
            >
              <span class="theme-dot" style="background:{theme.accent}"></span>
              {theme.name}
            </button>
          {/each}
        </div>
      </div>

      {#if loading}
        <div class="share-loading">
          <div class="share-spinner" style="border-top-color:{activeTheme.accent}"></div>
          <div class="share-loading-txt">{loadingTxt}</div>
        </div>
      {/if}

      {#if loaded}
        <div class="share-loaded">
          <!-- 3D Tilt Preview Container -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div 
            class="share-preview-wrap" 
            on:mousemove={handleMouseMove} 
            on:mouseleave={handleMouseLeave}
            style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg);"
          >
            <img class="share-preview-img" src={imgPreview} alt="Profile Flex Card Preview" />
            <div class="share-preview-badge" style="border: 1px solid {activeTheme.accent}50; color:{activeTheme.accent};">
              {activeTheme.badge} PREVIEW (3D INTERACTIVE)
            </div>
          </div>

          {#if copyFeedback}
            <div class="share-clipboard-status">✨ Profile Flex Card Image copied to Clipboard! Ready to paste into Discord/X.</div>
          {/if}

          <div class="share-buttons">
            <button class="share-btn share-btn-copy" on:click={copyImageToClipboard}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Copy Image
            </button>
            <button class="share-btn share-btn-download" on:click={downloadCard}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download HD PNG
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div id="export-profile-capture" style="position:absolute; left:-9999px; top:0;"></div>
</div>

<style>
  .share-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(8px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .share-modal-overlay.open { display: flex; }

  .share-modal {
    max-width: 720px;
    width: 95%;
    background: linear-gradient(180deg, #0d0d12 0%, #050508 100%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 70px rgba(0,0,0,0.9);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .share-modal-title {
    color: #fff;
    font-size: 19px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .share-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 20px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .share-modal-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

  .share-modal-body {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 78vh;
    overflow-y: auto;
  }

  .theme-bar-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-bar-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 1px;
    font-weight: 700;
  }

  .theme-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .theme-pill {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .theme-pill:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }

  .theme-pill.active {
    background: rgba(255,255,255,0.12);
    border-color: var(--t-border);
    color: #fff;
    box-shadow: 0 0 12px var(--t-accent);
  }

  .theme-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .share-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
  }

  .share-loading-txt {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #fa4454;
    letter-spacing: 1px;
  }

  .share-loaded {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .share-preview-wrap {
    position: relative;
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.4);
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    transition: transform 0.15s ease-out;
    transform-style: preserve-3d;
  }

  .share-preview-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .share-preview-badge {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(6px);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .share-clipboard-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
    background: rgba(62, 207, 142, 0.1);
    border: 1px solid rgba(62, 207, 142, 0.3);
    padding: 8px;
    border-radius: 8px;
  }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .share-btn {
    border: none;
    border-radius: 8px;
    padding: 12px 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .share-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .share-btn-copy { background: linear-gradient(135deg, #3ecf8e 0%, #10b981 100%); color: #000; }
  .share-btn-download { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; }

  .share-spinner {
    width: 34px;
    height: 34px;
    border: 2.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: share-spin 0.7s linear infinite;
  }
  @keyframes share-spin { to { transform: rotate(360deg); } }
</style>

<script>
  import { tick } from 'svelte';
  import { getAgentIconUrl, getMapImg } from '../../lib/assets';
  import { getRankImgUrl } from '../../lib/constants';
  import { getPlayerList } from '../../lib/utils';

  export let open = false;
  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let mmrHistory = {};
  export let actFilteredMatches = [];
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let mode = 'competitive';
  export let onClose = () => {};

  let loading = false;
  let loaded = false;
  let loadingTxt = 'GENERATING STATS CARD...';
  let imgPreview = '';

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

  async function generateCard() {
    if (!open || !stats) return;
    loading = true;
    loaded = false;
    loadingTxt = 'GENERATING STATS CARD...';

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
    const topAgentIconHtml = topAgentIcon
      ? `<img src="${topAgentIcon}" crossorigin="anonymous" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255, 70, 85, 0.4); display:block;">`
      : '';

    const peakName = getPeakName();
    const peakImg = getRankImgUrl(peakName);

    const rImg = getRankImgUrl(rankName);
    const rankImgHtml = rImg
      ? `<img src="${rImg}" crossorigin="anonymous" style="width:32px; height:32px; object-fit:contain;">`
      : `<div style="font-size:16px; color:#ffd700;">🏆</div>`;

    const bannerUrl = accountData?.card?.wide || accountData?.card?.large || '';
    const cardUrl = bannerUrl;

    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const formMatches = matches.slice(0, 10);
    const recentFormHtml = formMatches.map(m => {
      const isWin = m.won;
      const aIcon = getAgentIconUrl(m.agentName);
      const rr = mmrHistory[m.matchId];
      const rrDisplay = rr !== undefined ? (rr > 0 ? `+${rr}` : `${rr}`) : '';
      const rrColor = rr > 0 ? '#3ecf8e' : '#ff5757';

      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 4px; background:${isWin ? 'rgba(62,207,142,0.06)' : 'rgba(255,87,87,0.05)'}; border:1px solid ${isWin ? 'rgba(62,207,142,0.25)' : 'rgba(255,87,87,0.18)'}; border-radius:10px; min-width:48px; box-sizing:border-box;">
          <span style="font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:900; color:${isWin ? '#3ecf8e' : '#ff5757'}; line-height:1;">${isWin ? 'W' : 'L'}</span>
          ${aIcon ? `<img src="${aIcon}" crossorigin="anonymous" style="width:22px; height:22px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.08); box-shadow:0 2px 6px rgba(0,0,0,0.3);">` : `<div style="width:22px; height:22px; background:rgba(255,255,255,0.05); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:rgba(255,255,255,0.4)">👤</div>`}
          <span style="font-family:'DM Mono',monospace; font-size:7px; color:rgba(255,255,255,0.4); text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; max-width:100%; white-space:nowrap; text-align:center;">${(m.agentName || '').substring(0, 4)}</span>
          ${rrDisplay ? `<span style="font-family:'DM Mono',monospace; font-size:8px; font-weight:700; color:${rrColor}; line-height:1;">${rrDisplay}</span>` : `<span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.15); line-height:1;">--</span>`}
        </div>
      `;
    }).join('');

    const playerTopAgentIcon = getAgentIconUrl(topAgent);
    const avatarHtml = playerTopAgentIcon
      ? `<img src="${playerTopAgentIcon}" crossorigin="anonymous" style="width:100%; height:100%; object-fit:cover;">`
      : `<div style="font-size:24px; color:rgba(255,255,255,0.4)">👤</div>`;

    document.getElementById('export-profile-capture').innerHTML = `
      <div id="profile-capture-target" style="width: 720px; padding: 28px; background: #060608; border: 2px solid rgba(255, 70, 85, 0.45); border-radius: 20px; color: #fff; font-family:'Barlow Condensed', sans-serif; box-sizing:border-box; position:relative; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
        ${cardUrl ? `<img src="${cardUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.35; filter: blur(0.5px); pointer-events:none; z-index:0;">` : ''}
        ${cardUrl ? `<div style="position:absolute; inset:0; background: linear-gradient(135deg, rgba(12, 12, 16, 0.84) 0%, rgba(6, 6, 8, 0.94) 100%); z-index:1; pointer-events:none;"></div>` : ''}
        <div style="position:absolute; top:-40px; right:-40px; width:120px; height:120px; background:rgba(255, 70, 85, 0.08); border-radius:50%; filter:blur(20px); z-index:1;"></div>
        <div style="position:absolute; inset:0; border:1px solid rgba(255,255,255,0.03); border-radius:18px; pointer-events:none; z-index:1;"></div>
        <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:#ff4655; border-radius:20px 0 0 20px; z-index:2;"></div>

        <div style="position:relative; z-index:2;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(255, 70, 85, 0.15); padding-bottom:14px; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:52px; height:52px; border-radius:50%; border:2px solid #ff4655; display:flex; align-items:center; justify-content:center; background:rgba(255, 70, 85, 0.05); overflow:hidden; flex-shrink:0;">
                ${avatarHtml}
              </div>
              <div>
                <div style="display:flex; align-items:baseline; gap:6px;">
                  <span style="font-size:26px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; color:#fff; line-height:1;">${playerName}</span>
                  <span style="font-family:'DM Mono',monospace; font-size:14px; color:#ff4655; font-weight:700;">#${playerTag}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                  <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; border:1px solid rgba(255,255,255,0.1); padding:1px 6px; border-radius:4px; line-height:1;">${regionUpper} Region</span>
                  <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; border:1px solid rgba(255,255,255,0.1); padding:1px 6px; border-radius:4px; line-height:1;">${modeName}</span>
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.05)'}; padding:6px 14px; border-radius:30px;">
              ${rankImgHtml}
              <div style="text-align:left;">
                <div style="font-size:13px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1.1;">${rankName}</div>
                <div style="font-family:'DM Mono',monospace; font-size:9px; font-weight:bold; margin-top:2px; line-height:1; display:flex; align-items:center; gap:6px;">
                  ${rrTxt ? `<span style="color:#ffb01f;">${rrTxt}</span>` : ''}
                  ${peakName ? `<span style="color:rgba(255,255,255,0.35); font-size:9px;">Peak: ${peakName}</span>` : ''}
                </div>
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; margin-bottom:24px;">
            <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">K / D Ratio</div>
              <div style="font-size:26px; font-weight:900; color:#ff4655; line-height:1;">${kd}</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">${totalK} K / ${totalD} D</div>
            </div>
            <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Win Rate</div>
              <div style="font-size:26px; font-weight:900; color:${wr >= 50 ? '#3ecf8e' : '#ff5757'}; line-height:1;">${wr}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">${wins}W - ${losses}L</div>
            </div>
            <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">AVG ACS</div>
              <div style="font-size:26px; font-weight:900; color:#fff; line-height:1;">${avgACS}</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">Per Match</div>
            </div>
            <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Headshot %</div>
              <div style="font-size:26px; font-weight:900; color:${avgHS >= 25 ? '#3ecf8e' : avgHS >= 15 ? '#ffd700' : '#ff5757'}; line-height:1;">${avgHS}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:4px;">Hit Accuracy</div>
            </div>
            <div style="background:${cardUrl ? 'rgba(10, 10, 14, 0.65)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${cardUrl ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.04)'}; padding:12px 10px; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:68px;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">Top Agent</div>
              <div style="display:flex; align-items:center; gap:6px;">
                ${topAgentIconHtml}
                <span style="font-size:16px; font-weight:900; color:#fff; text-transform:uppercase;">${topAgent}</span>
              </div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); margin-top:2px;">${Object.entries(stats.agentMap || {}).sort((a, b) => b[1].matches - a[1].matches)[0]?.[1]?.matches || 0} Matches</div>
            </div>
          </div>

          <div style="background:${cardUrl ? 'rgba(255, 70, 85, 0.05)' : 'rgba(255, 70, 85, 0.03)'}; border:1px solid ${cardUrl ? 'rgba(255, 70, 85, 0.18)' : 'rgba(255, 70, 85, 0.1)'}; padding:16px; border-radius:14px; box-sizing:border-box;">
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255, 70, 85, 0.7); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px; font-weight:700;">RECENT PERFORMANCE (LAST ${formMatches.length} MATCHES)</div>
            <div style="display:flex; gap:6px; justify-content:space-between;">
              ${recentFormHtml}
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.30);">
            <div>Generated by VALTRACKER · ${now}</div>
            <div style="color:rgba(255, 70, 85, 0.45); font-weight:bold; letter-spacing:0.5px;">TRACK. ANALYZE. CONQUER.</div>
          </div>
        </div>
      </div>
    `;

    await tick();

    setTimeout(async () => {
      try {
        if (typeof html2canvas === 'undefined') {
          loadingTxt = 'Loading image generator...';
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
        setTimeout(onClose, 1500);
      }
    }, 120);
  }

  function downloadCard() {
    if (!imgPreview) return;
    const a = document.createElement('a');
    a.href = imgPreview;
    a.download = `valtracker_stats_${playerName}_${Date.now()}.png`;
    a.click();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="share-modal-overlay" class:open={open} on:click|self={onClose}>
  <div class="share-modal">
    <div class="share-modal-header">
      <div class="share-modal-title">📊 Export Stats Card</div>
      <button class="share-modal-close" on:click={onClose}>&#10005;</button>
    </div>

    <div class="share-modal-body">
      {#if loading}
        <div class="share-loading">
          <div class="share-spinner"></div>
          <div class="share-loading-txt">{loadingTxt}</div>
        </div>
      {/if}

      {#if loaded}
        <div class="share-loaded">
          <div class="share-preview-wrap">
            <img class="share-preview-img" src={imgPreview} alt="Stats Card Preview" />
            <div class="share-preview-badge">Stats Card Preview</div>
          </div>

          <div class="share-buttons">
            <button class="share-btn share-btn-download" on:click={downloadCard}>
              Download PNG
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Hidden capture container -->
<div id="export-profile-capture" style="position:absolute;left:-9999px;top:0;pointer-events:none;z-index:-9999;"></div>

<style>
  .share-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .share-modal-overlay.open { display: flex; }

  .share-modal {
    max-width: 600px;
    width: 95%;
    background: linear-gradient(180deg, var(--surface, #0b0b0e) 0%, rgba(20,20,20,0.98) 100%);
    border: 1px solid rgba(255, 70, 85, 0.4);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 70, 85, 0.2);
  }

  .share-modal-title {
    color: var(--accent, #fa4454);
    font-size: 20px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .share-modal-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .share-modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 70vh;
    overflow-y: auto;
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
    color: var(--accent, #fa4454);
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
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.3);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .share-preview-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .share-preview-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.7);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-buttons {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-top: 8px;
  }

  .share-btn {
    border: none;
    border-radius: 8px;
    padding: 12px 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.2s;
  }
  .share-btn:hover { opacity: 0.9; }

  .share-btn-download {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
  }
  .share-btn-download:hover { background: rgba(255,255,255,0.15); }

  .share-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 70, 85, 0.2);
    border-top-color: var(--accent, #fa4454);
    border-radius: 50%;
    animation: share-spin 0.7s linear infinite;
  }
  @keyframes share-spin { to { transform: rotate(360deg); } }
</style>

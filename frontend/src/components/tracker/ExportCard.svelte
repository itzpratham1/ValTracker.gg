<script>
  import { tick } from 'svelte';
  import { createShareCard } from '../../lib/api';

  export let match = null;
  export let playerName = '';
  export let playerTag = '';
  export let allPlayers = [];
  export let playerBannerUrl = '';
  export let playerLevel = '';
  export let onClose = () => {};

  let loading = true;
  let loaded = false;
  let loadingTxt = 'GENERATING INFOGRAPHIC CARD...';
  let imgPreview = '';
  let templateText = '';
  let shareUrl = '';
  let shareId = '';
  let clipboardVisible = false;

  $: if (match) generateCard();

  async function generateCard() {
    if (!match) return;
    loading = true;
    loaded = false;
    loadingTxt = 'GENERATING INFOGRAPHIC CARD...';

    const m = match;
    const acs = Math.round((m.score || 0) / 100);
    const hsPct = m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
    const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);

    const combatRating = Math.min(10, (parseFloat(kd) * 2.8 + acs / 75 + hsPct / 12).toFixed(1));
    const ratingColor = combatRating >= 8.2 ? '#e8ff47' : combatRating >= 6.2 ? '#3ecf8e' : '#ff4655';

    let perfGrade = 'B';
    let perfGradeColor = '#ff4655';
    if (combatRating >= 9.0) { perfGrade = 'S+'; perfGradeColor = '#ffd700'; }
    else if (combatRating >= 8.0) { perfGrade = 'S'; perfGradeColor = '#e8ff47'; }
    else if (combatRating >= 6.8) { perfGrade = 'A'; perfGradeColor = '#3ecf8e'; }
    else if (combatRating >= 5.0) { perfGrade = 'B'; perfGradeColor = '#ffb01f'; }

    const mapStr = m.map ? m.map.toUpperCase() : 'VALORANT';
    const agentStr = m.agentName ? m.agentName.toUpperCase() : 'Agent';
    const outcome = m.won ? 'VICTORY' : 'DEFEAT';

    templateText = m.won
      ? `Secured a ${outcome} on ${mapStr} as ${agentStr} with a ${combatRating}/10 combat rating! Check my stats on ValTracker:`
      : `Tough battle on ${mapStr} as ${agentStr}. We bounce back stronger. My match stats on ValTracker:`;

    await tick();

    const captureTarget = document.getElementById('export-capture-target');
    if (!captureTarget) { loading = false; return; }

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

      const canvas = await html2canvas(captureTarget, {
        backgroundColor: null,
        scale: 1.8,
        logging: false,
        useCORS: true
      });

      imgPreview = canvas.toDataURL('image/png');
      const uploadDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          clipboardVisible = true;
        }
      } catch {
        clipboardVisible = false;
      }

      try {
        const res = await createShareCard({
          image: uploadDataUrl,
          playerName,
          playerTag,
          agentName: m.agentName,
          mapName: m.map,
          won: m.won,
          score: m.rounds
        });
        if (res.status === 'ok') {
          shareUrl = res.share_url;
          shareId = res.share_id;
          templateText = templateText + ' ' + res.share_url;
        }
      } catch (e) {
        console.error('Share upload failed:', e);
      }

      loading = false;
      loaded = true;
    } catch (e) {
      console.error('[Capture Error]', e);
      loadingTxt = 'Failed to compile infographic.';
      setTimeout(onClose, 1500);
    }
  }

  function shareToPlatform(platform) {
    const text = templateText;
    const encodedText = encodeURIComponent(text);

    if (platform === 'download') {
      const a = document.createElement('a');
      a.href = imgPreview;
      a.download = `valtracker_flex_${match?.agentName || 'agent'}_${match?.map || 'map'}_${Date.now()}.png`;
      a.click();
    } else if (platform === 'twitter') {
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      let cleanText = text;
      if (shareUrl && cleanText.includes(shareUrl)) cleanText = cleanText.replace(shareUrl, '').trim();
      const url = shareUrl
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanText)}&url=${encodeURIComponent(urlWithBuster)}`
        : `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(url, '_blank');
    } else if (platform === 'reddit') {
      const title = match?.won
        ? `[ValTracker] Secured an epic ${match?.rounds} VICTORY on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'}!`
        : `[ValTracker] Match on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'} (${match?.rounds})`;
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      const url = shareUrl
        ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(urlWithBuster)}&title=${encodeURIComponent(title)}`
        : `https://www.reddit.com/r/VALORANT/submit?title=${encodeURIComponent(title)}`;
      window.open(url, '_blank');
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="share-modal-overlay" class:open={match} on:click|self={onClose}>
  {#if match}
    <div class="share-modal">
      <div class="share-modal-header">
        <div class="share-modal-title">Share Your Performance Flex Card</div>
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
              <img class="share-preview-img" src={imgPreview} alt="Flex Card Preview" />
              <div class="share-preview-badge">Flex Card Preview</div>
            </div>

            {#if clipboardVisible}
              <div class="share-clipboard-status">Copied to clipboard</div>
            {/if}

            <div>
              <div class="share-label">Post Template Text</div>
              <textarea class="share-textarea" bind:value={templateText}></textarea>
            </div>

            <div class="share-buttons">
              <button class="share-btn share-btn-twitter" on:click={() => shareToPlatform('twitter')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </button>
              <button class="share-btn share-btn-reddit" on:click={() => shareToPlatform('reddit')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.23.73 4.29 1.97 5.95l-1.39 4.16c-.1.31.18.61.5.5l4.16-1.39C8.89 21.68 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.19 12.35c-.44.44-1.15.44-1.59 0L12 11.76l-2.6 2.6c-.44.44-1.15.44-1.59 0-.44-.44-.44-1.15 0-1.59l2.6-2.6-2.6-2.6c-.44-.44-.44-1.15 0-1.59.44-.44 1.15-.44 1.59 0l2.6 2.6 2.6-2.6c.44-.44 1.15-.44 1.59 0 .44.44.44 1.15 0 1.59l-2.6 2.6 2.6 2.6c.44.44.44 1.15 0 1.59z"/></svg>
                Post on Reddit
              </button>
              <button class="share-btn share-btn-download" on:click={() => shareToPlatform('download')}>
                Download PNG
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Hidden capture target for html2canvas -->
    <div id="export-capture-target" style="position:absolute; left:-9999px; top:0; width:900px; height:535px;">
      <div style="width:900px; height:535px; background:#050508; border-radius:20px; color:#fff; font-family:'Barlow Condensed',sans-serif; box-sizing:border-box; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:24px;">
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:2; overflow:hidden;">
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:140px; font-weight:900; color:rgba(255,255,255,0.035); letter-spacing:4px; text-transform:uppercase; transform:rotate(-15deg); white-space:nowrap;">VALTRACKER</div>
        </div>
        <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:none; filter:drop-shadow(0 0 8px rgba(255,70,85,0.6));"><path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655"/><polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47"/></svg>
            <span style="font-size:20px; font-weight:900; letter-spacing:1.5px; color:#fff; text-transform:uppercase;">ValTracker</span>
            <div style="background:rgba(62,207,142,0.1); border:1px solid rgba(62,207,142,0.3); color:#3ecf8e; border-radius:4px; padding:2px 6px; font-family:'DM Mono',monospace; font-size:7.5px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">VERIFIED REPORT</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:20px; font-weight:900; color:#e8ff47; letter-spacing:1.5px; text-transform:uppercase; border:1px solid rgba(232,255,71,0.4); padding:2px 10px; border-radius:6px; background:rgba(232,255,71,0.1);">{outcome} {match?.rounds || ''}</div>
          </div>
        </div>
        <div style="position:relative; z-index:3; flex-grow:1; display:flex; gap:24px; align-items:stretch; padding-bottom:10px;">
          <div style="width:100%; display:flex; flex-direction:column; gap:8px; justify-content:center; align-items:center;">
            <div style="font-size:32px; font-weight:900; color:#fff; text-align:center;">{playerName}#{playerTag}</div>
            <div style="font-size:24px; font-weight:900; color:{ratingColor};">{match?.agentName || ''} on {match?.map || ''}</div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; width:100%; max-width:600px;">
              <div style="text-align:center; padding:12px; background:rgba(15,15,22,0.65); border-radius:10px;">
                <div style="font-size:28px; font-weight:900; color:#fff;">{match?.kills}/{match?.deaths}/{match?.assists}</div>
                <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px;">K/D/A</div>
              </div>
              <div style="text-align:center; padding:12px; background:rgba(15,15,22,0.65); border-radius:10px;">
                <div style="font-size:28px; font-weight:900; color:{parseFloat(kd) >= 1 ? '#3ecf8e' : '#ff4655'};">{kd}</div>
                <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px;">K/D Ratio</div>
              </div>
              <div style="text-align:center; padding:12px; background:rgba(15,15,22,0.65); border-radius:10px;">
                <div style="font-size:28px; font-weight:900; color:#fff;">{acs}</div>
                <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px;">ACS</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
              <div style="font-size:36px; font-weight:900; color:{ratingColor}; text-shadow:0 0 12px {ratingColor}40;">{combatRating}</div>
              <span style="font-size:14px; color:rgba(255,255,255,0.25);">/ 10</span>
              <div style="background:rgba(255,255,255,0.05); border:1px solid {perfGradeColor}40; color:{perfGradeColor}; border-radius:8px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900;">{perfGrade}</div>
            </div>
          </div>
        </div>
        <div style="position:relative; z-index:3; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.35); letter-spacing:0.5px; margin-top:4px;">
          <div>Report compiled by ValTracker</div>
          <div style="color:#ff4655; font-weight:900; letter-spacing:1px; text-transform:uppercase;">TRACK. ANALYZE. CONQUER.</div>
        </div>
      </div>
    </div>
  {/if}
</div>

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

  .share-clipboard-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
  }

  .share-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .share-textarea {
    width: 100%;
    height: 80px;
    background: var(--surface2, #18181c);
    border: 1px solid var(--border, rgba(255,255,255,0.05));
    border-radius: 8px;
    padding: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #fff;
    resize: none;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .share-textarea:focus { border-color: rgba(255,70,85,0.5); }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

  .share-btn-twitter { background: #1d9bf0; color: #fff; }
  .share-btn-reddit { background: #ff4500; color: #fff; }
  .share-btn-download {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
  }
  .share-btn-download:hover { background: rgba(255,255,255,0.15); }
</style>

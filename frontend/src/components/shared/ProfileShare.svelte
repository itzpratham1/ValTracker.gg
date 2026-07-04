<script>
  import { apiFetch } from '../../lib/api';

  export let open = false;
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let onClose = () => {};

  let loading = false;
  let shareUrl = '';
  let shareImage = '';

  async function generateShareCard() {
    loading = true;
    try {
      const res = await apiFetch(`/api/share/${encodeURIComponent(playerName)}/${encodeURIComponent(playerTag)}?region=${region}`);
      if (res.url) shareUrl = res.url;
      if (res.image) shareImage = res.image;
      shareUrl = shareUrl || `${window.location.origin}/share/${encodeURIComponent(playerName)}/${encodeURIComponent(playerTag)}`;
    } catch(e) {
      shareUrl = `${window.location.origin}/share/${encodeURIComponent(playerName)}/${encodeURIComponent(playerTag)}`;
    } finally {
      loading = false;
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      if (window.showToast) window.showToast('Link copied!');
    });
  }

  function shareTwitter() {
    const text = `Check out my VALORANT stats on ValTracker! 🎯`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  function shareReddit() {
    const title = `My VALORANT Stats — ValTracker`;
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`, '_blank');
  }

  $: if (open && !shareUrl) generateShareCard();
  $: if (!open) { shareUrl = ''; shareImage = ''; loading = false; }
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="share-overlay" on:click={onClose}>
    <div class="share-modal" on:click|stopPropagation>
      <button class="share-close" on:click={onClose}>✕</button>
      <div class="share-title">🔗 Share Profile</div>
      <div class="share-subtitle">Share your stats with friends or on social media</div>

      {#if loading}
        <div class="share-loading">Generating share card...</div>
      {:else}
        <div class="share-preview">
          <div class="share-url">{shareUrl}</div>
        </div>
        <div class="share-actions">
          <button class="share-btn copy" on:click={copyUrl}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copy Link
          </button>
          <button class="share-btn twitter" on:click={shareTwitter}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </button>
          <button class="share-btn reddit" on:click={shareReddit}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.04c.044.307.066.618.066.934 0 3.192-3.6 5.786-8.042 5.786-4.442 0-8.042-2.594-8.042-5.786 0-.316.022-.627.066-.934a1.754 1.754 0 01-.745-1.437c0-.973.789-1.762 1.762-1.762.459 0 .878.177 1.19.468 1.186-.835 2.804-1.365 4.588-1.429l.904-4.173a.344.344 0 01.408-.268l2.953.627a1.247 1.247 0 012.284.649 1.247 1.247 0 01-1.247 1.247 1.247 1.247 0 01-1.223-.998l-2.636-.558-.798 3.706c1.743.078 3.315.612 4.472 1.432.31-.282.726-.452 1.176-.452.979 0 1.768.789 1.768 1.762 0 .561-.264 1.059-.673 1.39zM8.834 12.545a1.293 1.293 0 00-.046.366c0 1.207 1.446 2.188 3.23 2.188 1.784 0 3.23-.981 3.23-2.188 0-.124-.016-.246-.046-.366h-.062a.407.407 0 00-.408.177c-.246.336-.686.602-1.19.745-.284-1.118-1.182-1.945-2.258-1.945s-1.974.827-2.258 1.945a1.653 1.653 0 00-1.19-.745.404.404 0 00-.402-.177zm4.31 2.556c-.774 0-1.403-.55-1.403-1.23 0-.678.629-1.228 1.403-1.228s1.403.55 1.403 1.228c0 .68-.629 1.23-1.403 1.23zm3.04-3.684a.404.404 0 00.273-.102.407.407 0 00.103-.273.407.407 0 00-.407-.407.407.407 0 00-.272.102.407.407 0 00-.104.273c0 .12.046.231.123.314a.404.404 0 00.284.093z"/></svg>
            Reddit
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .share-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5000;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .share-modal {
    background: #0a0a0c;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    padding: 24px;
    position: relative;
    animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  .share-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--muted);
    font-size: 14px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .share-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .share-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .share-subtitle {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 20px;
  }
  .share-loading {
    text-align: center;
    padding: 20px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
  }
  .share-preview {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .share-url {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--accent);
    word-break: break-all;
  }
  .share-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .share-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.5px;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    justify-content: center;
  }
  .share-btn.copy {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
  }
  .share-btn.copy:hover { background: rgba(255,255,255,0.1); }
  .share-btn.twitter {
    background: rgba(29,155,240,0.15);
    color: #1d9bf0;
    border: 1px solid rgba(29,155,240,0.3);
  }
  .share-btn.twitter:hover { background: rgba(29,155,240,0.25); }
  .share-btn.reddit {
    background: rgba(255,69,0,0.15);
    color: #ff4500;
    border: 1px solid rgba(255,69,0,0.3);
  }
  .share-btn.reddit:hover { background: rgba(255,69,0,0.25); }
</style>

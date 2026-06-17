<script>
  import { onDestroy } from 'svelte';

  export let skin = null;
  export let open = false;
  export let onClose = () => {};

  let videoPlayer = null;
  let selectedChromaIdx = 0;

  function getSkinRarityTier(tierUuid) {
    const tiers = {
      "12683d76-48d7-84a3-4e11-5be5b4574b72": { name: "Select Edition", shortName: "select", color: "#3ecf8e", price: 875, meleePrice: 1750, icon: "\u{1F7E2}" },
      "0cebb8be-46e7-c15a-e1d5-89f58f5d883b": { name: "Deluxe Edition", shortName: "deluxe", color: "#00b2ff", price: 1275, meleePrice: 2550, icon: "\u{1F535}" },
      "607b0394-4343-4343-d2df-8b9ed9381734": { name: "Premium Edition", shortName: "premium", color: "#d154ff", price: 1775, meleePrice: 3550, icon: "\u{1F7E3}" },
      "11111111-1111-1111-1111-111111111111": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "\u{1F7E1}" },
      "e046854e-406c-37f4-660d-419b228b7684": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "\u{1F7E1}" },
      "411e4e55-4e59-7757-41a0-bf9e228b7634": { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 2175, meleePrice: 4350, icon: "\u{1F534}" }
    };
    return tiers[tierUuid] || { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 1775, meleePrice: 3550, icon: "\u{1F534}" };
  }

  $: tier = skin ? getSkinRarityTier(skin.contentTierUuid) : null;
  $: estimatedPrice = skin
    ? (skin.displayName.toLowerCase().includes('melee') || skin.displayName.toLowerCase().includes('knife')
        ? tier.meleePrice
        : tier.price)
    : 0;
  $: largeImg = skin
    ? (skin.chromas?.[selectedChromaIdx]?.fullRender || skin.chromas?.[selectedChromaIdx]?.displayIcon || skin.displayIcon)
    : '';

  function selectChroma(idx) {
    selectedChromaIdx = idx;
  }

  function playLevelVideo(url) {
    if (videoPlayer) {
      videoPlayer.src = url;
      videoPlayer.play();
      setTimeout(() => {
        videoPlayer?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  $: if (open) {
    selectedChromaIdx = 0;
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.src = '';
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && skin}
  <div class="stat-modal-overlay open" on:click={handleOverlayClick}>
    <div class="stat-modal skin-modal">
      <div class="stat-modal-header skin-modal-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="skin-modal-rarity-icon">{tier.icon}</div>
          <div class="stat-modal-title skin-modal-title">{skin.displayName}</div>
        </div>
        <button class="stat-modal-close" on:click={onClose}>&#10005;</button>
      </div>

      <div class="stat-modal-body">
        <!-- Big Preview Image -->
        <div class="skin-modal-preview">
          <img src={largeImg} alt="Skin Preview" class="skin-modal-preview-img" />
          <div class="skin-modal-price-badge">
            <span>&#129689;</span> <span>{estimatedPrice}</span> VP
          </div>
        </div>

        <!-- Chroma Color Variants -->
        {#if skin.chromas && skin.chromas.length > 0}
          <div class="skin-modal-section">
            <h4 class="skin-modal-section-title">&#127912; Chroma Color Variants</h4>
            <div class="skin-modal-chromas">
              {#each skin.chromas as chroma, idx}
                <button
                  class="skin-chroma-card"
                  class:active={selectedChromaIdx === idx}
                  on:click={() => selectChroma(idx)}
                >
                  <img
                    src={chroma.displayIcon || skin.displayIcon}
                    alt={chroma.displayName}
                    style="width:28px; height:14px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));"
                  />
                  <span>{(chroma.displayName || 'Default').replace(skin.displayName, '').replace('(', '').replace(')', '').trim() || 'Default'}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Upgrade Levels & Finisher Demos -->
        {#if skin.levels && skin.levels.length > 0}
          <div class="skin-modal-section">
            <h4 class="skin-modal-section-title">&#127916; Upgrade Levels & Finisher Demos</h4>
            <div class="skin-modal-levels">
              {#each skin.levels as level, idx}
                <button
                  class="skin-level-card"
                  class:playable={!!level.streamedVideo}
                  on:click={() => level.streamedVideo && playLevelVideo(level.streamedVideo)}
                >
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="skin-level-badge">LVL {idx + 1}</span>
                    <span style="font-weight:700; color:#fff; text-transform:uppercase;">
                      {(level.displayName || `Level ${idx + 1}`).replace(skin.displayName, '').replace('(', '').replace(')', '').trim() || `Base Level 1`}
                    </span>
                  </div>
                  {#if level.streamedVideo}
                    <span style="color:var(--win); font-weight:bold; font-size:11px;">&#9654; Watch Demonstration Video</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Inline Video Player -->
        <div class="skin-modal-video-container">
          <video bind:this={videoPlayer} controls class="skin-modal-video-player"></video>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .skin-modal {
    max-width: 780px;
    border-color: rgba(255,255,255,0.1);
    background: linear-gradient(180deg, var(--surface) 0%, rgba(10,10,12,0.98) 100%);
    width: 95vw;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  }

  .skin-modal-header {
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 14px;
    display: flex;
    align-items: center;
  }

  .skin-modal-rarity-icon {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
  }

  .skin-modal-title {
    color: #fff;
    font-size: 22px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .skin-modal-preview {
    background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 40px 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    position: relative;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .skin-modal-preview-img {
    max-width: 90%;
    max-height: 180px;
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(0,0,0,0.75));
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .skin-modal-price-badge {
    position: absolute;
    bottom: 14px;
    right: 14px;
    background: rgba(250, 68, 84, 0.12);
    border: 1px solid rgba(250, 68, 84, 0.3);
    padding: 7px 14px;
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(250, 68, 84, 0.15);
  }

  .skin-modal-section {
    margin-bottom: 24px;
  }

  .skin-modal-section-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .skin-modal-chromas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .skin-chroma-card {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    font-weight: 800;
    background: rgba(255,255,255,0.02);
    transition: var(--transition);
    color: #fff;
  }

  .skin-chroma-card:hover {
    background: rgba(255,255,255,0.05);
  }

  .skin-chroma-card.active {
    border-color: var(--accent);
    background: rgba(250,68,84,0.1);
  }

  .skin-modal-levels {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skin-level-card {
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,0.015);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px;
    font-size: 11px;
    transition: var(--transition);
    width: 100%;
    color: #fff;
    text-align: left;
    cursor: default;
  }

  .skin-level-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.15);
  }

  .skin-level-card.playable {
    cursor: pointer;
  }

  .skin-level-card.playable:hover {
    border-color: var(--win);
  }

  .skin-level-badge {
    font-family: 'DM Mono', monospace;
    font-weight: 800;
    color: var(--accent);
  }

  .skin-modal-video-container {
    display: none;
    margin-top: 24px;
    background: #000;
    border-radius: 8px;
    border: 1px solid var(--border);
    overflow: hidden;
    aspect-ratio: 16/9;
    width: 100%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }

  .skin-modal-video-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>

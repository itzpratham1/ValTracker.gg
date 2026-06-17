<script>
  import { recentSearches, recentCount } from '../../lib/stores';
  import { escapeHtml } from '../../lib/utils';

  export let onSelect = (name, tag, region, mode) => {};

  function handleSelect(player) {
    onSelect(player.name, player.tag, player.region, player.mode);
  }

  function handleClear() {
    recentSearches.clear();
  }
</script>

<div class="recent-section">
  <div class="rs-header">
    <div class="rs-title">
      <span class="rs-icon">🕒</span> Recent Searches
    </div>
    <button class="rs-clear" on:click={handleClear}>CLEAR ALL</button>
  </div>

  <div class="rs-list">
    {#if $recentSearches.length === 0}
      <div class="rs-empty">No recent searches yet.</div>
    {:else}
      {#each $recentSearches as player (player.name + player.tag)}
        <button class="rs-item" on:click={() => handleSelect(player)}>
          {#if player.rankImg}
            <img src={player.rankImg} alt="" class="rs-rank-img">
          {:else}
            <div class="rs-rank-placeholder"></div>
          {/if}
          <div class="rs-player-info">
            <span class="rs-player-name">{escapeHtml(player.name)}</span>
            <span class="rs-player-tag">#{escapeHtml(player.tag)}</span>
          </div>
          <span class="rs-region">{escapeHtml(player.region)}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .recent-section {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 16px;
  }

  .rs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .rs-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 16px;
    color: var(--accent, #fa4454);
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rs-icon {
    font-size: 14px;
  }

  .rs-clear {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.5px;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }

  .rs-clear:hover {
    color: var(--accent, #fa4454);
  }

  .rs-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 180px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .rs-empty {
    font-size: 10px;
    color: var(--muted2, #5b5b66);
    text-align: center;
    padding: 16px 12px;
    font-family: 'DM Mono', monospace;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .rs-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
    color: inherit;
  }

  .rs-item:hover {
    background: rgba(255, 70, 85, 0.06);
    border-color: rgba(255, 70, 85, 0.15);
  }

  .rs-rank-img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .rs-rank-placeholder {
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .rs-player-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .rs-player-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
  }

  .rs-player-tag {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    color: var(--muted2, #5b5b66);
    font-weight: normal;
    margin-left: 2px;
  }

  .rs-region {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted2, #5b5b66);
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }
</style>

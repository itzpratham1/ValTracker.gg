<script>
  import { bookmarks, bookmarksCount } from '../../lib/stores';
  import { escapeHtml } from '../../lib/utils';
  import { setPlayer } from '../../lib/appStore';

  export let onSelect = (name, tag, region, mode) => {
    setPlayer({ name, tag, region, mode, fetching: true, loaded: false });
  };

  function handleSelect(player) {
    onSelect(player.name, player.tag, player.region, player.mode);
  }

  function handleRemove(e, player) {
    e.stopPropagation();
    bookmarks.remove(player.name, player.tag);
  }
</script>

<div class="bookmarks-section">
  <div class="bm-header">
    <div class="bm-title">
      <span class="bm-star">★</span> Bookmarked Players
    </div>
    <span class="bm-count">{$bookmarksCount} Player{$bookmarksCount !== 1 ? 's' : ''}</span>
  </div>

  <div class="bm-list">
    {#if $bookmarks.length === 0}
      <div class="bm-empty">
        No bookmarked players.<br>Click ★ next to their name in header.
      </div>
    {:else}
      {#each $bookmarks as player (player.name + player.tag)}
        <div class="bm-item" on:click={() => handleSelect(player)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleSelect(player)}>
          <div class="bm-item-left">
            {#if player.rankImg}
              <img src={player.rankImg} alt="" class="bm-rank-img">
            {:else}
              <div class="bm-rank-placeholder"></div>
            {/if}
            <div class="bm-player-info">
              <span class="bm-player-name">{escapeHtml(player.name)}</span>
              <span class="bm-player-tag">#{escapeHtml(player.tag)}</span>
            </div>
          </div>
          <button
            class="bm-remove"
            on:click={(e) => handleRemove(e, player)}
            title="Remove bookmark"
          >×</button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .bookmarks-section {
    margin-bottom: 0;
  }

  .bm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .bm-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 16px;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bm-star {
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
  }

  .bm-count {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
  }

  .bm-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 160px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .bm-empty {
    font-size: 10px;
    color: var(--muted2, #5b5b66);
    text-align: center;
    padding: 16px 12px;
    font-family: 'DM Mono', monospace;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .bm-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
    color: inherit;
    font-family: inherit;
  }

  .bm-item:hover {
    background: rgba(255, 215, 0, 0.06);
    border-color: rgba(255, 215, 0, 0.15);
  }

  .bm-item-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .bm-rank-img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .bm-rank-placeholder {
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .bm-player-info {
    min-width: 0;
    overflow: hidden;
  }

  .bm-player-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
  }

  .bm-player-tag {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    color: var(--muted2, #5b5b66);
    font-weight: normal;
    margin-left: 2px;
  }

  .bm-remove {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 14px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;
    flex-shrink: 0;
    line-height: 1;
  }

  .bm-remove:hover {
    color: #ff4655;
    background: rgba(255, 70, 85, 0.1);
  }
</style>

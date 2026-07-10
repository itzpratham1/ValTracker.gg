<script>
  import { bookmarks, bookmarksCount } from '../../lib/stores';
  import { escapeHtml } from '../../lib/utils';
  import { setPlayer } from '../../lib/appStore';
  import { playSound } from '../../lib/audio';

  export let onSelect = (name, tag, region, mode) => {
    setPlayer({ name, tag, region, mode, fetching: true, loaded: false });
  };

  function handleSelect(player) {
    playSound('click');
    onSelect(player.name, player.tag, player.region, player.mode);
  }

  function handleRemove(e, player) {
    e.stopPropagation();
    playSound('error');
    bookmarks.remove(player.name, player.tag);
  }

  function playHover() {
    playSound('hover');
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
        No bookmarked players.<br>
        <span class="bm-empty-sub">Click the ★ next to their name in the tracker.</span>
      </div>
    {:else}
      {#each $bookmarks as player (player.name + player.tag)}
        <div 
          class="bm-item" 
          on:click={() => handleSelect(player)} 
          on:mouseenter={playHover}
          role="button" 
          tabindex="0" 
          on:keydown={(e) => e.key === 'Enter' && handleSelect(player)}
        >
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
          <div class="bm-item-right">
            <span class="bm-region">{escapeHtml(player.region)}</span>
            <button
              class="bm-remove"
              on:click={(e) => handleRemove(e, player)}
              on:mouseenter={playHover}
              title="Remove bookmark"
            >×</button>
          </div>
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
    font-size: 13px;
    color: #e8ff47;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .bm-star {
    color: #e8ff47;
    text-shadow: 0 0 10px rgba(232, 255, 71, 0.6);
    animation: starPulse 1.5s infinite alternate;
  }

  @keyframes starPulse {
    from { transform: scale(0.9); }
    to { transform: scale(1.1); }
  }

  .bm-count {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.02);
  }

  .bm-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 165px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .bm-empty {
    font-size: 9px;
    color: var(--muted2, #5b5b66);
    text-align: center;
    padding: 20px 12px;
    font-family: 'DM Mono', monospace;
    border: 1px dashed rgba(250, 68, 84, 0.2);
    border-radius: 6px;
    background: rgba(250, 68, 84, 0.01);
    line-height: 1.6;
  }

  .bm-empty-sub {
    font-size: 8px;
    opacity: 0.7;
    display: block;
    margin-top: 4px;
  }

  .bm-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 14px;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    width: 100%;
    text-align: left;
    color: inherit;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  .bm-item:hover {
    background: rgba(232, 255, 71, 0.04);
    border-color: rgba(232, 255, 71, 0.3);
    box-shadow: 0 4px 15px rgba(232, 255, 71, 0.05);
    transform: translateX(2px);
  }

  .bm-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .bm-rank-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.15));
  }

  .bm-rank-placeholder {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .bm-player-info {
    min-width: 0;
    overflow: hidden;
  }

  .bm-player-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  .bm-player-tag {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #fa4454;
    font-weight: bold;
    margin-left: 2px;
  }

  .bm-item-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .bm-region {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: rgba(232, 255, 71, 0.7);
    border: 1px solid rgba(232, 255, 71, 0.2);
    padding: 1px 4px;
    border-radius: 2px;
    text-transform: uppercase;
    background: rgba(232, 255, 71, 0.02);
  }

  .bm-remove {
    background: none;
    border: none;
    color: var(--muted2, #5b5b66);
    font-size: 16px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;
    flex-shrink: 0;
    line-height: 1;
  }

  .bm-remove:hover {
    color: #fa4454;
    background: rgba(250, 68, 84, 0.1);
  }
</style>

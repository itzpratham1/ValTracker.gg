<script>
  import { recentSearches, recentCount } from '../../lib/stores';
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

  function handleDelete(e, name, tag) {
    e.stopPropagation();
    playSound('error');
    recentSearches.remove(name, tag);
  }

  function handleClear() {
    playSound('error');
    recentSearches.clear();
  }

  function playHover() {
    playSound('hover');
  }
</script>

<div class="recent-section">
  <div class="rs-header">
    <div class="rs-title">
      <span class="rs-icon">🕒</span> Recent Searches
    </div>
    <button class="rs-clear" on:mouseenter={playHover} on:click={handleClear}>Clear All</button>
  </div>

  <div class="rs-list">
    {#if $recentSearches.length === 0}
      <div class="rs-empty">No recent searches yet.</div>
    {:else}
      {#each $recentSearches as player (player.name + player.tag)}
        <div 
          class="rs-item" 
          role="button" 
          tabindex="0"
          on:mouseenter={playHover} 
          on:click={() => handleSelect(player)}
          on:keydown={(e) => e.key === 'Enter' && handleSelect(player)}
        >
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
          <button class="rs-delete" on:mouseenter={playHover} on:click={(e) => handleDelete(e, player.name, player.tag)} title="Remove">✕</button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .recent-section {
    border-top: 1px solid rgba(255, 70, 85, 0.15);
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
    font-size: 13px;
    color: #fa4454;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .rs-icon {
    font-size: 11px;
    color: #fa4454;
    text-shadow: 0 0 8px rgba(250, 68, 84, 0.4);
  }

  .rs-clear {
    background: none;
    border: none;
    color: var(--muted2, #5b5b66);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .rs-clear:hover {
    color: #fa4454;
    background: rgba(250, 68, 84, 0.05);
    border-color: rgba(250, 68, 84, 0.25);
  }

  .rs-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 180px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .rs-empty {
    font-size: 9px;
    color: var(--muted2, #5b5b66);
    text-align: center;
    padding: 20px 12px;
    font-family: 'DM Mono', monospace;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.01);
  }

  .rs-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    width: 100%;
    text-align: left;
    color: inherit;
    position: relative;
    overflow: hidden;
  }

  .rs-item:hover {
    background: rgba(250, 68, 84, 0.04);
    border-color: rgba(250, 68, 84, 0.3);
    box-shadow: 0 4px 15px rgba(250, 68, 84, 0.05);
    transform: translateX(2px);
  }

  .rs-rank-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.15));
  }

  .rs-rank-placeholder {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.04);
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
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  .rs-player-tag {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #fa4454;
    font-weight: bold;
    margin-left: 2px;
  }

  .rs-region {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 2px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.02);
  }

  .rs-delete {
    background: none;
    border: none;
    color: var(--muted2, #5b5b66);
    font-size: 9px;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
    transition: all 0.2s;
    opacity: 0;
    flex-shrink: 0;
    line-height: 1;
  }

  .rs-item:hover .rs-delete {
    opacity: 1;
  }

  .rs-delete:hover {
    color: #fa4454;
    background: rgba(250, 68, 84, 0.1);
  }
</style>

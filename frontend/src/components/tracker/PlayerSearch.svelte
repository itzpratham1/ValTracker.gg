<script>
  import { onMount, onDestroy } from 'svelte';
  import { bookmarks, recentSearches } from '../../lib/stores';
  import { fetchSearch } from '../../lib/api';
  import { getRankImgUrl } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  export let value = '';
  export let tagValue = '';
  export let region = 'ap';
  export let onSubmit = (name, tag) => {};
  export let onRegionChange = (region) => {};
  export let compact = false;

  let showDropdown = false;
  let results = [];
  let loading = false;
  let debounceTimer = null;
  let dropdownRef;
  let inputEl;

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    clearTimeout(debounceTimer);
  });

  function handleClickOutside(e) {
    if (dropdownRef && !dropdownRef.contains(e.target)) {
      showDropdown = false;
    }
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    const query = value.trim();

    if (query.includes('#')) {
      const parts = query.split('#');
      value = parts[0].trim();
      tagValue = parts[1].trim();
      return;
    }

    if (query.length < 2) {
      showRecommendations();
      return;
    }

    loading = true;
    showDropdown = true;

    debounceTimer = setTimeout(async () => {
      try {
        const data = await fetchSearch(query);
        results = (Array.isArray(data) ? data : data?.data || []).slice(0, 8);
      } catch {
        results = [];
      }
      loading = false;
    }, 250);
  }

  function showRecommendations() {
    const items = [];
    const bms = $bookmarks.slice(0, 4);
    const rec = $recentSearches.slice(0, 4);

    if (bms.length) {
      items.push({ type: 'header', label: '★ Bookmarked Players' });
      bms.forEach(p => items.push({ type: 'item', ...p }));
    }
    if (rec.length) {
      items.push({ type: 'header', label: '🕒 Recent Searches' });
      rec.forEach(p => items.push({ type: 'item', ...p }));
    }

    results = items;
    showDropdown = items.length > 0;
    loading = false;
  }

  function handleFocus() {
    if (value.length < 2) showRecommendations();
  }

  function selectItem(item) {
    value = item.name;
    tagValue = item.tag;
    if (item.region && onRegionChange) onRegionChange(item.region);
    showDropdown = false;
    onSubmit(item.name, item.tag);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      showDropdown = false;
      onSubmit(value.trim(), tagValue.trim());
    }
    if (e.key === 'Escape') {
      showDropdown = false;
    }
  }

  function handleSubmit() {
    showDropdown = false;
    onSubmit(value.trim(), tagValue.trim());
  }
</script>

<div class="ps-wrap" class:ps-compact={compact} bind:this={dropdownRef}>
  <input
    class="ps-input"
    bind:this={inputEl}
    bind:value
    on:input={handleInput}
    on:focus={handleFocus}
    on:keydown={handleKeydown}
    type="text"
    placeholder="Name"
    autocomplete="off"
    spellcheck="false"
  >
  <span class="ps-hash">#</span>
  <input
    class="ps-input ps-input-tag"
    bind:value={tagValue}
    on:keydown={handleKeydown}
    type="text"
    placeholder="TAG"
    maxlength="8"
    autocomplete="off"
    spellcheck="false"
  >
  <button class="ps-submit" on:click={handleSubmit} title="Search">
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </button>

  {#if showDropdown}
    <div class="ps-dropdown">
      {#if loading}
        <div class="ps-dropdown-loading">
          <div class="ps-spinner-mini"></div>
          Searching database...
        </div>
      {:else if results.length === 0}
        <div class="ps-dropdown-empty">
          <div>No results found</div>
          <div class="ps-dropdown-empty-sub">Type your TAG and click Search to load directly from Riot.</div>
        </div>
      {:else}
        {#each results as item}
          {#if item.type === 'header'}
            <div class="ps-dropdown-header">{item.label}</div>
          {:else}
            <button class="ps-dropdown-item" on:click={() => selectItem(item)}>
              <div class="ps-dropdown-item-left">
                <div class="ps-dropdown-avatar">
                  {#if item.card_id}
                    <img src="https://media.valorant-api.com/playercards/{item.card_id}/smallart.png" alt="">
                  {:else}
                    👤
                  {/if}
                </div>
                <div class="ps-dropdown-info">
                  <span class="ps-dropdown-name">{escapeHtml(item.name)}</span>
                  <span class="ps-dropdown-tag">#{escapeHtml(item.tag)}</span>
                  {#if item.current_tier_patched || item.rankName}
                    <div class="ps-dropdown-rank">{escapeHtml(item.current_tier_patched || item.rankName || '').toUpperCase()}</div>
                  {/if}
                </div>
              </div>
              <div class="ps-dropdown-item-right">
                {#if getRankImgUrl(item.current_tier_patched || item.rankName || '')}
                  <img class="ps-dropdown-rank-img" src={getRankImgUrl(item.current_tier_patched || item.rankName || '')} alt="">
                {/if}
                {#if item.region}
                  <span class="ps-dropdown-region">{escapeHtml(item.region)}</span>
                {/if}
              </div>
            </button>
          {/if}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .ps-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .ps-input {
    width: 110px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 7px 10px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }

  .ps-input:first-child {
    border-radius: 6px 0 0 6px;
    border-right: none;
  }

  .ps-input:focus {
    border-color: rgba(255, 70, 85, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .ps-hash {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.06);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 7px 4px;
    line-height: 1;
  }

  .ps-input-tag {
    width: 70px;
    border-radius: 0 6px 6px 0;
    border-left: none;
  }

  .ps-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: 6px;
    background: rgba(255, 70, 85, 0.15);
    border: 1px solid rgba(255, 70, 85, 0.3);
    border-radius: 6px;
    color: var(--accent);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .ps-submit:hover {
    background: rgba(255, 70, 85, 0.25);
    border-color: rgba(255, 70, 85, 0.5);
  }

  .ps-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    min-width: 320px;
    background: rgba(12, 12, 16, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    max-height: 340px;
    overflow-y: auto;
    z-index: 200;
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }

  .ps-dropdown-loading {
    padding: 18px;
    text-align: center;
    font-size: 11px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ps-spinner-mini {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ps-dropdown-empty {
    padding: 18px;
    text-align: center;
    font-size: 11.5px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    line-height: 1.4;
  }

  .ps-dropdown-empty-sub {
    font-size: 9px;
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    max-width: 280px;
  }

  .ps-dropdown-header {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted);
    padding: 10px 14px 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .ps-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
    color: inherit;
  }

  .ps-dropdown-item:hover {
    background: rgba(255, 70, 85, 0.08);
  }

  .ps-dropdown-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .ps-dropdown-avatar {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .ps-dropdown-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ps-dropdown-info {
    min-width: 0;
  }

  .ps-dropdown-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  .ps-dropdown-tag {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--muted);
    margin-left: 2px;
  }

  .ps-dropdown-rank {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    margin-top: 2px;
  }

  .ps-dropdown-item-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .ps-dropdown-rank-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  .ps-dropdown-region {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .ps-compact .ps-input {
    width: 90px;
    padding: 6px 8px;
    font-size: 11px;
  }

  .ps-compact .ps-input-tag {
    width: 60px;
  }

  .ps-compact .ps-hash {
    padding: 6px 3px;
    font-size: 11px;
  }

  @media (max-width: 600px) {
    .ps-dropdown {
      min-width: 260px;
      right: 0;
    }
  }
</style>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { bookmarks, recentSearches, bookmarksCount } from '../../lib/stores';
  import { fetchSearch } from '../../lib/api';
  import { getRankImgUrl } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';
  import { player, setPlayer } from '../../lib/appStore';

  export let onSearch = (name, tag, region, mode) => {
    setPlayer({ name, tag, region, mode, fetching: true, loaded: false });
  };
  export let loading = false;
  $: currentLoading = loading || $player.fetching;

  let name = '';
  let tag = '';
  let region = 'ap';
  let mode = 'competitive';
  let error = '';
  let showDropdown = false;
  let dropdownResults = [];
  let myProfile = null;
  let debounceTimer = null;
  let dropdownRef;
  let nameInput;

  const REGIONS = [
    { value: 'ap', label: 'AP — Asia Pacific' },
    { value: 'na', label: 'NA — North America' },
    { value: 'eu', label: 'EU — Europe' },
    { value: 'kr', label: 'KR — Korea' }
  ];

  const MODES = [
    { value: 'competitive', label: 'Competitive' },
    { value: 'unrated', label: 'Unrated' },
    { value: 'deathmatch', label: 'Deathmatch' },
    { value: 'teamdeathmatch', label: 'Team DM' },
    { value: 'swiftplay', label: 'Swiftplay' },
    { value: 'spikerush', 'label': 'Spike Rush' }
  ];

  onMount(() => {
    try {
      const raw = localStorage.getItem('valstats_my_profile');
      if (raw) myProfile = JSON.parse(raw);
    } catch {}

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
    const query = `${name} ${tag}`.trim();

    if (query.length < 2) {
      showRecommendations();
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const results = await fetchSearch(query);
        dropdownResults = (Array.isArray(results) ? results : results?.data || []).slice(0, 8);
        showDropdown = true;
      } catch {
        dropdownResults = [];
      }
    }, 250);
  }

  function showRecommendations() {
    const items = [];
    const bms = $bookmarks.slice(0, 3);
    const rec = $recentSearches.slice(0, 3);

    if (bms.length) {
      items.push({ type: 'header', label: 'Bookmarked' });
      bms.forEach(p => items.push({ type: 'bookmark', ...p }));
    }
    if (rec.length) {
      items.push({ type: 'header', label: 'Recent' });
      rec.forEach(p => items.push({ type: 'recent', ...p }));
    }

    dropdownResults = items;
    showDropdown = items.length > 0;
  }

  function handleFocus() {
    if (name.length < 2 && tag.length < 2) {
      showRecommendations();
    }
  }

  function selectResult(item) {
    name = item.name;
    tag = item.tag;
    if (item.region) region = item.region;
    if (item.mode) mode = item.mode;
    showDropdown = false;
    handleSubmit();
  }

  function handleSubmit() {
    const cleanName = name.trim();
    const cleanTag = tag.trim().replace(/^#/, '');

    if (!cleanName || !cleanTag) {
      error = 'Enter a name and tag first';
      return;
    }

    error = '';
    showDropdown = false;
    onSearch(cleanName, cleanTag, region, mode);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  function setMyProfile() {
    if (!myProfile) return;
    name = myProfile.name || '';
    tag = myProfile.tag || '';
    if (myProfile.region) region = myProfile.region;
    handleSubmit();
  }

  function getRankImg(rankName) {
    return getRankImgUrl(rankName) || null;
  }
</script>

<div class="search-form-card">
  <div class="sf-title">Look up a player</div>
  <div class="sf-sub">Enter a Riot ID to view stats, match history & analysis</div>

  <div class="sf-label">Riot ID</div>
  <div class="sf-input-row" bind:this={dropdownRef}>
    <input
      class="sf-input"
      bind:this={nameInput}
      bind:value={name}
      on:input={handleInput}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
      type="text"
      placeholder="PlayerName"
      autocomplete="off"
      spellcheck="false"
      disabled={currentLoading}
    >
    <span class="sf-hash">#</span>
    <input
      class="sf-input sf-input-tag"
      bind:value={tag}
      on:input={handleInput}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
      type="text"
      placeholder="TAG"
      maxlength="8"
      autocomplete="off"
      spellcheck="false"
      disabled={currentLoading}
    >

    {#if showDropdown && dropdownResults.length > 0}
      <div class="sf-dropdown">
        {#each dropdownResults as item}
          {#if item.type === 'header'}
            <div class="sf-dropdown-header">{item.label}</div>
          {:else}
            <button
              class="sf-dropdown-item"
              on:click={() => selectResult(item)}
            >
              {#if item.rankImg}
                <img src={item.rankImg} alt="" class="sf-dropdown-rank">
              {:else}
                <div class="sf-dropdown-rank sf-dropdown-rank-placeholder"></div>
              {/if}
              <div class="sf-dropdown-info">
                <span class="sf-dropdown-name">{escapeHtml(item.name)}</span>
                <span class="sf-dropdown-tag">#{escapeHtml(item.tag)}</span>
              </div>
              {#if item.region}
                <span class="sf-dropdown-region">{escapeHtml(item.region)}</span>
              {/if}
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="sf-row2">
    <div>
      <div class="sf-label">Region</div>
      <select class="sf-select" bind:value={region} disabled={currentLoading}>
        {#each REGIONS as r}
          <option value={r.value}>{r.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <div class="sf-label">Mode</div>
      <select class="sf-select" bind:value={mode} disabled={currentLoading}>
        {#each MODES as m}
          <option value={m.value}>{m.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <button class="sf-btn" on:click={handleSubmit} disabled={currentLoading}>
    {currentLoading ? 'Loading...' : '▶ View Stats'}
  </button>

  {#if error}
    <div class="sf-error">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="sf-divider">
    <div class="sf-divider-line"></div>
    <span class="sf-divider-txt">or jump to</span>
    <div class="sf-divider-line"></div>
  </div>

  <div class="sf-profile-row">
    <span class="sf-profile-label">My Profile</span>
    {#if myProfile}
      <button class="sf-profile-btn" on:click={setMyProfile}>
        {escapeHtml(myProfile.name)}#{escapeHtml(myProfile.tag)} ›
      </button>
    {:else}
      <button class="sf-profile-btn sf-profile-set" disabled>SET AS MY PROFILE ›</button>
    {/if}
  </div>
</div>

<style>
  .search-form-card {
    background: rgba(10, 10, 14, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius, 12px);
    padding: 28px 24px;
    position: relative;
  }

  .sf-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }

  .sf-sub {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }

  .sf-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted, #a0a0ab);
    margin-bottom: 6px;
  }

  .sf-input-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 16px;
  }

  .sf-input {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .sf-input:first-child {
    border-radius: 8px 0 0 8px;
    border-right: none;
  }

  .sf-input:focus {
    border-color: rgba(255, 70, 85, 0.5);
  }

  .sf-hash {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--muted, #a0a0ab);
    background: rgba(255, 255, 255, 0.04);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 6px;
    line-height: 1;
  }

  .sf-input-tag {
    border-radius: 0 8px 8px 0;
    max-width: 100px;
  }

  .sf-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(12, 12, 16, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0 0 8px 8px;
    max-height: 280px;
    overflow-y: auto;
    z-index: 100;
    backdrop-filter: blur(12px);
  }

  .sf-dropdown-header {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted, #a0a0ab);
    padding: 8px 14px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .sf-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
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

  .sf-dropdown-item:hover {
    background: rgba(255, 70, 85, 0.08);
  }

  .sf-dropdown-rank {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .sf-dropdown-rank-placeholder {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }

  .sf-dropdown-info {
    flex: 1;
    min-width: 0;
  }

  .sf-dropdown-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  .sf-dropdown-tag {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--muted, #a0a0ab);
    margin-left: 2px;
  }

  .sf-dropdown-region {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .sf-row2 {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .sf-row2 > div {
    flex: 1;
  }

  .sf-select {
    width: 100%;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text, #f4f4f7);
    padding: 9px 12px;
    border-radius: 8px;
    cursor: pointer;
    outline: none;
    appearance: none;
    transition: border-color 0.2s;
  }

  .sf-select:hover,
  .sf-select:focus {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .sf-btn {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 12px 20px;
    background: linear-gradient(135deg, #ff4655, #e8334a);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(255, 70, 85, 0.3);
    transition: all 0.25s;
    margin-bottom: 8px;
  }

  .sf-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(255, 70, 85, 0.45);
  }

  .sf-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .sf-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sf-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #ff4655;
    margin-bottom: 8px;
  }

  .sf-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
  }

  .sf-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
  }

  .sf-divider-txt {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sf-profile-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sf-profile-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sf-profile-btn {
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--accent, #fa4454);
    letter-spacing: 1px;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s;
  }

  .sf-profile-btn:hover:not(:disabled) {
    opacity: 0.8;
  }

  .sf-profile-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .search-form-card {
      padding: 20px 16px;
    }
    .sf-row2 {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>

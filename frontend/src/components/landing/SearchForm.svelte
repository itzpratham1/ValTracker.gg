<script>
  import { onMount, onDestroy } from 'svelte';
  import { bookmarks, recentSearches, bookmarksCount } from '../../lib/stores';
  import { fetchSearch } from '../../lib/api';
  import { getRankImgUrl } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';
  import { player, setPlayer } from '../../lib/appStore';
  import { loadMyProfile, saveMyProfile } from '../../lib/session';
  import { playSound } from '../../lib/audio';
  import Toast from '../shared/Toast.svelte';

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
    myProfile = loadMyProfile();
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
      items.push({ type: 'header', label: 'Bookmarked Profiles' });
      bms.forEach(p => items.push({ type: 'bookmark', ...p }));
    }
    if (rec.length) {
      items.push({ type: 'header', label: 'Recent Searches' });
      rec.forEach(p => items.push({ type: 'recent', ...p }));
    }

    dropdownResults = items;
    showDropdown = items.length > 0;
  }

  function handleFocus() {
    playSound('click');
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
    playSound('click');
    handleSubmit();
  }

  function handleSubmit() {
    const cleanName = name.trim();
    const cleanTag = tag.trim().replace(/^#/, '');

    if (!cleanName || !cleanTag) {
      error = 'Riot ID and Tag are required';
      playSound('error');
      return;
    }

    error = '';
    showDropdown = false;
    playSound('submit');
    onSearch(cleanName, cleanTag, region, mode);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  function loadProfile() {
    if (!myProfile) return;
    name = myProfile.name || '';
    tag = myProfile.tag || '';
    if (myProfile.region) region = myProfile.region;
    playSound('click');
    handleSubmit();
  }

  function saveProfile() {
    const cleanName = name.trim();
    const cleanTag = tag.trim().replace(/^#/, '');

    if (!cleanName || !cleanTag) {
      error = 'Enter a valid Riot ID and Tag';
      playSound('error');
      return;
    }

    error = '';
    saveMyProfile(cleanName, cleanTag, region, mode);
    myProfile = { name: cleanName, tag: cleanTag, region, mode };
    playSound('success');
    
    if (window.showToast) {
      window.showToast('Profile saved ✓');
    }
  }

  function playHover() {
    playSound('hover');
  }
</script>

<div class="search-form-card">
  <div class="sf-title">Look up a player</div>
  <div class="sf-sub">Enter a Riot ID to view stats, match history & analysis</div>

  <div class="sf-label">Riot ID</div>
  <div class="sf-input-row" bind:this={dropdownRef}>
    <div class="sf-input-box-wrapper">
      <input
        class="sf-input"
        bind:this={nameInput}
        bind:value={name}
        on:input={handleInput}
        on:focus={handleFocus}
        on:mouseenter={playHover}
        on:keydown={handleKeydown}
        type="text"
        placeholder="RiotName"
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
        on:mouseenter={playHover}
        on:keydown={handleKeydown}
        type="text"
        placeholder="TAG"
        maxlength="8"
        autocomplete="off"
        spellcheck="false"
        disabled={currentLoading}
      >
      <div class="input-decor-bracket left">[</div>
      <div class="input-decor-bracket right">]</div>
    </div>

    {#if showDropdown && dropdownResults.length > 0}
      <div class="sf-dropdown">
        {#each dropdownResults as item}
          {#if item.type === 'header'}
            <div class="sf-dropdown-header">{item.label}</div>
          {:else}
            <button
              class="sf-dropdown-item"
              on:click={() => selectResult(item)}
              on:mouseenter={playHover}
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
      <div class="sf-select-wrapper">
        <select class="sf-select" bind:value={region} on:change={() => playSound('click')} on:mouseenter={playHover} disabled={currentLoading}>
          {#each REGIONS as r}
            <option value={r.value}>{r.label}</option>
          {/each}
        </select>
        <span class="select-arrow">▼</span>
      </div>
    </div>
    <div>
      <div class="sf-label">Mode</div>
      <div class="sf-select-wrapper">
        <select class="sf-select" bind:value={mode} on:change={() => playSound('click')} on:mouseenter={playHover} disabled={currentLoading}>
          {#each MODES as m}
            <option value={m.value}>{m.label}</option>
          {/each}
        </select>
        <span class="select-arrow">▼</span>
      </div>
    </div>
  </div>

  <button 
    class="sf-btn" 
    class:loading-btn={currentLoading}
    on:click={handleSubmit} 
    on:mouseenter={playHover} 
    disabled={currentLoading}
  >
    <div class="sf-btn-glitch-bg"></div>
    <span class="sf-btn-text">
      {currentLoading ? 'Loading...' : '▶ View Stats'}
    </span>
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
    <span class="sf-divider-txt">Quick Entry</span>
    <div class="sf-divider-line"></div>
  </div>

  <div class="sf-profile-row" style="margin-bottom: 8px;">
    <span class="sf-profile-label">My Profile</span>
    <button 
      class="sf-profile-btn" 
      on:click={saveProfile} 
      on:mouseenter={playHover} 
      type="button"
    >
      Set as My Profile
    </button>
  </div>

  {#if myProfile}
    <button
      class="landing-quick-btn"
      on:click={loadProfile}
      on:mouseenter={playHover}
      type="button"
      style="width: 100%; display: flex; align-items: center; justify-content: flex-start; text-align: left; box-sizing: border-box;"
    >
      <div class="landing-quick-dot pulsing-green-dot"></div>
      <div class="quick-profile-details">
        <span class="quick-profile-name">{myProfile.name}</span>
        <span class="quick-profile-tag">#{myProfile.tag}</span>
      </div>
      <div class="quick-profile-meta">
        {(myProfile.region || '').toUpperCase()} · {myProfile.mode}
      </div>
    </button>
  {:else}
    <div class="no-profile-badge">
      No profile saved yet — enter details above and click Set as My Profile
    </div>
  {/if}
</div>

<Toast />

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
    font-size: 20px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 4px;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
  }

  .sf-sub {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 0.5px;
    margin-bottom: 24px;
    text-transform: uppercase;
  }

  .sf-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--muted, #a0a0ab);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sf-required {
    color: #fa4454;
  }

  .sf-input-row {
    position: relative;
    margin-bottom: 18px;
  }

  .sf-input-box-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(5, 5, 8, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 2px;
    transition: all 0.25s ease;
  }

  .sf-input-box-wrapper:focus-within {
    border-color: rgba(250, 68, 84, 0.5);
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.15);
  }

  .sf-input-box-wrapper:focus-within .input-decor-bracket {
    opacity: 1;
    color: #fa4454;
  }

  .input-decor-bracket {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.1);
    pointer-events: none;
    opacity: 0;
    transition: all 0.25s ease;
  }

  .input-decor-bracket.left {
    left: -12px;
  }

  .input-decor-bracket.right {
    right: -12px;
  }

  .sf-input {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #fff;
    background: transparent;
    border: none;
    padding: 10px 12px;
    outline: none;
    box-sizing: border-box;
    width: 100%;
  }

  .sf-hash {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: #fa4454;
    font-weight: bold;
    padding: 0 4px;
    user-select: none;
  }

  .sf-input-tag {
    max-width: 90px;
    text-transform: uppercase;
  }

  /* Autocomplete Dropdown */
  .sf-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: rgba(10, 10, 15, 0.98);
    border: 1px solid rgba(250, 68, 84, 0.35);
    border-radius: 6px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 100;
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  }

  .sf-dropdown-header {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #e8ff47;
    padding: 10px 14px 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(232, 255, 71, 0.02);
  }

  .sf-dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: background 0.15s, border-left 0.15s;
    text-align: left;
    color: inherit;
    border-left: 2px solid transparent;
  }

  .sf-dropdown-item:hover {
    background: rgba(250, 68, 84, 0.08);
    border-left: 2px solid #fa4454;
  }

  .sf-dropdown-rank {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
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
    color: #fa4454;
    border: 1px solid rgba(250, 68, 84, 0.25);
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    flex-shrink: 0;
    background: rgba(250, 68, 84, 0.04);
  }

  /* Region & Mode Selects */
  .sf-row2 {
    display: flex;
    gap: 14px;
    margin-bottom: 20px;
  }

  .sf-row2 > div {
    flex: 1;
  }

  .sf-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .sf-select {
    width: 100%;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: rgba(5, 5, 8, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text, #f4f4f7);
    padding: 10px 30px 10px 12px;
    border-radius: 4px;
    cursor: pointer;
    outline: none;
    appearance: none;
    transition: all 0.2s;
  }

  .sf-select:focus, .sf-select:hover {
    border-color: rgba(250, 68, 84, 0.35);
    box-shadow: 0 0 8px rgba(250, 68, 84, 0.1);
  }

  .select-arrow {
    position: absolute;
    right: 12px;
    font-size: 8px;
    color: var(--muted2, #5b5b66);
    pointer-events: none;
  }

  /* Custom Glitching Action Button */
  .sf-btn {
    width: 100%;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 13px 20px;
    background: #fa4454;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(250, 68, 84, 0.25);
    transition: all 0.2s ease-in-out;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
  }

  .sf-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }

  .sf-btn:hover::after {
    left: 100%;
  }

  .sf-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(250, 68, 84, 0.45);
    background: #ff5c6b;
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
    color: #fa4454;
    margin-bottom: 12px;
    padding: 6px 10px;
    background: rgba(250, 68, 84, 0.06);
    border: 1px solid rgba(250, 68, 84, 0.15);
    border-radius: 4px;
  }

  /* Divider */
  .sf-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }

  .sf-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
  }

  .sf-divider-txt {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  /* Encrypted profiles */
  .sf-profile-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .sf-profile-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sf-profile-btn {
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: #e8ff47;
    letter-spacing: 1.5px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition: all 0.2s;
    background: rgba(232, 255, 71, 0.05);
    border: 1px solid rgba(232, 255, 71, 0.15);
  }

  .sf-profile-btn:hover:not(:disabled) {
    background: rgba(232, 255, 71, 0.15);
    border-color: rgba(232, 255, 71, 0.4);
    box-shadow: 0 0 10px rgba(232, 255, 71, 0.1);
  }

  .landing-quick-btn {
    background: rgba(250, 68, 84, 0.03);
    border: 1px solid rgba(250, 68, 84, 0.15);
    border-radius: 6px;
    padding: 12px 14px;
    transition: all 0.25s;
    cursor: pointer;
  }

  .landing-quick-btn:hover {
    background: rgba(250, 68, 84, 0.08);
    border-color: rgba(250, 68, 84, 0.45);
    box-shadow: 0 4px 15px rgba(250, 68, 84, 0.1);
  }

  .landing-quick-dot {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .pulsing-green-dot {
    box-shadow: 0 0 6px #10b981;
    animation: pulseGlow 1.2s infinite alternate;
  }

  .quick-profile-details {
    flex: 1;
  }

  .quick-profile-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
  }

  .quick-profile-tag {
    color: #fa4454;
    font-size: 11px;
    font-weight: bold;
    margin-left: 2px;
  }

  .quick-profile-meta {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 0.5px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .no-profile-badge {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted2, #5b5b66);
    letter-spacing: 1px;
    padding: 10px;
    border: 1.5px dashed rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    text-align: center;
    background: rgba(255, 255, 255, 0.01);
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

<script>
  import { onMount } from 'svelte';
  import PlayerSearch from './PlayerSearch.svelte';
  import { player, currentView, setPlayer, endFetch, startFetch } from '../../lib/appStore';
  import { bookmarks } from '../../lib/stores';
  import { getRankImgUrl, ACTS_TIMELINE } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  export let onFetchStats = () => {};

  let scrolled = false;
  let subRowVisible = false;
  let mobileFiltersOpen = false;
  let lastScrollY = 0;

  const TABS = [
    { id: 'tracker', label: 'Tracker' },
    { id: 'esports', label: 'Esports' },
    { id: 'store', label: 'Skins Store' },
    { id: 'coach', label: 'Meta Comp Architect' },
    { id: 'overlay', label: 'Stream Overlay' }
  ];

  const REGIONS = [
    { value: 'ap', label: 'AP' },
    { value: 'na', label: 'NA' },
    { value: 'eu', label: 'EU' },
    { value: 'kr', label: 'KR' }
  ];

  const MODES = [
    { value: 'competitive', label: 'Competitive' },
    { value: 'unrated', label: 'Unrated' },
    { value: 'deathmatch', label: 'Deathmatch' },
    { value: 'teamdeathmatch', label: 'Team DM' },
    { value: 'swiftplay', label: 'Swiftplay' },
    { value: 'spikerush', label: 'Spike Rush' }
  ];

  const ACTS = Object.entries(ACTS_TIMELINE).map(([key, val]) => ({
    value: key,
    label: val.name
  }));

  $: isBookmarked = $player.name && $player.tag && $bookmarks.some(
    b => b.name.toLowerCase() === $player.name.toLowerCase() &&
         b.tag.toLowerCase() === $player.tag.toLowerCase()
  );

  $: subRowVisible = $player.loaded;

  onMount(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function handleScroll() {
    const y = window.scrollY;
    scrolled = y > 20;

    if ($currentView === 'tracker' && $player.loaded && y > 150) {
      const diff = y - lastScrollY;
      if (diff > 15) {
        document.body.classList.add('scrolled-down');
        document.body.classList.remove('scrolled-up');
      } else if (diff < -15) {
        document.body.classList.add('scrolled-up');
        document.body.classList.remove('scrolled-down');
      }
    }
    lastScrollY = y;
  }

  function switchTab(id) {
    $currentView = id;
    document.body.classList.remove('scrolled-down', 'scrolled-up');
  }

  function handleSearch(name, tag) {
    if (!name || !tag) return;
    setPlayer({ name, tag });
    onFetchStats();
  }

  function handleRegionChange(region) {
    setPlayer({ region });
  }

  function handleFilterChange(key, value) {
    setPlayer({ [key]: value });
  }

  function toggleBookmark() {
    if (!$player.name || !$player.tag) return;
    bookmarks.toggle?.($player.name, $player.tag, $player.region, $player.mode);
  }

  function copyRiotId() {
    const id = `${$player.name}#${$player.tag}`;
    navigator.clipboard?.writeText(id).then(() => {
      // toast would go here
    });
  }

  function toggleMobileFilters() {
    mobileFiltersOpen = !mobileFiltersOpen;
  }
</script>

<nav class="topbar" class:topbar-scrolled={scrolled}>
  <!-- Row 1: Main Header -->
  <div class="topbar-main-row">
    <a href="/" class="topbar-logo">
      <img src="/logo.png" alt="" class="topbar-logo-icon">
      <span>ValTracker</span>
    </a>

    <div class="topbar-tabs">
      {#each TABS as tab}
        <button
          class="topbar-tab"
          class:active={$currentView === tab.id}
          on:click={() => switchTab(tab.id)}
        >{tab.label}</button>
      {/each}
    </div>

    <div class="topbar-search-area">
      <PlayerSearch
        compact={subRowVisible}
        value={$player.name}
        tagValue={$player.tag}
        region={$player.region}
        onSubmit={handleSearch}
        onRegionChange={handleRegionChange}
      />
    </div>
  </div>

  <!-- Row 2: Sub Header (Active Pill + Filters) -->
  {#if subRowVisible}
    <div class="topbar-sub-row">
      <div class="topbar-sub-left">
        <div class="active-pill">
          <div class="active-pill-avatar">
            <div class="active-pill-avatar-fallback">👤</div>
          </div>
          <span class="active-pill-name">{$player.name}#{$player.tag}</span>
          <button
            class="active-pill-btn bookmark-btn"
            class:bookmarked={isBookmarked}
            on:click={toggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Player'}
          >★</button>
          <button class="active-pill-btn" on:click={copyRiotId} title="Copy ID">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>

        <button class="mobile-filter-toggle" on:click={toggleMobileFilters}>
          ⚙️ Filters
        </button>
      </div>

      <div class="topbar-right" class:mobile-expanded={mobileFiltersOpen}>
        <div class="filter-capsule">
          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </span>
            <select class="filter-select" value={$player.region} on:change={(e) => handleFilterChange('region', e.target.value)}>
              {#each REGIONS as r}
                <option value={r.value}>{r.label}</option>
              {/each}
            </select>
          </div>

          <div class="filter-divider"></div>

          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="6" width="20" height="12" rx="3"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/></svg>
            </span>
            <select class="filter-select" value={$player.mode} on:change={(e) => handleFilterChange('mode', e.target.value)}>
              {#each MODES as m}
                <option value={m.value}>{m.label}</option>
              {/each}
            </select>
          </div>

          <div class="filter-divider"></div>

          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <select class="filter-select" value={$player.act} on:change={(e) => handleFilterChange('act', e.target.value)}>
              {#each ACTS as a}
                <option value={a.value}>{a.label}</option>
              {/each}
              <option value="all">Lifetime</option>
            </select>
          </div>
        </div>

        <button class="fetch-btn" on:click={onFetchStats} disabled={$player.fetching}>
          {$player.fetching ? 'Fetching...' : '↻ Fetch Stats'}
        </button>
      </div>
    </div>
  {/if}
</nav>

<style>
  .topbar {
    display: flex;
    flex-direction: column;
    padding: 12px 20px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(3, 3, 4, 0.95);
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    gap: 8px;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  :global(body.scrolled-down) .topbar {
    transform: translateY(-100%);
  }

  :global(body.scrolled-up) .topbar {
    transform: translateY(0);
  }

  .topbar-scrolled {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .topbar-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 16px;
  }

  .topbar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 3px;
    color: var(--text);
    text-transform: uppercase;
    text-decoration: none;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .topbar-logo span {
    color: var(--accent);
  }

  .topbar-logo-icon {
    height: 24px;
    width: auto;
    filter: drop-shadow(0 0 6px rgba(255, 70, 85, 0.6));
  }

  .topbar-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .topbar-tab {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 6px 14px;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .topbar-tab:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }

  .topbar-tab.active {
    color: #fff;
    background: rgba(255, 70, 85, 0.12);
    border: 1px solid rgba(255, 70, 85, 0.25);
  }

  .topbar-search-area {
    position: relative;
    flex-shrink: 0;
  }

  .topbar-sub-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    padding-top: 8px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .topbar-sub-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .active-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
  }

  .active-pill-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .active-pill-avatar-fallback {
    font-size: 12px;
  }

  .active-pill-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
  }

  .active-pill-btn {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bookmark-btn {
    font-size: 14px;
  }

  .bookmark-btn:hover {
    color: #ffd700;
    transform: scale(1.2);
  }

  .bookmark-btn.bookmarked {
    color: #ffd700;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
  }

  .active-pill-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  .mobile-filter-toggle {
    display: none;
    align-items: center;
    gap: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--muted);
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 5px 10px;
    cursor: pointer;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-capsule {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .filter-icon {
    color: var(--muted);
    display: flex;
    align-items: center;
  }

  .filter-select {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: transparent;
    border: none;
    color: var(--text);
    padding: 4px 4px;
    cursor: pointer;
    outline: none;
    appearance: none;
  }

  .filter-select option {
    background: #121216;
    color: var(--text);
  }

  .filter-divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.08);
  }

  .fetch-btn {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 7px 16px;
    background: var(--accent);
    color: #0d0d0f;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(250, 68, 84, 0.2);
    transition: var(--transition);
    white-space: nowrap;
  }

  .fetch-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(250, 68, 84, 0.35);
  }

  .fetch-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
  }

  .fetch-btn:disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  @media (max-width: 800px) {
    .topbar-tabs {
      display: none;
    }
    .mobile-filter-toggle {
      display: inline-flex;
    }
    .filter-capsule {
      display: none;
    }
    .topbar-right.mobile-expanded .filter-capsule {
      display: flex;
      flex-wrap: wrap;
    }
    .topbar-main-row {
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .topbar {
      padding: 10px 12px 8px;
    }
    .topbar-logo {
      font-size: 18px;
      letter-spacing: 2px;
    }
    .active-pill-name {
      font-size: 11px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>

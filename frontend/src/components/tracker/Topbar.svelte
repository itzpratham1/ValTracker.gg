<script>
  import { onMount } from 'svelte';
  import PlayerSearch from './PlayerSearch.svelte';
  import { player, currentView, setPlayer, endFetch, startFetch } from '../../lib/appStore';
  import { bookmarks } from '../../lib/stores';
  import { getRankImgUrl, ACTS_TIMELINE } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  import { clearAllMatches } from '../../lib/indexeddb';
  import { getAgentIconUrl } from '../../lib/assets';

  export let currentAgentName = '';
  export let onFetchStats = () => {};
  export let onOpenH2H = () => {};
  export let onOpenLeaderboard = () => {};
  export let onOpenFeedback = () => {};
  export let onOpenBookmarks = () => {};

  let utilitiesOpen = false;
  let copied = false;
  let topbarEl;

  function copyProfileLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      copied = true;
      if (window.showToast) window.showToast('Link copied!');
      setTimeout(() => { copied = false; }, 2000);
    });
    utilitiesOpen = false;
  }

  function handleClearCache() {
    if (confirm('Are you sure you want to clear all stored matches and cache?')) {
      localStorage.clear();
      clearAllMatches().then(() => {
        window.location.reload();
      });
    }
    utilitiesOpen = false;
  }

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

  $: subRowVisible = $player.loaded && $player.name && $player.tag;

  $: filterSummaryText = (() => {
    const r = ($player.region || 'ap').toUpperCase();
    const mRaw = $player.mode || 'competitive';
    let m = mRaw;
    if (mRaw === 'competitive') m = 'Comp';
    else if (mRaw === 'unrated') m = 'Unrated';
    else if (mRaw === 'deathmatch') m = 'DM';
    else if (mRaw === 'teamdeathmatch') m = 'Team DM';
    else if (mRaw === 'swiftplay') m = 'Swift';
    else if (mRaw === 'spikerush') m = 'Spike';
    const actEntry = ACTS_TIMELINE[$player.act];
    const a = actEntry ? actEntry.name : ($player.act || 'v26a4');
    return `${r} \u00B7 ${m} \u00B7 ${a}`;
  })();

  onMount(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', closeDropdowns);

    let resizeObserver;
    if (topbarEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const rectHeight = entry.target.getBoundingClientRect().height;
          document.documentElement.style.setProperty('--topbar-height', `${rectHeight}px`);
        }
      });
      resizeObserver.observe(topbarEl);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', closeDropdowns);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.body.classList.remove('scrolled-down', 'scrolled-up');
    };
  });

  function closeDropdowns() {
    utilitiesOpen = false;
  }

  function handleScroll() {
    const y = window.scrollY;
    scrolled = y > 20;

    if ($currentView === 'tracker' && $player.loaded) {
      if (y > 150) {
        const diff = y - lastScrollY;
        if (diff > 15) {
          document.body.classList.add('scrolled-down');
          document.body.classList.remove('scrolled-up');
        } else if (diff < -15) {
          document.body.classList.add('scrolled-up');
          document.body.classList.remove('scrolled-down');
        }
      } else {
        document.body.classList.remove('scrolled-down', 'scrolled-up');
      }
    } else {
      document.body.classList.remove('scrolled-down', 'scrolled-up');
    }
    lastScrollY = y;
  }

  function switchTab(id) {
    if (id === 'coach') {
      history.pushState({}, '', '/comp');
      $currentView = 'coach';
      return;
    }
    if (id === 'esports' || id === 'store' || id === 'overlay') {
      const targetHash = id === 'esports' ? '#esports' : id === 'store' ? '#skins' : '#overlay';
      if (window.location.pathname !== '/app') {
        history.pushState({}, '', `/app${targetHash}`);
      } else {
        history.replaceState({}, '', `/app${targetHash}`);
      }
      $currentView = id;
      return;
    }
    if (id === 'tracker') {
      if ($player.name && $player.tag) {
        const p = new URLSearchParams();
        p.set('name', $player.name);
        p.set('tag', $player.tag);
        p.set('region', $player.region || 'ap');
        p.set('mode', $player.mode || 'competitive');
        history.replaceState({}, '', `/app?${p.toString()}`);
        $currentView = 'tracker';
      } else {
        setPlayer({ loaded: false, fetching: false });
        history.replaceState({}, '', '/app');
        $currentView = 'tracker';
      }
      document.body.classList.remove('scrolled-down', 'scrolled-up');
      return;
    }
    $currentView = id;
    document.body.classList.remove('scrolled-down', 'scrolled-up');
  }

  function sanitizeTag(raw) {
    if (!raw) return raw;
    let tag = raw;
    tag = tag.replace(/\u00AE/g, '&');
    const sepIdx = tag.search(/[=&]/);
    if (sepIdx !== -1) tag = tag.substring(0, sepIdx);
    return tag.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function handleSearch(name, tag) {
    if (!name || !tag) return;
    const cleanTag = sanitizeTag(tag);
    setPlayer({ name, tag: cleanTag });
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
    bookmarks.toggle({
      name: $player.name,
      tag: $player.tag,
      region: $player.region || 'ap',
      mode: $player.mode || 'competitive',
      rankName: ''
    });
  }

  function copyRiotId() {
    const id = `${$player.name}#{$player.tag}`;
    navigator.clipboard?.writeText(id).then(() => {
      if (window.showToast) window.showToast('ID copied!');
    });
  }

  function toggleMobileFilters() {
    mobileFiltersOpen = !mobileFiltersOpen;
  }

  function goHome(e) {
    if (e) e.preventDefault();
    player.set({
      name: '',
      tag: '',
      region: 'ap',
      mode: 'competitive',
      act: 'v26a4',
      loaded: false,
      fetching: false
    });
    $currentView = 'tracker';
    window.history.pushState({}, '', '/');
  }
</script>

<nav class="topbar" bind:this={topbarEl}>
  <!-- Row 1: Main Header (Logo & Navigation) -->
  <div class="topbar-main-row">
    <a href="/" class="topbar-logo" on:click|preventDefault={goHome}>
      <img src="/logo.png" alt="" class="topbar-logo-icon">
      VAL<span class="logo-accent">TRACKER</span>
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

    <!-- Persistent Global Searchbar in Row 1 -->
    <div class="player-search-wrap" style="position: relative;">
      <input class="player-input" type="text" placeholder="Name" bind:value={$player.name} autocomplete="off" spellcheck="false">
      <span class="player-input-hash">#</span>
      <input class="player-input player-input-tag" type="text" placeholder="TAG" bind:value={$player.tag} maxlength="8" autocomplete="off" spellcheck="false" on:input={() => { $player.tag = sanitizeTag($player.tag); }}>
      <button class="topbar-search-submit-btn" on:click={() => handleSearch($player.name, $player.tag)} title="Search">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <div id="topbar-search-dropdown" class="search-dropdown"></div>
    </div>
  </div>
  
  <!-- Row 2: Sub Header (Search Controls & Filters) — tracker view only -->
  {#if subRowVisible && $currentView === 'tracker'}
    <div class="topbar-sub-row">
      <div class="topbar-sub-left">
        <div class="player-active-pill">
          <div class="active-pill-avatar-wrap">
            {#if currentAgentName}
              <img class="active-pill-avatar-img" src={getAgentIconUrl(currentAgentName)} alt={currentAgentName} on:error={(e) => e.target.style.display='none'}>
            {/if}
            <div class="active-pill-avatar-fallback" style="display:{currentAgentName ? 'none' : 'flex'};">👤</div>
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

        <div class="filter-summary-text">
          <span class="filter-summary-icon">
            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          {filterSummaryText}
        </div>

        <button class="mobile-filter-toggle" on:click={toggleMobileFilters}>
          ⚙️ Filters
        </button>
      </div>
      
      <div class="topbar-right" class:mobile-expanded={mobileFiltersOpen}>
        <div class="topbar-filter-capsule">
          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="filter-icon-svg">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </span>
            <select class="region-select" value={$player.region} on:change={(e) => handleFilterChange('region', e.target.value)}>
              {#each REGIONS as r}
                <option value={r.value}>{r.label}</option>
              {/each}
            </select>
            <span class="chevron-icon">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          <div class="filter-divider"></div>

          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="filter-icon-svg">
                <rect x="2" y="6" width="20" height="12" rx="3"></rect>
                <line x1="6" y1="12" x2="10" y2="12"></line>
                <line x1="8" y1="10" x2="8" y2="14"></line>
                <circle cx="15.5" cy="10.5" r="1" fill="currentColor"></circle>
                <circle cx="15.5" cy="13.5" r="1" fill="currentColor"></circle>
                <circle cx="18.5" cy="12" r="1" fill="currentColor"></circle>
              </svg>
            </span>
            <select class="region-select" value={$player.mode} on:change={(e) => { setPlayer({ mode: e.target.value }); onFetchStats(); }}>
              {#each MODES as m}
                <option value={m.value}>{m.label}</option>
              {/each}
            </select>
            <span class="chevron-icon">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          <div class="filter-divider"></div>

          <div class="filter-item">
            <span class="filter-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="filter-icon-svg">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            <select class="region-select" value={$player.act} on:change={(e) => handleFilterChange('act', e.target.value)}>
              {#each ACTS as a}
                <option value={a.value}>{a.label}</option>
              {/each}
              <option value="all">Lifetime</option>
            </select>
            <span class="chevron-icon">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
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
  .topbar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 22px;
    letter-spacing: 3px;
    color: #ffffff;
    text-transform: uppercase;
    text-decoration: none;
    flex-shrink: 0;
    white-space: nowrap;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .topbar-logo:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .topbar-logo .logo-accent {
    color: var(--accent, #fa4454);
    font-weight: 800;
  }
  .topbar-logo-icon {
    height: 26px;
    width: auto;
    filter: drop-shadow(0 0 8px rgba(250, 68, 84, 0.6));
  }
  @media (max-width: 800px) {
    .topbar-logo {
      font-size: 22px !important;
      letter-spacing: 2.5px !important;
    }
    .topbar-logo-icon {
      height: 24px !important;
    }
  }
</style>

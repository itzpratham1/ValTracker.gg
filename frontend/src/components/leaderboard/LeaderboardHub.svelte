<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { currentView } from '../../lib/appStore';
  import { getRankImgUrl } from '../../lib/constants';

  const API_BASE = (import.meta.env.PUBLIC_API_URL || '') + '/api';

  const REGIONS = [
    { value: 'ap', label: 'Asia Pacific', short: 'AP', flag: '🌏' },
    { value: 'na', label: 'North America', short: 'NA', flag: '🇺🇸' },
    { value: 'eu', label: 'Europe', short: 'EU', flag: '🇪🇺' },
    { value: 'kr', label: 'Korea', short: 'KR', flag: '🇰🇷' },
    { value: 'br', label: 'Brazil', short: 'BR', flag: '🇧🇷' },
    { value: 'latam', label: 'Latin America', short: 'LATAM', flag: '🇲🇽' }
  ];

  const TIERS = [
    { id: 'all', label: 'All Tiers' },
    { id: '27', label: 'Radiant', icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png' },
    { id: '26', label: 'Immortal 3', icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/26/smallicon.png' },
    { id: '25', label: 'Immortal 2', icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/smallicon.png' },
    { id: '24', label: 'Immortal 1', icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/smallicon.png' }
  ];

  let activeRegion = 'ap';
  let selectedTier = 'all';
  let searchQuery = '';
  let sortBy = 'rank'; // 'rank' | 'rr' | 'wins'
  let rangeLimit = 1000; // 100 | 500 | 1000

  // Pagination
  let pageSize = 50;
  let currentPage = 1;

  // Data & State
  let loading = true;
  let refreshing = false;
  let error = '';
  let players = [];
  let lastUpdated = '';
  const regionalCache = new Map();

  $: isVisible = $currentView === 'leaderboards';

  onMount(() => {
    // Read initial region from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    if (regionParam && REGIONS.some(r => r.value === regionParam.toLowerCase())) {
      activeRegion = regionParam.toLowerCase();
    }
    fetchLeaderboard(activeRegion);
  });

  async function fetchLeaderboard(region, force = false) {
    if (!force && regionalCache.has(region)) {
      players = regionalCache.get(region);
      loading = false;
      refreshing = false;
      error = '';
      lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return;
    }

    if (force) refreshing = true;
    else loading = true;
    error = '';

    try {
      const res = await fetch(`${API_BASE}/v1/leaderboard/${region}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch leaderboard`);
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        players = json.data;
        regionalCache.set(region, players);
        lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else {
        throw new Error('Leaderboard response format invalid');
      }
    } catch (e) {
      console.error('[Leaderboard error]', e);
      error = e.message || 'Unable to retrieve leaderboard from Riot servers.';
      if (!regionalCache.has(region)) {
        players = [];
      }
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  function handleRegionChange(region) {
    if (activeRegion === region) return;
    activeRegion = region;
    currentPage = 1;
    searchQuery = '';
    
    // Sync URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('region', region);
    window.history.replaceState({}, '', url.toString());

    fetchLeaderboard(region);
  }

  function handleRefresh() {
    fetchLeaderboard(activeRegion, true);
  }

  // Filter and sort players
  $: processedPlayers = (() => {
    let list = players || [];

    // Range limit
    if (rangeLimit < list.length) {
      list = list.slice(0, rangeLimit);
    }

    // Tier filter
    if (selectedTier !== 'all') {
      const tierNum = parseInt(selectedTier, 10);
      list = list.filter(p => p.competitiveTier === tierNum);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => {
        if (p.IsAnonymized || !p.gameName) {
          return 'secret agent'.includes(q);
        }
        const fullId = `${p.gameName}#${p.tagLine || ''}`.toLowerCase();
        return fullId.includes(q) || p.gameName.toLowerCase().includes(q);
      });
    }

    // Sort
    if (sortBy === 'rr') {
      list = [...list].sort((a, b) => (b.rankedRating || 0) - (a.rankedRating || 0));
    } else if (sortBy === 'wins') {
      list = [...list].sort((a, b) => (b.numberOfWins || 0) - (a.numberOfWins || 0));
    } else {
      // Default: leaderboard rank
      list = [...list].sort((a, b) => (a.leaderboardRank || 0) - (b.leaderboardRank || 0));
    }

    return list;
  })();

  // Top 3 Podium players (from unfiltered raw list)
  $: podiumPlayers = (players || []).slice(0, 3);

  // Pagination calculation
  $: totalPages = Math.max(1, Math.ceil(processedPlayers.length / pageSize));
  $: paginatedPlayers = pageSize === 0 
      ? processedPlayers 
      : processedPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Top stats summary
  $: maxRR = players.length > 0 ? Math.max(...players.map(p => p.rankedRating || 0)) : 0;
  $: radiantCutoff = players.filter(p => p.competitiveTier === 27).pop()?.rankedRating || 0;
  $: totalRadiants = players.filter(p => p.competitiveTier === 27).length;

  function getTierLabel(tier) {
    if (tier === 27) return 'Radiant';
    if (tier === 26) return 'Immortal 3';
    if (tier === 25) return 'Immortal 2';
    if (tier === 24) return 'Immortal 1';
    return 'Immortal';
  }

  function getTierIcon(tier) {
    return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier || 27}/smallicon.png`;
  }

  function getPlayerCardUrl(cardId) {
    if (!cardId) return null;
    return `https://media.valorant-api.com/playercards/${cardId}/smallart.png`;
  }

  function getPlayerCardWideUrl(cardId) {
    if (!cardId) return null;
    return `https://media.valorant-api.com/playercards/${cardId}/wideart.png`;
  }

  function getProfileUrl(p) {
    if (p.IsAnonymized || !p.gameName) return '#';
    const params = new URLSearchParams();
    params.set('name', p.gameName);
    params.set('tag', p.tagLine || '000');
    params.set('region', activeRegion);
    params.set('mode', 'competitive');
    return `/app?${params.toString()}`;
  }

  function goToPage(p) {
    currentPage = Math.max(1, Math.min(totalPages, p));
    const tableEl = document.getElementById('lb-table-anchor');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<div class="leaderboard-hub">
  <!-- Hero Section -->
  <header class="lb-hero">
    <div class="lb-hero-bg"></div>
    <div class="lb-hero-content">
      <div class="lb-badge">
        <span class="live-dot"></span>
        LIVE RADIANT & IMMORTAL TELEMETRY
      </div>
      <h1 class="lb-title">VALORANT LEADERBOARD</h1>
      <p class="lb-subtitle">
        Official Top 1,000 regional player rankings, MMR ratings, win records, and direct profile inspection.
      </p>

      <!-- Region Switcher -->
      <div class="region-tabs" role="tablist">
        {#each REGIONS as r}
          <button
            class="region-tab"
            class:active={activeRegion === r.value}
            on:click={() => handleRegionChange(r.value)}
            role="tab"
            aria-selected={activeRegion === r.value}
          >
            <span class="region-flag">{r.flag}</span>
            <span class="region-name">{r.short}</span>
            <span class="region-full">{r.label}</span>
          </button>
        {/each}
      </div>

      <!-- Quick Metrics Strip -->
      <div class="lb-stats-strip">
        <div class="stat-pill">
          <span class="stat-pill-label">REGION</span>
          <span class="stat-pill-val accent">{activeRegion.toUpperCase()}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">PLAYERS TRACKED</span>
          <span class="stat-pill-val">{players.length || '1,000'}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">PEAK RANK RATING</span>
          <span class="stat-pill-val gold">{maxRR ? `${maxRR} RR` : '—'}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">RADIANTS IN REGION</span>
          <span class="stat-pill-val">{totalRadiants || '—'}</span>
        </div>
        <div class="stat-pill sync-pill">
          <span class="stat-pill-label">LAST SYNC</span>
          <span class="stat-pill-val dim">{lastUpdated || 'Live'}</span>
          <button class="refresh-btn" class:spin={refreshing} on:click={handleRefresh} title="Refresh leaderboard data">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Top 3 Podium Radiants (Only shown when not actively searching) -->
  {#if !searchQuery && podiumPlayers.length >= 3 && !loading}
    <section class="podium-section" in:fade={{ duration: 300 }}>
      <div class="section-tag">
        <span class="section-tag-line"></span>
        <span class="section-tag-title">🏆 REGIONAL TOP 3 RADIANTS</span>
        <span class="section-tag-line"></span>
      </div>

      <div class="podium-grid">
        <!-- Rank #2 Silver -->
        {#if podiumPlayers[1]}
          {@const p2 = podiumPlayers[1]}
          {@const isAnon2 = p2.IsAnonymized || !p2.gameName}
          <div class="podium-card rank-2" in:fly={{ y: 20, duration: 400, delay: 100 }}>
            <div class="podium-card-bg" style="background-image: url('{getPlayerCardWideUrl(p2.PlayerCardID) || ''}')"></div>
            <div class="podium-rank-badge rank-2-badge">#2</div>
            <div class="podium-avatar-wrap">
              {#if getPlayerCardUrl(p2.PlayerCardID)}
                <img src={getPlayerCardUrl(p2.PlayerCardID)} alt="Player card" class="podium-avatar-img" />
              {:else}
                <div class="podium-avatar-fallback">🥈</div>
              {/if}
            </div>
            <div class="podium-name-wrap">
              {#if isAnon2}
                <span class="podium-name anon">Secret Agent</span>
              {:else}
                <span class="podium-name">{p2.gameName}</span>
                <span class="podium-tag">#{p2.tagLine}</span>
              {/if}
            </div>
            <div class="podium-tier-pill">
              <img src={getTierIcon(p2.competitiveTier)} alt="Tier" class="podium-tier-icon" />
              <span>{getTierLabel(p2.competitiveTier)}</span>
            </div>
            <div class="podium-metrics">
              <div class="podium-stat">
                <span class="podium-stat-num gold">{p2.rankedRating}</span>
                <span class="podium-stat-lbl">RR</span>
              </div>
              <div class="podium-stat-div"></div>
              <div class="podium-stat">
                <span class="podium-stat-num win">{p2.numberOfWins}</span>
                <span class="podium-stat-lbl">WINS</span>
              </div>
            </div>
            {#if !isAnon2}
              <a href={getProfileUrl(p2)} class="podium-cta">
                Inspect Profile <span>→</span>
              </a>
            {/if}
          </div>
        {/if}

        <!-- Rank #1 Champion Gold (Center) -->
        {#if podiumPlayers[0]}
          {@const p1 = podiumPlayers[0]}
          {@const isAnon1 = p1.IsAnonymized || !p1.gameName}
          <div class="podium-card rank-1 champion" in:fly={{ y: 20, duration: 400 }}>
            <div class="crown-icon">👑</div>
            <div class="podium-card-bg" style="background-image: url('{getPlayerCardWideUrl(p1.PlayerCardID) || ''}')"></div>
            <div class="podium-rank-badge rank-1-badge">#1</div>
            <div class="podium-avatar-wrap champion-avatar">
              {#if getPlayerCardUrl(p1.PlayerCardID)}
                <img src={getPlayerCardUrl(p1.PlayerCardID)} alt="Player card" class="podium-avatar-img" />
              {:else}
                <div class="podium-avatar-fallback">👑</div>
              {/if}
            </div>
            <div class="podium-name-wrap">
              {#if isAnon1}
                <span class="podium-name champion-name anon">Secret Agent</span>
              {:else}
                <span class="podium-name champion-name">{p1.gameName}</span>
                <span class="podium-tag">#{p1.tagLine}</span>
              {/if}
            </div>
            <div class="podium-tier-pill radiant-pill">
              <img src={getTierIcon(p1.competitiveTier)} alt="Radiant" class="podium-tier-icon" />
              <span>{getTierLabel(p1.competitiveTier)}</span>
            </div>
            <div class="podium-metrics champion-metrics">
              <div class="podium-stat">
                <span class="podium-stat-num gold glow">{p1.rankedRating}</span>
                <span class="podium-stat-lbl">RR</span>
              </div>
              <div class="podium-stat-div"></div>
              <div class="podium-stat">
                <span class="podium-stat-num win">{p1.numberOfWins}</span>
                <span class="podium-stat-lbl">WINS</span>
              </div>
            </div>
            {#if !isAnon1}
              <a href={getProfileUrl(p1)} class="podium-cta champion-cta">
                ⚡ View Champion Stats <span>→</span>
              </a>
            {/if}
          </div>
        {/if}

        <!-- Rank #3 Bronze -->
        {#if podiumPlayers[2]}
          {@const p3 = podiumPlayers[2]}
          {@const isAnon3 = p3.IsAnonymized || !p3.gameName}
          <div class="podium-card rank-3" in:fly={{ y: 20, duration: 400, delay: 200 }}>
            <div class="podium-card-bg" style="background-image: url('{getPlayerCardWideUrl(p3.PlayerCardID) || ''}')"></div>
            <div class="podium-rank-badge rank-3-badge">#3</div>
            <div class="podium-avatar-wrap">
              {#if getPlayerCardUrl(p3.PlayerCardID)}
                <img src={getPlayerCardUrl(p3.PlayerCardID)} alt="Player card" class="podium-avatar-img" />
              {:else}
                <div class="podium-avatar-fallback">🥉</div>
              {/if}
            </div>
            <div class="podium-name-wrap">
              {#if isAnon3}
                <span class="podium-name anon">Secret Agent</span>
              {:else}
                <span class="podium-name">{p3.gameName}</span>
                <span class="podium-tag">#{p3.tagLine}</span>
              {/if}
            </div>
            <div class="podium-tier-pill">
              <img src={getTierIcon(p3.competitiveTier)} alt="Tier" class="podium-tier-icon" />
              <span>{getTierLabel(p3.competitiveTier)}</span>
            </div>
            <div class="podium-metrics">
              <div class="podium-stat">
                <span class="podium-stat-num gold">{p3.rankedRating}</span>
                <span class="podium-stat-lbl">RR</span>
              </div>
              <div class="podium-stat-div"></div>
              <div class="podium-stat">
                <span class="podium-stat-num win">{p3.numberOfWins}</span>
                <span class="podium-stat-lbl">WINS</span>
              </div>
            </div>
            {#if !isAnon3}
              <a href={getProfileUrl(p3)} class="podium-cta">
                Inspect Profile <span>→</span>
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Main Table Container & Controls -->
  <main class="lb-main-container" id="lb-table-anchor">
    <!-- Controls Toolbar -->
    <div class="lb-toolbar">
      <!-- Search Input -->
      <div class="search-box">
        <span class="search-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Filter by Riot ID (e.g. Meiy#2006 or TenZ)..."
          class="search-input"
          bind:value={searchQuery}
          on:input={() => { currentPage = 1; }}
        />
        {#if searchQuery}
          <button class="clear-btn" on:click={() => { searchQuery = ''; currentPage = 1; }}>✕</button>
        {/if}
      </div>

      <!-- Tier Filters -->
      <div class="tier-filters">
        {#each TIERS as t}
          <button
            class="tier-pill"
            class:active={selectedTier === t.id}
            on:click={() => { selectedTier = t.id; currentPage = 1; }}
          >
            {#if t.icon}
              <img src={t.icon} alt="" class="tier-pill-icon" />
            {/if}
            <span>{t.label}</span>
          </button>
        {/each}
      </div>

      <!-- Range & Sort Dropdowns -->
      <div class="right-controls">
        <div class="control-group">
          <label for="lb-range">Range:</label>
          <select id="lb-range" class="control-select" bind:value={rangeLimit} on:change={() => { currentPage = 1; }}>
            <option value={100}>Top 100</option>
            <option value={500}>Top 500</option>
            <option value={1000}>Top 1,000</option>
          </select>
        </div>

        <div class="control-group">
          <label for="lb-sort">Sort:</label>
          <select id="lb-sort" class="control-select" bind:value={sortBy} on:change={() => { currentPage = 1; }}>
            <option value="rank">Rank (#1-1000)</option>
            <option value="rr">Rank Rating (High)</option>
            <option value="wins">Total Wins (High)</option>
          </select>
        </div>

        <div class="control-group">
          <label for="lb-pagesize">Per Page:</label>
          <select id="lb-pagesize" class="control-select" bind:value={pageSize} on:change={() => { currentPage = 1; }}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={0}>Show All</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filter Info Strip -->
    <div class="filter-status-strip">
      <span>Showing <strong>{processedPlayers.length}</strong> player{processedPlayers.length === 1 ? '' : 's'}</span>
      {#if searchQuery}
        <span class="active-tag">Matching: "{searchQuery}"</span>
      {/if}
      {#if selectedTier !== 'all'}
        <span class="active-tag">Tier: {getTierLabel(parseInt(selectedTier, 10))}</span>
      {/if}
    </div>

    <!-- Leaderboard Table -->
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <div class="loading-text">COMMUNICATING WITH VALORANT REGIONAL SYSTEMS...</div>
      </div>
    {:else if error}
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <p class="error-msg">{error}</p>
        <button class="retry-btn" on:click={() => fetchLeaderboard(activeRegion, true)}>Retry Fetch</button>
      </div>
    {:else if paginatedPlayers.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Players Found</h3>
        <p>No players matched your search or tier filter in this region.</p>
        <button class="reset-filter-btn" on:click={() => { searchQuery = ''; selectedTier = 'all'; rangeLimit = 1000; }}>
          Reset All Filters
        </button>
      </div>
    {:else}
      <div class="table-card">
        <div class="table-responsive">
          <table class="lb-table">
            <thead>
              <tr>
                <th class="th-rank">Rank</th>
                <th class="th-player">Player / Riot ID</th>
                <th class="th-tier">Competitive Tier</th>
                <th class="th-rr text-right">Rank Rating</th>
                <th class="th-wins text-right">Wins</th>
                <th class="th-action text-center">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedPlayers as p, idx ((p.puuid || p.leaderboardRank || idx))}
                {@const isAnon = p.IsAnonymized || !p.gameName}
                {@const isTop1 = p.leaderboardRank === 1}
                {@const isTop2 = p.leaderboardRank === 2}
                {@const isTop3 = p.leaderboardRank === 3}
                {@const isTop10 = p.leaderboardRank <= 10}
                <tr class="lb-row" class:top-10={isTop10} class:top-3={isTop1 || isTop2 || isTop3}>
                  <!-- Rank Number -->
                  <td class="td-rank">
                    <div class="rank-badge-wrap">
                      {#if isTop1}
                        <span class="medal gold-medal" title="Rank 1 Champion">🥇 #1</span>
                      {:else if isTop2}
                        <span class="medal silver-medal" title="Rank 2 Runner-up">🥈 #2</span>
                      {:else if isTop3}
                        <span class="medal bronze-medal" title="Rank 3 Bronze">🥉 #3</span>
                      {:else}
                        <span class="rank-num" class:top-ten={isTop10}>#{p.leaderboardRank}</span>
                      {/if}
                    </div>
                  </td>

                  <!-- Player Info -->
                  <td class="td-player">
                    <div class="player-flex">
                      <div class="player-avatar-wrap">
                        {#if getPlayerCardUrl(p.PlayerCardID)}
                          <img
                            src={getPlayerCardUrl(p.PlayerCardID)}
                            alt=""
                            class="player-avatar-img"
                            loading="lazy"
                            on:error={(e) => e.target.style.display = 'none'}
                          />
                        {/if}
                        <div class="player-avatar-fallback">👤</div>
                      </div>
                      <div class="player-details">
                        {#if isAnon}
                          <span class="player-name anon">Secret Agent</span>
                        {:else}
                          <a href={getProfileUrl(p)} class="player-link">
                            <span class="player-name">{p.gameName}</span>
                            <span class="player-tag">#{p.tagLine}</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </td>

                  <!-- Competitive Tier -->
                  <td class="td-tier">
                    <div class="tier-flex">
                      <img src={getTierIcon(p.competitiveTier)} alt="" class="tier-icon-small" loading="lazy" />
                      <span class="tier-name" class:radiant-text={p.competitiveTier === 27}>
                        {getTierLabel(p.competitiveTier)}
                      </span>
                    </div>
                  </td>

                  <!-- Ranked Rating -->
                  <td class="td-rr text-right">
                    <div class="rr-container">
                      <span class="rr-text">{p.rankedRating} <span class="rr-unit">RR</span></span>
                      <div class="rr-bar-mini">
                        <div
                          class="rr-bar-mini-fill"
                          style="width: {Math.min(100, Math.max(8, (p.rankedRating / (maxRR || 1000)) * 100))}%"
                        ></div>
                      </div>
                    </div>
                  </td>

                  <!-- Total Wins -->
                  <td class="td-wins text-right">
                    <div class="wins-container">
                      <span class="wins-count">{p.numberOfWins}</span>
                      <span class="wins-label">W</span>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="td-action text-center">
                    {#if !isAnon}
                      <a href={getProfileUrl(p)} class="table-inspect-btn" title="Inspect {p.gameName}'s stats">
                        <span>Inspect</span>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </a>
                    {:else}
                      <span class="anon-lock" title="Player identity hidden by client">🔒</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        {#if pageSize > 0 && totalPages > 1}
          <div class="pagination-bar">
            <button
              class="page-btn nav-step"
              disabled={currentPage === 1}
              on:click={() => goToPage(currentPage - 1)}
            >
              ← Prev
            </button>

            <div class="page-numbers">
              {#if currentPage > 3}
                <button class="page-btn" on:click={() => goToPage(1)}>1</button>
                {#if currentPage > 4}
                  <span class="page-ellipsis">…</span>
                {/if}
              {/if}

              {#each Array(totalPages) as _, i}
                {@const pNum = i + 1}
                {#if pNum >= currentPage - 2 && pNum <= currentPage + 2}
                  <button
                    class="page-btn"
                    class:active={currentPage === pNum}
                    on:click={() => goToPage(pNum)}
                  >
                    {pNum}
                  </button>
                {/if}
              {/each}

              {#if currentPage < totalPages - 2}
                {#if currentPage < totalPages - 3}
                  <span class="page-ellipsis">…</span>
                {/if}
                <button class="page-btn" on:click={() => goToPage(totalPages)}>{totalPages}</button>
              {/if}
            </div>

            <button
              class="page-btn nav-step"
              disabled={currentPage === totalPages}
              on:click={() => goToPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .leaderboard-hub {
    min-height: 100vh;
    background: #030304;
    color: #ffffff;
    font-family: 'Barlow Condensed', 'Rajdhani', sans-serif;
    padding-bottom: 80px;
    box-sizing: border-box;
  }

  /* Hero Banner */
  .lb-hero {
    position: relative;
    padding: 48px 24px 32px;
    background: radial-gradient(circle at 50% 0%, rgba(250, 68, 84, 0.12) 0%, rgba(3, 3, 4, 0.95) 70%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .lb-hero-bg {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 215, 0, 0.04) 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none;
  }

  .lb-hero-content {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
  }

  .lb-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(250, 68, 84, 0.1);
    border: 1px solid rgba(250, 68, 84, 0.3);
    padding: 5px 14px;
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: var(--accent, #fa4454);
    text-transform: uppercase;
    font-weight: 700;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent, #fa4454);
    box-shadow: 0 0 8px var(--accent, #fa4454);
    animation: pulseDot 1.5s infinite;
  }

  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.3); }
  }

  .lb-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: clamp(36px, 6vw, 54px);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
    line-height: 1;
    background: linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  }

  .lb-subtitle {
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    color: #a1a1aa;
    max-width: 640px;
    margin: 0 0 10px;
    line-height: 1.5;
  }

  /* Region Selector Tabs */
  .region-tabs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    background: rgba(14, 14, 18, 0.9);
    padding: 6px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    max-width: 100%;
  }

  .region-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid transparent;
    color: #a1a1aa;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .region-tab:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .region-tab.active {
    background: linear-gradient(135deg, rgba(250, 68, 84, 0.2), rgba(250, 68, 84, 0.05));
    border-color: rgba(250, 68, 84, 0.5);
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(250, 68, 84, 0.25);
  }

  .region-flag {
    font-size: 16px;
  }

  .region-full {
    display: none;
    font-size: 12px;
    color: #71717a;
    margin-left: 2px;
  }

  @media (min-width: 768px) {
    .region-full {
      display: inline;
    }
  }

  /* Quick Metrics Strip */
  .lb-stats-strip {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 10px;
  }

  .stat-pill {
    background: rgba(18, 18, 22, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 6px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-pill-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #71717a;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .stat-pill-val {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: #ffffff;
  }

  .stat-pill-val.accent { color: var(--accent, #fa4454); }
  .stat-pill-val.gold { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
  .stat-pill-val.dim { color: #a1a1aa; }

  .sync-pill {
    gap: 10px;
  }

  .refresh-btn {
    background: none;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    transition: color 0.15s, transform 0.2s;
  }

  .refresh-btn:hover {
    color: var(--accent, #fa4454);
    transform: scale(1.1);
  }

  .refresh-btn.spin svg {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Podium Showcase */
  .podium-section {
    max-width: 1200px;
    margin: 32px auto 20px;
    padding: 0 20px;
  }

  .section-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .section-tag-line {
    flex: 1;
    max-width: 120px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
  }

  .section-tag-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 14px;
    letter-spacing: 2px;
    color: #ffd700;
    text-transform: uppercase;
  }

  .podium-grid {
    display: grid;
    grid-template-columns: 1fr 1.15fr 1fr;
    gap: 20px;
    align-items: flex-end;
  }

  @media (max-width: 860px) {
    .podium-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .podium-card {
    position: relative;
    background: rgba(14, 14, 18, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    overflow: hidden;
    transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  }

  .podium-card:hover {
    transform: translateY(-4px);
  }

  .podium-card-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 110px;
    background-size: cover;
    background-position: center;
    opacity: 0.18;
    mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
    pointer-events: none;
  }

  .podium-card.champion {
    background: linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, rgba(14, 14, 18, 0.98) 100%);
    border: 1px solid rgba(255, 215, 0, 0.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.12);
    padding: 32px 24px;
    z-index: 2;
  }

  .crown-icon {
    font-size: 28px;
    margin-bottom: 2px;
    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.6));
    animation: floatCrown 3s ease-in-out infinite;
  }

  @keyframes floatCrown {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .podium-rank-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 16px;
    padding: 3px 10px;
    border-radius: 6px;
    letter-spacing: 1px;
  }

  .rank-1-badge { background: #ffd700; color: #070709; box-shadow: 0 0 12px rgba(255, 215, 0, 0.5); }
  .rank-2-badge { background: #c0c0c0; color: #070709; }
  .rank-3-badge { background: #cd7f32; color: #070709; }

  .podium-avatar-wrap {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: #18181c;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  }

  .champion-avatar {
    width: 84px;
    height: 84px;
    border-color: #ffd700;
    box-shadow: 0 0 24px rgba(255, 215, 0, 0.35);
  }

  .podium-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .podium-avatar-fallback {
    font-size: 28px;
  }

  .podium-name-wrap {
    margin-bottom: 6px;
  }

  .podium-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
  }

  .champion-name {
    font-size: 24px;
    color: #ffffff;
    text-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  }

  .podium-tag {
    font-size: 14px;
    color: #71717a;
    font-weight: 600;
  }

  .podium-tier-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    color: #e4e4e7;
    margin-bottom: 14px;
  }

  .radiant-pill {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
  }

  .podium-tier-icon {
    width: 18px;
    height: 18px;
  }

  .podium-metrics {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 14px;
  }

  .podium-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .podium-stat-num {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 20px;
    line-height: 1;
  }

  .podium-stat-num.gold { color: #ffd700; }
  .podium-stat-num.gold.glow { text-shadow: 0 0 12px rgba(255, 215, 0, 0.4); font-size: 24px; }
  .podium-stat-num.win { color: var(--win, #3ecf8e); }

  .podium-stat-lbl {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: #71717a;
    letter-spacing: 1px;
    margin-top: 2px;
  }

  .podium-stat-div {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.08);
  }

  .podium-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s;
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }

  .podium-cta:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: #ffffff;
  }

  .champion-cta {
    background: linear-gradient(135deg, #ffd700 0%, #e5a500 100%);
    color: #070709;
    border: none;
    font-weight: 800;
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
  }

  .champion-cta:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
    background: #ffe033;
    color: #000;
  }

  /* Main Table & Controls */
  .lb-main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .lb-toolbar {
    background: rgba(14, 14, 18, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 12px;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 260px;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    color: #71717a;
    display: flex;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 38px 10px 40px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    border-color: var(--accent, #fa4454);
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.25);
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #71717a;
    cursor: pointer;
    font-size: 12px;
    padding: 4px;
  }

  .clear-btn:hover {
    color: #ffffff;
  }

  .tier-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tier-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #a1a1aa;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .tier-pill:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .tier-pill.active {
    background: rgba(255, 215, 0, 0.12);
    border-color: #ffd700;
    color: #ffd700;
  }

  .tier-pill-icon {
    width: 14px;
    height: 14px;
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .control-group label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #71717a;
    text-transform: uppercase;
  }

  .control-select {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
  }

  .filter-status-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #71717a;
    margin-bottom: 12px;
    padding: 0 4px;
  }

  .filter-status-strip strong {
    color: #ffffff;
  }

  .active-tag {
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 4px;
    color: var(--accent, #fa4454);
  }

  /* Table Card */
  .table-card {
    background: rgba(14, 14, 18, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  }

  .table-responsive {
    width: 100%;
    overflow-x: auto;
  }

  .lb-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .lb-table th {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #71717a;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }

  .lb-table td {
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    vertical-align: middle;
    font-size: 14px;
  }

  .lb-row {
    transition: background 0.15s;
  }

  .lb-row:hover {
    background: rgba(255, 255, 255, 0.025);
  }

  .lb-row.top-3 {
    background: rgba(255, 215, 0, 0.02);
  }

  .th-rank { width: 80px; }
  .th-tier { width: 170px; }
  .th-rr { width: 150px; }
  .th-wins { width: 100px; }
  .th-action { width: 110px; }

  .text-right { text-align: right !important; }
  .text-center { text-align: center !important; }

  /* Rank Badges */
  .rank-badge-wrap {
    display: flex;
    align-items: center;
  }

  .medal {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 14px;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .gold-medal { background: rgba(255, 215, 0, 0.15); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.4); }
  .silver-medal { background: rgba(192, 192, 192, 0.15); color: #e4e4e7; border: 1px solid rgba(192, 192, 192, 0.4); }
  .bronze-medal { background: rgba(205, 127, 50, 0.15); color: #f59e0b; border: 1px solid rgba(205, 127, 50, 0.4); }

  .rank-num {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    color: #71717a;
  }

  .rank-num.top-ten {
    color: #ffd700;
    font-weight: 800;
  }

  /* Player Column */
  .player-flex {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .player-avatar-wrap {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    overflow: hidden;
    background: #18181c;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .player-avatar-fallback {
    font-size: 16px;
  }

  .player-details {
    display: flex;
    flex-direction: column;
  }

  .player-link {
    text-decoration: none;
    color: inherit;
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    transition: color 0.15s;
  }

  .player-link:hover .player-name {
    color: var(--accent, #fa4454);
  }

  .player-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #ffffff;
  }

  .player-name.anon {
    color: #71717a;
    font-style: italic;
  }

  .player-tag {
    font-family: 'Exo 2', sans-serif;
    font-size: 12px;
    color: #71717a;
    font-weight: 600;
  }

  /* Tier Column */
  .tier-flex {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tier-icon-small {
    width: 22px;
    height: 22px;
  }

  .tier-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #d4d4d8;
  }

  .tier-name.radiant-text {
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  /* RR Column */
  .rr-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .rr-text {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 15px;
    color: #ffffff;
  }

  .rr-unit {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--accent, #fa4454);
    font-weight: 700;
  }

  .rr-bar-mini {
    width: 80px;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .rr-bar-mini-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent, #fa4454), #ffd700);
    border-radius: 2px;
  }

  /* Wins Column */
  .wins-container {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
  }

  .wins-count {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    font-size: 15px;
    color: var(--win, #3ecf8e);
  }

  .wins-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #71717a;
  }

  /* Inspect Button */
  .table-inspect-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(250, 68, 84, 0.08);
    border: 1px solid rgba(250, 68, 84, 0.25);
    color: var(--accent, #fa4454);
    text-decoration: none;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .table-inspect-btn:hover {
    background: var(--accent, #fa4454);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(250, 68, 84, 0.3);
  }

  .anon-lock {
    color: #52525b;
    font-size: 13px;
  }

  /* Pagination Bar */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-wrap: wrap;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #a1a1aa;
    font-family: 'Rajdhani', sans-serif;
    font-size: 13px;
    font-weight: 700;
    min-width: 34px;
    height: 34px;
    padding: 0 8px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .page-btn.active {
    background: var(--accent, #fa4454);
    border-color: var(--accent, #fa4454);
    color: #ffffff;
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.4);
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-btn.nav-step {
    padding: 0 14px;
    font-family: 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .page-ellipsis {
    color: #71717a;
    padding: 0 4px;
  }

  /* Status States */
  .loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    padding: 40px 20px;
    background: rgba(14, 14, 18, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    text-align: center;
    gap: 14px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(250, 68, 84, 0.15);
    border-top-color: var(--accent, #fa4454);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    color: #a1a1aa;
  }

  .error-icon, .empty-icon {
    font-size: 36px;
  }

  .error-msg {
    color: var(--loss, #ff5757);
    font-size: 14px;
    max-width: 460px;
    margin: 0;
  }

  .retry-btn, .reset-filter-btn {
    background: var(--accent, #fa4454);
    color: #ffffff;
    border: none;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .retry-btn:hover, .reset-filter-btn:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 16px rgba(250, 68, 84, 0.4);
  }

  @media (max-width: 680px) {
    .lb-hero {
      padding: 32px 16px 20px;
    }
    .lb-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .right-controls {
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .th-tier, .td-tier {
      display: none;
    }
    .lb-table td, .lb-table th {
      padding: 10px 12px;
    }
    .rr-bar-mini {
      display: none;
    }
  }
</style>

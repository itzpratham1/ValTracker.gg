<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  const API_BASE = import.meta.env.PUBLIC_API_URL || '';

  export let open = false;
  export let region = 'ap';
  export let onClose = () => {};

  let loading = false;
  let error = '';
  let players = [];
  let searchQuery = '';

  const REGIONS = [
    { value: 'ap', label: 'Asia Pacific (AP)' },
    { value: 'na', label: 'North America (NA)' },
    { value: 'eu', label: 'Europe (EU)' },
    { value: 'kr', label: 'Korea (KR)' }
  ];

  $: if (open) {
    fetchLeaderboard();
  }

  async function fetchLeaderboard() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`${API_BASE}/api/v1/leaderboard/${region}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard from API');
      const json = await res.json();
      if (json?.data) {
        players = json.data;
      } else {
        throw new Error('Leaderboard data format invalid');
      }
    } catch (e) {
      error = e.message || 'Unable to retrieve leaderboard records';
      players = [];
    } finally {
      loading = false;
    }
  }

  function handleRegionChange(e) {
    region = e.target.value;
    fetchLeaderboard();
  }

  $: filteredPlayers = players.filter(p => {
    if (!searchQuery) return true;
    const name = p.gameName || 'Secret Agent';
    const tag = p.tagLine || '';
    return `${name}#${tag}`.toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 100);
</script>

{#if open}
  <div class="modal-overlay" on:click={onClose} transition:fade={{ duration: 200 }}>
    <div
      class="modal-card"
      on:click|stopPropagation
      transition:fly={{ y: 20, duration: 350 }}
    >
      <div class="modal-header">
        <h3 class="modal-title">
          <span>🏆</span> Top 100 Leaderboard
        </h3>
        <button class="modal-close-btn" on:click={onClose}>✕</button>
      </div>

      <div class="modal-filters">
        <div class="filter-group">
          <label for="lb-region">Region</label>
          <select id="lb-region" class="lb-select" value={region} on:change={handleRegionChange}>
            {#each REGIONS as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>
        <div class="filter-group flex-grow">
          <label for="lb-search">Search Player</label>
          <input
            id="lb-search"
            type="text"
            placeholder="Search by Riot ID..."
            class="lb-input"
            bind:value={searchQuery}
          />
        </div>
      </div>

      <div class="modal-body">
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <div class="loading-text">COMMUNICATION WITH VALORANT MAIN SYSTEM...</div>
          </div>
        {:else if error}
          <div class="error-state">
            <span class="error-icon">⚠️</span>
            <p class="error-msg">{error}</p>
            <button class="retry-btn" on:click={fetchLeaderboard}>Retry Fetch</button>
          </div>
        {:else}
          <div class="table-wrap">
            <table class="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player Name</th>
                  <th class="text-right">Rank Rating</th>
                  <th class="text-right">Wins</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredPlayers as p}
                  {@const isAnon = p.IsAnonymized || !p.gameName}
                  <tr>
                    <td class="rank-col">#{p.leaderboardRank}</td>
                    <td class="name-col">
                      {#if isAnon}
                        <span class="anon-name">Secret Agent</span>
                      {:else}
                        <span class="player-name">{p.gameName}</span>
                        <span class="player-tag">#{p.tagLine}</span>
                      {/if}
                    </td>
                    <td class="rr-col text-right">{p.rankedRating} RR</td>
                    <td class="wins-col text-right">{p.numberOfWins} W</td>
                  </tr>
                {/each}
              </tbody>
            </table>

            {#if filteredPlayers.length === 0}
              <div class="empty-state">No players found matching your search.</div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        Click outside or press ✕ to close · Data updates dynamically in real-time
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6, 6, 8, 0.85);
    backdrop-filter: blur(16px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-card {
    background: linear-gradient(135deg, #111115 0%, #070709 100%);
    border: 1px solid rgba(255, 215, 0, 0.25);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
    border-radius: 16px;
    width: 600px;
    max-width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.12);
  }

  .modal-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 24px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
    transition: color 0.15s;
    padding: 4px;
  }

  .modal-close-btn:hover {
    color: #ffd700;
  }

  .modal-filters {
    display: flex;
    gap: 16px;
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid var(--border);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .flex-grow {
    flex-grow: 1;
  }

  .filter-group label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
  }

  .lb-select, .lb-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: #fff;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .lb-select:focus, .lb-input:focus {
    border-color: #ffd700;
  }

  .lb-select {
    cursor: pointer;
    min-width: 160px;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 24px;
    min-height: 250px;
  }

  .loading-state, .error-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 12px;
    color: var(--muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 215, 0, 0.1);
    border-top-color: #ffd700;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .error-icon {
    font-size: 32px;
  }

  .error-msg {
    font-family: 'Exo 2', sans-serif;
    font-size: 13px;
    color: var(--loss);
    text-align: center;
    margin: 0;
  }

  .retry-btn {
    background: #ffd700;
    color: #0b0b0d;
    border: none;
    border-radius: 6px;
    padding: 8px 20px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .retry-btn:active {
    transform: scale(0.97);
  }

  .table-wrap {
    width: 100%;
  }

  .lb-table {
    width: 100%;
    border-collapse: collapse;
  }

  .lb-table th {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }

  .lb-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    font-size: 13px;
    vertical-align: middle;
  }

  .lb-table tr:hover td {
    background: rgba(255, 255, 255, 0.015);
  }

  .text-right {
    text-align: right !important;
  }

  .rank-col {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 16px;
    color: #ffd700;
    width: 70px;
  }

  .name-col {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 700;
  }

  .player-name {
    color: #fff;
  }

  .player-tag {
    color: var(--muted);
    font-weight: 500;
    margin-left: 2px;
  }

  .anon-name {
    color: var(--muted2);
    font-style: italic;
    font-weight: 500;
  }

  .rr-col {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--accent);
    width: 100px;
  }

  .wins-col {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--win);
    width: 80px;
  }

  .modal-footer {
    padding: 14px 24px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid var(--border);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    text-align: center;
  }

  @media (max-width: 480px) {
    .modal-filters {
      flex-direction: column;
      gap: 12px;
      padding: 12px 16px;
    }
    .modal-body {
      padding: 8px 16px;
    }
    .lb-select {
      min-width: 100%;
    }
  }
</style>

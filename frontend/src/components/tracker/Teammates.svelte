<script>
  import { createEventDispatcher } from 'svelte';
  import { getAgentIconUrl } from '../../lib/assets';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';

  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let sortKey = 'matchesCount'; // 'matchesCount', 'winRate', 'kd'
  let sortAsc = false;

  $: teammateStats = (() => {
    if (!matches || !matches.length || !playerName) return [];

    const teammates = {}; // key: name#tag
    const targetNameLower = playerName.toLowerCase().trim();
    const targetTagLower = playerTag.toLowerCase().trim();

    matches.forEach(m => {
      const allPlayers = m.players?.all_players || m.players || [];
      if (!Array.isArray(allPlayers)) return;

      const me = allPlayers.find(p =>
        p.name?.toLowerCase().trim() === targetNameLower &&
        p.tag?.toLowerCase().trim() === targetTagLower
      );

      if (!me || !me.party_id) return;

      // Determine match result for me
      const myTeam = (me.team || '').toLowerCase();
      const redTeamWon = m.teams?.red?.has_won || m.teams?.red?.hasWon;
      const blueTeamWon = m.teams?.blue?.has_won || m.teams?.blue?.hasWon;
      let won = false;
      if (myTeam === 'red') won = redTeamWon;
      else if (myTeam === 'blue') won = blueTeamWon;
      else {
        // fallback to rounds won comparison
        const myRounds = m.teams?.[myTeam]?.rounds_won || m.teams?.[myTeam]?.roundsWon || 0;
        const oppTeam = myTeam === 'red' ? 'blue' : 'red';
        const oppRounds = m.teams?.[oppTeam]?.rounds_won || m.teams?.[oppTeam]?.roundsWon || 0;
        won = myRounds > oppRounds;
      }

      // Find teammates in the same party
      allPlayers.forEach(p => {
        const pNameLower = p.name?.toLowerCase().trim();
        const pTagLower = p.tag?.toLowerCase().trim();
        if (p.party_id === me.party_id && (pNameLower !== targetNameLower || pTagLower !== targetTagLower)) {
          const key = `${p.name}#${p.tag}`;
          if (!teammates[key]) {
            teammates[key] = {
              name: p.name,
              tag: p.tag,
              puuid: p.puuid,
              matchesCount: 0,
              wins: 0,
              losses: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
              score: 0,
              agents: {},
              recentResults: []
            };
          }
          const t = teammates[key];
          t.matchesCount += 1;
          if (won) {
            t.wins += 1;
            t.recentResults.push(true);
          } else {
            t.losses += 1;
            t.recentResults.push(false);
          }

          // Accumulate teammate stats in matches played with you
          const pk = p.stats?.kills ?? 0;
          const pd = p.stats?.deaths ?? 0;
          const pa = p.stats?.assists ?? 0;
          const ps = p.stats?.score ?? 0;
          t.kills += pk;
          t.deaths += pd;
          t.assists += pa;
          t.score += ps;

          const agent = p.character || p.agent?.name || 'Unknown';
          t.agents[agent] = (t.agents[agent] || 0) + 1;
        }
      });
    });

    // Post-process stats and format
    const list = Object.values(teammates).map(t => {
      const wr = t.matchesCount ? Math.round((t.wins / t.matchesCount) * 100) : 0;
      const avgKd = t.deaths ? (t.kills / t.deaths).toFixed(2) : t.kills.toFixed(2);

      // Favorite agent with you
      let favAgent = 'Unknown';
      let maxCount = -1;
      Object.keys(t.agents).forEach(a => {
        if (t.agents[a] > maxCount) {
          maxCount = t.agents[a];
          favAgent = a;
        }
      });

      return {
        ...t,
        winRate: wr,
        kd: avgKd,
        favoriteAgent: favAgent
      };
    });

    return list;
  })();

  // Filter and sort teammateStats
  $: filteredTeammates = (() => {
    let result = [...teammateStats];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.tag.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Convert to number for proper sorting
      if (sortKey === 'kd') {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  })();

  // Aggregate highlights
  $: totalTeammates = teammateStats.length;
  
  // Best teammate has at least 2 matches and highest win rate
  $: bestTeammate = (() => {
    const candidates = teammateStats.filter(t => t.matchesCount >= 2);
    if (!candidates.length) return null;
    return candidates.reduce((best, current) => {
      if (current.winRate !== best.winRate) return current.winRate > best.winRate ? current : best;
      return current.matchesCount > best.matchesCount ? current : best;
    }, candidates[0]);
  })();

  // Most frequent teammate
  $: mostFrequentTeammate = (() => {
    if (!teammateStats.length) return null;
    return teammateStats.reduce((frequent, current) => {
      if (current.matchesCount !== frequent.matchesCount) return current.matchesCount > frequent.matchesCount ? current : frequent;
      return current.winRate > frequent.winRate ? current : frequent;
    }, teammateStats[0]);
  })();

  function handleSort(key) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = false;
    }
  }

  function handleTeammateClick(name, tag) {
    dispatch('viewProfile', { name, tag });
  }
</script>

<div class="teammates-layout span-12">
  <div class="teammates-grid">
    <!-- Highlight 1: Best Teammate -->
    <div class="card teammate-highlight-card bento-glow">
      <div class="card-accent-line highlight-accent"></div>
      <div class="card-label">BEST DUO PARTNER</div>
      {#if bestTeammate}
        <div class="highlight-content">
          <div class="teammate-avatar-wrap">
            {#if getAgentIconUrl(bestTeammate.favoriteAgent)}
              <img src={getAgentIconUrl(bestTeammate.favoriteAgent)} alt={bestTeammate.favoriteAgent} class="highlight-agent-icon">
            {:else}
              <div class="placeholder-avatar">👥</div>
            {/if}
          </div>
          <div class="highlight-details">
            <div class="highlight-name" on:click={() => handleTeammateClick(bestTeammate.name, bestTeammate.tag)}>
              {bestTeammate.name}<span class="highlight-tag">#{bestTeammate.tag}</span>
            </div>
            <div class="highlight-stats">
              <span class="highlight-winrate">{bestTeammate.winRate}% WR</span>
              <span class="highlight-record">({bestTeammate.wins}W - {bestTeammate.losses}L)</span>
            </div>
            <div class="highlight-subtext">Favorite Agent: {bestTeammate.favoriteAgent}</div>
          </div>
        </div>
      {:else}
        <div class="highlight-empty">
          Play 2+ matches in a party to unlock Best Duo insights
        </div>
      {/if}
    </div>

    <!-- Highlight 2: Most Frequent Teammate -->
    <div class="card teammate-highlight-card">
      <div class="card-accent-line"></div>
      <div class="card-label">MOST PLAYED WITH</div>
      {#if mostFrequentTeammate}
        <div class="highlight-content">
          <div class="teammate-avatar-wrap">
            {#if getAgentIconUrl(mostFrequentTeammate.favoriteAgent)}
              <img src={getAgentIconUrl(mostFrequentTeammate.favoriteAgent)} alt={mostFrequentTeammate.favoriteAgent} class="highlight-agent-icon">
            {:else}
              <div class="placeholder-avatar">👥</div>
            {/if}
          </div>
          <div class="highlight-details">
            <div class="highlight-name" on:click={() => handleTeammateClick(mostFrequentTeammate.name, mostFrequentTeammate.tag)}>
              {mostFrequentTeammate.name}<span class="highlight-tag">#{mostFrequentTeammate.tag}</span>
            </div>
            <div class="highlight-stats">
              <span class="highlight-matches">{mostFrequentTeammate.matchesCount} Matches</span>
              <span class="highlight-winrate">{mostFrequentTeammate.winRate}% WR</span>
            </div>
            <div class="highlight-subtext">Favorite Agent: {mostFrequentTeammate.favoriteAgent}</div>
          </div>
        </div>
      {:else}
        <div class="highlight-empty">
          No teammate sessions detected in recent matches
        </div>
      {/if}
    </div>

    <!-- Highlight 3: Unique Teammates Count -->
    <div class="card teammate-highlight-card">
      <div class="card-accent-line text-accent"></div>
      <div class="card-label">PARTY QUEUE STATS</div>
      <div class="highlight-numeric-wrap">
        <div class="highlight-big-number">{totalTeammates}</div>
        <div class="highlight-sublabel">Unique Party Teammates</div>
      </div>
    </div>
  </div>

  <!-- Teammates Table Card -->
  <div class="card teammates-table-card">
    <div class="table-header-row">
      <div class="table-title-wrap">
        <h3>Teammates Directory</h3>
        <p class="subtitle">Detailed breakdown of games played with party members in this Act</p>
      </div>
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search teammates..." bind:value={searchQuery} class="teammate-search">
      </div>
    </div>

    <div class="table-responsive">
      <table class="teammates-table">
        <thead>
          <tr>
            <th class="align-left">Teammate</th>
            <th class="sortable" on:click={() => handleSort('matchesCount')}>
              Games {sortKey === 'matchesCount' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th class="sortable" on:click={() => handleSort('winRate')}>
              Win Rate {sortKey === 'winRate' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th class="sortable" on:click={() => handleSort('kd')}>
              K/D Ratio {sortKey === 'kd' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th>Favorite Agent</th>
            <th>Recent Matches</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#if filteredTeammates.length > 0}
            {#each filteredTeammates as t}
              <tr class="teammate-row">
                <td class="align-left">
                  <div class="teammate-identity" on:click={() => handleTeammateClick(t.name, t.tag)}>
                    {#if getAgentIconUrl(t.favoriteAgent)}
                      <img src={getAgentIconUrl(t.favoriteAgent)} alt={t.favoriteAgent} class="table-agent-icon">
                    {:else}
                      <div class="table-placeholder-icon">👤</div>
                    {/if}
                    <div class="name-tag-cell">
                      <span class="t-name">{t.name}</span>
                      <span class="t-tag">#{t.tag}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="stat-highlight">{t.matchesCount}</span>
                  <span class="record-sub text-muted">({t.wins}W - {t.losses}L)</span>
                </td>
                <td>
                  <div class="winrate-cell-wrap">
                    <span class="stat-highlight {t.winRate >= 55 ? 'good' : t.winRate < 45 ? 'bad' : 'normal'}">
                      {t.winRate}%
                    </span>
                    <div class="mini-bar-track">
                      <div class="mini-bar-fill {t.winRate >= 55 ? 'good' : t.winRate < 45 ? 'bad' : 'normal'}" style="width: {t.winRate}%"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="stat-highlight {parseFloat(t.kd) >= 1.1 ? 'good' : parseFloat(t.kd) < 0.9 ? 'bad' : 'normal'}">
                    {t.kd}
                  </span>
                </td>
                <td>
                  <div class="fav-agent-cell">
                    {#if getAgentIconUrl(t.favoriteAgent)}
                      <img src={getAgentIconUrl(t.favoriteAgent)} alt={t.favoriteAgent} class="agent-tiny-icon">
                    {/if}
                    <span class="agent-name-txt">{t.favoriteAgent}</span>
                  </div>
                </td>
                <td>
                  <div class="recent-dots-wrap">
                    {#each t.recentResults.slice(-5) as res}
                      <span class="dot-badge {res ? 'win' : 'loss'}" title={res ? 'Win' : 'Loss'}>
                        {res ? 'W' : 'L'}
                      </span>
                    {/each}
                  </div>
                </td>
                <td>
                  <button class="view-profile-btn" on:click={() => handleTeammateClick(t.name, t.tag)}>
                    View Profile
                  </button>
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="7" class="empty-table-msg">
                No teammates found matching "{searchQuery}"
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

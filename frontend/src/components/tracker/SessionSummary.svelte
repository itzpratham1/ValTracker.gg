<script>
  export let open = false;
  export let sessionMatches = [];
  export let startRR = 0;
  export let currentRR = 0;
  export let onClose = () => {};

  function normalizeName(str) { return (str || '').toLowerCase().replace(/\s+/g, ''); }

  function findMe(match) {
    if (!match) return null;
    const all = Array.isArray(match.players) ? match.players : (match.players?.all_players || match.players || []);
    return (Array.isArray(all) ? all : []).find(
      p => normalizeName(p.name) === normalizeName(window._playerName || '') &&
           normalizeName(p.tag) === normalizeName(window._playerTag || '')
    ) || null;
  }

  $: summary = (() => {
    if (!sessionMatches.length) return null;
    let wins = 0, losses = 0, totalKills = 0, totalDeaths = 0;
    const agents = {};
    sessionMatches.forEach(m => {
      const me = findMe(m);
      if (!me) return;
      const myTeamId = (me.team || '').toLowerCase();
      const myTeam = m.teams?.[myTeamId];
      const oppId = myTeamId === 'red' ? 'blue' : 'red';
      let won = false;
      if (myTeam?.has_won === true) won = true;
      else if (myTeam?.rounds_won != null) won = myTeam.rounds_won > (m.teams?.[oppId]?.rounds_won || 0);
      if (won) wins++; else losses++;
      totalKills += me.stats?.kills || 0;
      totalDeaths += me.stats?.deaths || 0;
      const ag = me.character || 'Unknown';
      agents[ag] = (agents[ag] || 0) + 1;
    });
    const bestAgent = Object.keys(agents).sort((a,b) => agents[b] - agents[a])[0] || 'N/A';
    const kd = totalDeaths > 0 ? (totalKills/totalDeaths).toFixed(2) : totalKills;
    const rrChange = startRR !== null ? (currentRR - startRR) : 'N/A';
    return { wins, losses, kd, bestAgent, rrChange };
  })();
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="session-overlay" on:click={onClose}>
    <div class="session-modal" on:click|stopPropagation>
      <button class="session-close" on:click={onClose}>✕</button>
      <div class="session-title">📊 Session Summary</div>
      {#if summary}
        <div class="session-record">
          <div>
            <div class="session-record-label">RECORD</div>
            <div class="session-record-val">
              <span style="color:var(--win)">{summary.wins}W</span> - <span style="color:var(--loss)">{summary.losses}L</span>
            </div>
          </div>
          <div style="text-align:right">
            <div class="session-record-label">RR CHANGE</div>
            <div class="session-record-val" style="color:{summary.rrChange > 0 ? 'var(--win)' : summary.rrChange < 0 ? 'var(--loss)' : 'var(--text)'}">
              {summary.rrChange > 0 ? '+' + summary.rrChange : summary.rrChange}
            </div>
          </div>
        </div>
        <div class="session-grid">
          <div class="session-stat">
            <div class="session-stat-label">BEST AGENT</div>
            <div class="session-stat-val accent">{summary.bestAgent}</div>
          </div>
          <div class="session-stat">
            <div class="session-stat-label">OVERALL K/D</div>
            <div class="session-stat-val">{summary.kd}</div>
          </div>
        </div>
      {:else}
        <div class="session-empty">
          <div style="font-size:42px; filter:drop-shadow(0 0 12px var(--accent));">🎮</div>
          <div class="session-empty-title">No session matches recorded</div>
          <p class="session-empty-desc">
            You haven't played any new matches since starting this session. Play a match, click "Fetch Stats" to load it, then view your summary!
          </p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .session-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5000;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .session-modal {
    background: #0a0a0c;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    padding: 24px;
    position: relative;
    animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  .session-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--muted);
    font-size: 14px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .session-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .session-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }
  .session-record {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface2);
    padding: 16px;
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }
  .session-record-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 1px;
  }
  .session-record-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 28px;
  }
  .session-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .session-stat {
    background: var(--surface2);
    padding: 12px;
    border-radius: var(--radius-sm);
    text-align: center;
  }
  .session-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
  }
  .session-stat-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 20px;
    margin-top: 4px;
  }
  .session-stat-val.accent { color: var(--accent); }
  .session-empty {
    text-align: center;
    padding: 30px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .session-empty-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .session-empty-desc {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    max-width: 320px;
    line-height: 1.6;
    margin: 0;
  }
</style>

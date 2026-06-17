<script>
  import { AGENT_ROLES, AGENT_UUIDS } from '../../lib/constants';

  export let agentMap = {};
  export let allMatches = [];

  $: sorted = Object.entries(agentMap)
    .sort((a, b) => b[1].matches - a[1].matches)
    .slice(0, 6);

  function getAgentIcon(name) {
    if (!name) return null;
    let clean = name;
    if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') clean = 'KAY/O';
    const u = AGENT_UUIDS[clean] || AGENT_UUIDS[name];
    if (u) return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
    return null;
  }

  function getRole(name) {
    if (!name) return 'duelist';
    let clean = name;
    if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') clean = 'KAY/O';
    return AGENT_ROLES[clean.toLowerCase().replace(/\//g, '')] || 'duelist';
  }

  function getAgentTrend(agentName, matches) {
    const agentMatches = matches.filter(m => {
      const me = m.players?.all_players?.find(p =>
        (p.character || '').toLowerCase() === agentName.toLowerCase()
      );
      return !!me;
    }).slice(0, 5);
    return agentMatches.map(m => {
      const me = m.players?.all_players?.find(p =>
        (p.character || '').toLowerCase() === agentName.toLowerCase()
      );
      if (!me) return 'l';
      const myTeamId = (me.team || '').toLowerCase();
      return m.teams?.[myTeamId]?.has_won ? 'w' : 'l';
    });
  }

  function getWinRate(s) {
    return Math.round((s.wins / s.matches) * 100);
  }

  function getKD(s) {
    return s.deaths ? (s.kills / s.deaths).toFixed(2) : s.kills.toFixed(2);
  }

  function getACS(s) {
    return Math.round(s.score / s.matches / 100);
  }
</script>

{#if sorted.length === 0}
  <div class="placeholder-card">
    <div class="placeholder-txt">No agent data available for this mode</div>
  </div>
{:else}
  <div class="agents-grid">
    {#each sorted as [name, s], i}
      {@const wr = getWinRate(s)}
      {@const wrCls = wr >= 55 ? 'good' : wr >= 45 ? 'mid' : 'bad'}
      {@const role = getRole(name)}
      {@const img = getAgentIcon(name)}
      {@const trend = getAgentTrend(name, allMatches)}
      <div class="agent-bento" style="animation-delay:{i * 60}ms">
        <div class="agent-wr-chip {wrCls}">{wr}%</div>
        {#if img}
          <img class="agent-portrait" src={img} alt={name}>
        {:else}
          <div class="agent-portrait-fallback">{name[0] || '?'}</div>
        {/if}
        <div class="agent-info">
          <div class="agent-name">{name}</div>
          <div class="agent-role-chip {role}">{role}</div>
          <div class="agent-stats-row">
            <div class="asr-item"><div class="asv">{s.matches}</div><div class="asl">Games</div></div>
            <div class="asr-item"><div class="asv">{getKD(s)}</div><div class="asl">K/D</div></div>
            <div class="asr-item"><div class="asv">{getACS(s)}</div><div class="asl">ACS</div></div>
          </div>
          {#if trend.length}
            <div class="agent-trend">
              {#each trend as t}
                <div class="agent-trend-dot {t}"></div>
              {/each}
              <span class="agent-trend-label">Last {trend.length}</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }

  .agent-bento {
    background: rgba(18, 18, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    transition: all 0.3s ease;
  }

  .agent-bento:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translate3d(0, -4px, 0);
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .agent-wr-chip {
    position: absolute;
    top: 12px;
    right: 12px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
    z-index: 1;
  }
  .agent-wr-chip.good { background: rgba(16, 185, 129, 0.15); color: var(--win); border: 1px solid rgba(16, 185, 129, 0.3); }
  .agent-wr-chip.mid { background: rgba(250, 68, 84, 0.1); color: var(--accent); border: 1px solid rgba(250, 68, 84, 0.25); }
  .agent-wr-chip.bad { background: rgba(244, 63, 94, 0.15); color: var(--loss); border: 1px solid rgba(244, 63, 94, 0.3); }

  .agent-portrait {
    width: 100%;
    height: 140px;
    object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
    transition: all 0.3s ease;
  }

  .agent-bento:hover .agent-portrait {
    filter: saturate(1.1) contrast(1.05);
    transform: scale(1.02);
  }

  .agent-portrait-fallback {
    width: 100%;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 48px;
    color: var(--muted2);
    background: var(--surface2);
    border-radius: 8px;
  }

  .agent-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .agent-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--text);
    letter-spacing: 0.5px;
  }

  .agent-role-chip {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: capitalize;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
  }
  .agent-role-chip.duelist { background: rgba(255, 123, 123, 0.12); color: #ff7b7b; }
  .agent-role-chip.sentinel { background: rgba(122, 184, 255, 0.12); color: #7ab8ff; }
  .agent-role-chip.initiator { background: rgba(245, 166, 35, 0.12); color: #f5a623; }
  .agent-role-chip.controller { background: rgba(16, 185, 129, 0.12); color: var(--win); }

  .agent-stats-row {
    display: flex;
    gap: 12px;
    margin-top: 4px;
  }

  .asr-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .asv {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--text);
  }

  .asl {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted2);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .agent-trend {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 6px;
  }

  .agent-trend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .agent-trend-dot.w { background: var(--win); }
  .agent-trend-dot.l { background: var(--loss); }

  .agent-trend-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted2);
    margin-left: 4px;
  }

  .placeholder-card {
    background: rgba(18, 18, 24, 0.92);
    border: 1px dashed rgba(255, 255, 255, 0.09);
    border-radius: 12px;
    padding: 20px;
  }

  .placeholder-txt {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted2);
    letter-spacing: 1px;
    text-align: center;
    padding: 30px;
  }

  @media (max-width: 600px) {
    .agents-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .agent-portrait, .agent-portrait-fallback {
      height: 110px;
    }
  }
</style>

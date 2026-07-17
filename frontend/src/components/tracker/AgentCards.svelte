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
    return Math.round(s.score / Math.max(1, s.rounds || (s.matches * 24)));
  }
</script>

{#if sorted.length === 0}
  <div class="card span-12 placeholder-card">
    <div class="placeholder-txt">No agent data available for this mode</div>
  </div>
{:else}
  <div style="display:contents;">
    {#each sorted as [name, s], i}
      {@const wr = getWinRate(s)}
      {@const wrCls = wr >= 55 ? 'good' : wr >= 45 ? 'mid' : 'bad'}
      {@const role = getRole(name)}
      {@const img = getAgentIcon(name)}
      {@const trend = getAgentTrend(name, allMatches)}
      <div class="agent-bento visible" style="animation-delay:{i * 60}ms">
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

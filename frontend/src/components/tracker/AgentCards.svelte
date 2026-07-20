<script>
  import { onMount } from 'svelte';
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

  // Each card component owns its own observer — guaranteed to fire AFTER
  // data-dependent elements are in the DOM
  let observer;
  function observeCards() {
    if (typeof IntersectionObserver === 'undefined') return;
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    document.querySelectorAll('.agent-bento.reveal-on-scroll').forEach(el => observer.observe(el));
  }

  onMount(() => {
    // Small tick to ensure Svelte has flushed the DOM
    setTimeout(observeCards, 60);
    return () => { if (observer) observer.disconnect(); };
  });

  // Re-observe when agentMap data changes (data loaded after mount)
  $: if (sorted.length > 0) {
    setTimeout(observeCards, 80);
  }
</script>

{#if sorted.length === 0}
  <div class="empty-state">
    <div class="empty-state-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="16" x2="12" y2="18"/>
      </svg>
    </div>
    <div class="empty-state-title">No Agent Data</div>
    <div class="empty-state-sub">
      No agent stats found for this mode and act filter.<br>
      Try switching to Competitive or a different act.
    </div>
  </div>
{:else}
  <div style="display:contents;">
    {#each sorted as [name, s], i}
      {@const wr = getWinRate(s)}
      {@const wrCls = wr >= 55 ? 'good' : wr >= 45 ? 'mid' : 'bad'}
      {@const role = getRole(name)}
      {@const img = getAgentIcon(name)}
      {@const trend = getAgentTrend(name, allMatches)}
      <div class="agent-bento reveal-on-scroll stagger-{i}">
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

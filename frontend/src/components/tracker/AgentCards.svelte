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
        {#if img}
          <img class="agent-portrait" src={img} alt={name} loading="lazy" decoding="async" width="160" height="160">
        {:else}
          <div class="agent-portrait-fallback">{name[0] || '?'}</div>
        {/if}
        <div class="agent-wr-chip" class:wr-good={wr >= 55} class:wr-mid={wr >= 45 && wr < 55} class:wr-bad={wr < 45}>{wr}%</div>
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
        <!-- SVG crown badge for best/most played agent -->
        {#if i === 0}
          <div class="agent-crown-badge" title="Most played agent">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 19h20v2H2v-2zm2-3l3-8 5 4 5-4 3 8H4zm8-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </svg>
            <span>BEST AGENT</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Conditional WR badge colors */
  .agent-wr-chip.wr-good {
    background: rgba(62,207,142,0.18) !important;
    border: 1px solid rgba(62,207,142,0.5) !important;
    color: #3ecf8e !important;
  }
  .agent-wr-chip.wr-mid {
    background: rgba(232,255,71,0.12) !important;
    border: 1px solid rgba(232,255,71,0.4) !important;
    color: #e8ff47 !important;
  }
  .agent-wr-chip.wr-bad {
    background: rgba(255,87,87,0.13) !important;
    border: 1px solid rgba(255,87,87,0.4) !important;
    color: #ff5757 !important;
  }

  /* SVG crown badge for top agent */
  .agent-crown-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(18, 18, 24, 0.88);
    border: 1px solid rgba(255, 215, 0, 0.6);
    color: #ffd700;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 0 10px rgba(255, 215, 0, 0.25);
    pointer-events: none;
    z-index: 10;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .agent-crown-badge svg {
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.7));
  }

  /* Make agent-bento position:relative for crown badge */
  :global(.agent-bento) {
    position: relative !important;
  }

  /* Ensure agent portrait hover glow fires */
  :global(.agent-bento:hover .agent-portrait) {
    filter: saturate(1.25) contrast(1.12) drop-shadow(0 0 18px rgba(250, 68, 84, 0.4)) !important;
    transform: scale(1.06) !important;
  }
</style>

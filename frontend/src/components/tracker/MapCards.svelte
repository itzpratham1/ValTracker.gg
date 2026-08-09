<script>
  import { onMount } from 'svelte';
  import { getAgentIconUrl, getMapImg } from '../../lib/assets';

  export let mapData = {};
  export let mmrHistory = {};
  export let allMatches = [];
  export let playerName = '';
  export let playerTag = '';

  $: maps = Object.entries(mapData).sort((a, b) => b[1].matches - a[1].matches);

  function getBestAgent(agents) {
    const best = Object.entries(agents)
      .filter(([, a]) => a.matches >= 1)
      .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0];
    if (!best) return { name: '—', wr: '' };
    return { name: best[0], wr: Math.round((best[1].wins / best[1].matches) * 100) };
  }

  function getTop3Agents(agents) {
    return Object.entries(agents)
      .filter(([, a]) => a.matches >= 1)
      .sort((a, b) => {
        const wrA = a[1].wins / a[1].matches;
        const wrB = b[1].wins / b[1].matches;
        return wrB - wrA || b[1].matches - a[1].matches;
      })
      .slice(0, 3)
      .map(([name, a]) => ({ name, wr: Math.round((a.wins / a.matches) * 100), matches: a.matches }));
  }

  function getMapRRDelta(mapName) {
    const mapMatches = allMatches.filter(m =>
      (m.metadata?.map || '').toLowerCase() === mapName.toLowerCase()
    );
    let total = 0, count = 0;
    mapMatches.forEach(m => {
      const matchId = m.metadata?.matchid || m.metadata?.match_id;
      if (mmrHistory[matchId] !== undefined) {
        total += mmrHistory[matchId];
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : null;
  }

  function wrLabel(wr) {
    if (wr >= 60) return 'Dominant';
    if (wr >= 55) return 'Strong';
    if (wr >= 45) return 'Neutral';
    if (wr >= 38) return 'Weak';
    return 'Avoid';
  }

  function wrCls(wr) {
    if (wr >= 55) return 'good';
    if (wr >= 45) return 'mid';
    return 'bad';
  }

  /** Smarter per-map insight line */
  function getMapInsight(name, m, top3, rrDelta) {
    const wr = Math.round((m.wins / m.matches) * 100);
    const kd = m.deaths ? (m.kills / m.deaths) : m.kills;

    if (rrDelta !== null && rrDelta <= -10 && wr < 45) {
      return { icon: 'warn', text: `Bleeding ${Math.abs(rrDelta)} RR avg on ${name} — consider dodging` };
    }
    if (rrDelta !== null && rrDelta >= 15) {
      return { icon: 'trophy', text: `High RR earner (+${rrDelta} avg) — queue ${name} more` };
    }
    if (wr >= 60 && top3[0]) {
      return { icon: 'fire', text: `Dominant here — keep playing ${top3[0].name}` };
    }
    if (wr < 45 && top3.length > 0) {
      const bestUnplayed = top3.find(a => a.matches <= 2);
      if (bestUnplayed) return { icon: 'tip', text: `Try ${bestUnplayed.name} — high WR in limited games` };
      return { icon: 'tip', text: `Stick to ${top3[0].name} on ${name} for best results` };
    }
    if (kd >= 1.5) {
      return { icon: 'target', text: `Great fragging (${kd.toFixed(2)} K/D) — convert more into wins` };
    }
    return { icon: 'chart', text: `${m.matches} game sample — keep grinding for cleaner data` };
  }

  $: sortedMaps = [...maps].sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches));
  $: strongestMap = sortedMaps[0];
  $: weakestMap = sortedMaps[sortedMaps.length - 1];
  $: strongestWR = strongestMap ? Math.round((strongestMap[1].wins / strongestMap[1].matches) * 100) : 0;
  $: weakestWR = weakestMap ? Math.round((weakestMap[1].wins / weakestMap[1].matches) * 100) : 0;
  $: weakestTop3 = weakestMap ? getTop3Agents(weakestMap[1].agents) : [];

  // Local observer — guaranteed to run after map card DOM exists
  let mapObserver;
  function observeMapCards() {
    if (typeof IntersectionObserver === 'undefined') return;
    if (mapObserver) mapObserver.disconnect();
    mapObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            mapObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
    );
    document.querySelectorAll('.map-card-bento.reveal-on-scroll').forEach(el => mapObserver.observe(el));
  }

  onMount(() => {
    setTimeout(observeMapCards, 60);
    return () => { if (mapObserver) mapObserver.disconnect(); };
  });

  // Re-observe when mapData arrives after initial mount
  $: if (maps.length > 0) {
    setTimeout(observeMapCards, 80);
  }
</script>

{#if maps.length === 0}
  <div class="empty-state">
    <div class="empty-state-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    </div>
    <div class="empty-state-title">No Map Data Yet</div>
    <div class="empty-state-sub">
      Play some matches to unlock per-map stats, win rates,
      and AI-powered map insights.
    </div>
  </div>
{:else}
  {#if strongestMap && weakestMap && strongestMap[0] !== weakestMap[0]}
    <div class="map-health-summary card span-12 visible">
      <div class="mhs-left">
        <span class="mhs-label">MAP POOL HEALTH</span>
      </div>
      <div class="mhs-pills">
        <span class="mhs-item good">
          <span class="mhs-dot good"></span>
          <b>{strongestMap[0]}</b>
          <span class="mhs-wr">{strongestWR}% WR</span>
          <span class="mhs-tag good">Strongest</span>
        </span>
        <span class="mhs-divider">→</span>
        <span class="mhs-item bad">
          <span class="mhs-dot bad"></span>
          <b>{weakestMap[0]}</b>
          <span class="mhs-wr">{weakestWR}% WR</span>
          <span class="mhs-tag bad">Weakest</span>
          {#if weakestTop3[0]}
            <span class="mhs-tip">· Try {weakestTop3[0].name}</span>
          {/if}
        </span>
      </div>
    </div>
  {/if}
  <div style="display:contents;">
    {#each maps as [name, m], i}
      {@const wr = Math.round((m.wins / m.matches) * 100)}
      {@const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2)}
      {@const acs = Math.round(m.score / Math.max(1, m.rounds || (m.matches * 24)))}
      {@const top3 = getTop3Agents(m.agents)}
      {@const rrDelta = getMapRRDelta(name)}
      {@const mapImg = getMapImg(name)}
      {@const insight = getMapInsight(name, m, top3, rrDelta)}
      <div class="map-card-bento reveal-on-scroll stagger-{i}" style="transition-delay:{i * 60}ms">
        <!-- Map splash banner -->
        {#if mapImg}
          <div class="map-splash-wrap">
            <img class="map-splash" src={mapImg} alt={name} loading="lazy" decoding="async" width="400" height="160" style="filter: saturate(1.2) brightness(0.65);" on:error={(e) => e.target.style.display='none'}>
            <div class="map-splash-overlay">
              <span class="map-splash-name">{name}</span>
              <span class="map-games-badge">{m.matches}G</span>
            </div>
          </div>
        {:else}
          <div class="map-splash-placeholder">
            <span>{name}</span>
            <span class="map-games-badge">{m.matches}G</span>
          </div>
        {/if}

        <div class="map-card-inner">
          <!-- WR row -->
          <div class="map-header">
            <div class="map-wr-pct {wrCls(wr)}">{wr}<span class="map-wr-unit">%</span></div>
            <div class="map-health-badge {wrCls(wr)}">{wrLabel(wr)}</div>
          </div>

          <!-- WR progress bar -->
          <div class="map-bar">
            <div class="map-bar-fill {wrCls(wr)}" style="width:{wr}%"></div>
          </div>

          <!-- Mini stats -->
          <div class="map-stats-mini">
            <div class="msm-item">
              <div class="msmv good">{m.wins}</div>
              <div class="msml">Wins</div>
            </div>
            <div class="msm-item">
              <div class="msmv bad">{m.matches - m.wins}</div>
              <div class="msml">Losses</div>
            </div>
            <div class="msm-item">
              <div class="msmv">{kd}</div>
              <div class="msml">K/D</div>
            </div>
            <div class="msm-item">
              <div class="msmv">{acs}</div>
              <div class="msml">ACS</div>
            </div>
          </div>

          <!-- Top agents -->
          {#if top3.length > 0}
            <div class="map-top-agents">
              {#each top3 as agent, idx}
                <div class="map-top-agent-item" class:map-top-agent-best={idx === 0}>
                  <img src={getAgentIconUrl(agent.name)} alt={agent.name} loading="lazy">
                  <div class="map-top-agent-info">
                    <span class="ata-name">{agent.name}</span>
                    <span class="ata-wr {wrCls(agent.wr)}">{agent.wr}%</span>
                  </div>
                  {#if idx === 0}
                <span class="ata-crown" title="Best agent on this map">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffd700" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 19h20v2H2v-2zm2-3l3-8 5 4 5-4 3 8H4zm8-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  </svg>
                </span>
              {/if}
                </div>
              {/each}
            </div>
          {/if}

          <!-- RR delta -->
          {#if rrDelta !== null}
            <div class="map-rr-mini">
              <span class="map-rr-mini-lbl">RR / GAME</span>
              <span class="map-rr-mini-val {rrDelta >= 0 ? 'pos' : 'neg'}">
                {rrDelta >= 0 ? '↑' : '↓'} {rrDelta >= 0 ? '+' : ''}{rrDelta}
              </span>
            </div>
          {/if}

          <!-- Smart insight -->
          <div class="map-insight">
            {#if insight.icon === 'warn'}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {:else if insight.icon === 'trophy'}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e8ff47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 2 9 2 22 22 22 22 9 18 9"/><path d="M6 9V3h12v6"/><path d="M12 22v-5"/><path d="M9 17h6"/></svg>
            {:else if insight.icon === 'fire'}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fa4454" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            {:else if insight.icon === 'tip'}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {:else if insight.icon === 'target'}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            {:else}
              <svg class="map-insight-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a0a0ab" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            {/if}
            {insight.text}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .map-insight {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
  }
  .map-insight-icon {
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>

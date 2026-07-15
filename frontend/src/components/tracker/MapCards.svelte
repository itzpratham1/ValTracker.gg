<script>
  import { AGENT_UUIDS } from '../../lib/constants';
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
    if (wr >= 55) return '🟢 Strong';
    if (wr >= 45) return '🟡 Neutral';
    return '🔴 Weak';
  }

  function wrCls(wr) {
    if (wr >= 55) return 'good';
    if (wr >= 45) return 'mid';
    return 'bad';
  }

  $: sortedMaps = [...maps].sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches));
  $: strongestMap = sortedMaps[0];
  $: weakestMap = sortedMaps[sortedMaps.length - 1];
  $: strongestWR = strongestMap ? Math.round((strongestMap[1].wins / strongestMap[1].matches) * 100) : 0;
  $: weakestWR = weakestMap ? Math.round((weakestMap[1].wins / weakestMap[1].matches) * 100) : 0;
  $: weakestTop3 = weakestMap ? getTop3Agents(weakestMap[1].agents) : [];
</script>

{#if maps.length === 0}
  <div class="card span-12 placeholder-card">
    <div class="placeholder-txt">No map data available for this mode</div>
  </div>
{:else}
  {#if strongestMap && weakestMap && strongestMap[0] !== weakestMap[0]}
    <div class="map-health-summary card span-12 visible">
      <span class="mhs-item good">🟢 Strongest: <b>{strongestMap[0]}</b> · {strongestWR}% WR</span>
      <span class="mhs-divider">·</span>
      <span class="mhs-item bad">🔴 Weakest: <b>{weakestMap[0]}</b> · {weakestWR}% WR — Try {weakestTop3[0]?.name || '...'} here</span>
    </div>
  {/if}
  <div style="display:contents;">
    {#each maps as [name, m], i}
      {@const wr = Math.round((m.wins / m.matches) * 100)}
      {@const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2)}
      {@const acs = Math.round(m.score / m.matches / 100)}
      {@const best = getBestAgent(m.agents)}
      {@const top3 = getTop3Agents(m.agents)}
      {@const rrDelta = getMapRRDelta(name)}
      {@const mapImg = getMapImg(name)}
      {@const bestIcon = getAgentIconUrl(best.name)}
      <div class="map-card-bento visible" style="animation-delay:{i * 60}ms">
        {#if mapImg}
          <div class="map-splash-wrap">
            <img class="map-splash" src={mapImg} alt={name} loading="lazy" on:error={(e) => e.target.style.display='none'}>
            <div class="map-splash-overlay">
              <span class="map-splash-name">{name}</span>
            </div>
          </div>
        {:else}
          <div class="map-splash-placeholder">{name}</div>
        {/if}
        <div class="map-card-inner">
          <div class="map-header">
            <div class="map-wr-pct {wrCls(wr)}">{wr}% WR</div>
            <div class="map-games">{m.matches} games</div>
          </div>
          <div class="map-bar"><div class="map-bar-fill {wrCls(wr)}" style="width:{wr}%"></div></div>
          <div class="map-health-badge {wrCls(wr)}">{wrLabel(wr)}</div>
          <div class="map-stats-mini">
            <div class="msm-item"><div class="msmv">{m.wins}</div><div class="msml">Wins</div></div>
            <div class="msm-item"><div class="msmv">{m.matches - m.wins}</div><div class="msml">Losses</div></div>
            <div class="msm-item"><div class="msmv">{kd}</div><div class="msml">K/D</div></div>
            <div class="msm-item"><div class="msmv">{acs}</div><div class="msml">ACS</div></div>
          </div>
          {#if top3.length > 0}
            <div class="map-top-agents">
              {#each top3 as agent}
                <div class="map-top-agent-item">
                  <img src={getAgentIconUrl(agent.name)} alt={agent.name} loading="lazy">
                  <span class="ata-name">{agent.name}</span>
                  <span class="ata-wr {wrCls(agent.wr)}">{agent.wr}%</span>
                </div>
              {/each}
            </div>
          {/if}
          {#if rrDelta !== null}
            <div class="map-rr-mini">
              <span class="map-rr-mini-lbl">RR DELTA</span>
              <span class="map-rr-mini-val {rrDelta >= 0 ? 'pos' : 'neg'}">
                {rrDelta >= 0 ? '↑' : '↓'} {rrDelta >= 0 ? '+' : ''}{rrDelta}
              </span>
            </div>
          {/if}
          {#if top3.length > 0}
            <div class="map-insight">💡 Play more {top3[0].name} here — your best agent on this map</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

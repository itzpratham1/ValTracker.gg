<script>
  import { AGENT_UUIDS } from '../../lib/constants';
  import { getAgentIconUrl, getMapImg } from '../../lib/assets';

  export let mapData = {};

  $: maps = Object.entries(mapData).sort((a, b) => b[1].matches - a[1].matches);

  function getBestAgent(agents) {
    const best = Object.entries(agents)
      .filter(([, a]) => a.matches >= 1)
      .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0];
    if (!best) return { name: '—', wr: '' };
    return { name: best[0], wr: Math.round((best[1].wins / best[1].matches) * 100) };
  }

</script>

{#if maps.length === 0}
  <div class="card span-12 placeholder-card">
    <div class="placeholder-txt">No map data available for this mode</div>
  </div>
{:else}
  <div style="display:contents;">
    {#each maps as [name, m], i}
      {@const wr = Math.round((m.wins / m.matches) * 100)}
      {@const cls = wr >= 55 ? 'good' : wr >= 45 ? 'mid' : 'bad'}
      {@const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2)}
      {@const acs = Math.round(m.score / m.matches / 100)}
      {@const best = getBestAgent(m.agents)}
      {@const mapImg = getMapImg(name)}
      {@const bestIcon = getAgentIconUrl(best.name)}
      <div class="map-card-bento visible" style="animation-delay:{i * 60}ms">
        {#if mapImg}
          <div class="map-splash-wrap">
            <img class="map-splash" src={mapImg} alt={name} loading="lazy">
            <div class="map-splash-overlay">
              <span class="map-splash-name">{name}</span>
            </div>
          </div>
        {:else}
          <div class="map-splash-placeholder">{name}</div>
        {/if}
        <div class="map-card-inner">
          <div class="map-header">
            <div class="map-wr-pct {cls}">{wr}% WR</div>
            <div class="map-games">{m.matches} games</div>
          </div>
          <div class="map-bar"><div class="map-bar-fill {cls}" style="width:{wr}%"></div></div>
          <div class="map-stats-mini">
            <div class="msm-item"><div class="msmv">{m.wins}</div><div class="msml">Wins</div></div>
            <div class="msm-item"><div class="msmv">{m.matches - m.wins}</div><div class="msml">Losses</div></div>
            <div class="msm-item"><div class="msmv">{kd}</div><div class="msml">K/D</div></div>
            <div class="msm-item"><div class="msmv">{acs}</div><div class="msml">ACS</div></div>
          </div>
          <div class="map-best-agent">
            {#if bestIcon}
              <img class="map-best-agent-icon" src={bestIcon} alt={best.name}>
            {/if}
            Best: <b>{best.name}</b>{#if best.wr !== ''} · {best.wr}% WR{/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

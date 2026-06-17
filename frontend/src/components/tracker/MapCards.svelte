<script>
  import { AGENT_UUIDS, MAP_IMAGES_FALLBACK } from '../../lib/constants';

  export let mapData = {};

  $: maps = Object.entries(mapData).sort((a, b) => b[1].matches - a[1].matches);

  function getAgentIcon(name) {
    if (!name) return null;
    let clean = name;
    if (name.toLowerCase() === 'kayo' || name.toLowerCase() === 'kay/o') clean = 'KAY/O';
    const u = AGENT_UUIDS[clean] || AGENT_UUIDS[name];
    if (u) return `https://media.valorant-api.com/agents/${u}/displayicon.png`;
    return null;
  }

  function getMapImg(name) {
    return MAP_IMAGES_FALLBACK[name] || null;
  }

  function getBestAgent(agents) {
    const best = Object.entries(agents)
      .filter(([, a]) => a.matches >= 1)
      .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0];
    if (!best) return { name: '—', wr: '' };
    return { name: best[0], wr: Math.round((best[1].wins / best[1].matches) * 100) };
  }
</script>

{#if maps.length === 0}
  <div class="placeholder-card">
    <div class="placeholder-txt">No map data available for this mode</div>
  </div>
{:else}
  <div class="maps-grid">
    {#each maps as [name, m], i}
      {@const wr = Math.round((m.wins / m.matches) * 100)}
      {@const cls = wr >= 55 ? 'good' : wr >= 45 ? 'mid' : 'bad'}
      {@const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2)}
      {@const acs = Math.round(m.score / m.matches / 100)}
      {@const best = getBestAgent(m.agents)}
      {@const mapImg = getMapImg(name)}
      {@const bestIcon = getAgentIcon(best.name)}
      <div class="map-card-bento" style="animation-delay:{i * 60}ms">
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

<style>
  .maps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }

  .map-card-bento {
    background: rgba(18, 18, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    transition: all 0.3s ease;
  }

  .map-card-bento:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translate3d(0, -4px, 0);
  }

  .map-card-bento:hover .map-splash {
    transform: scale(1.05);
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .map-splash-wrap {
    position: relative;
    width: 100%;
    height: 120px;
    overflow: hidden;
  }

  .map-splash {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    filter: saturate(1.2) brightness(0.6);
    transition: all 0.3s ease;
  }

  .map-card-bento:hover .map-splash {
    opacity: 1;
    filter: saturate(1.3) brightness(0.8);
  }

  .map-splash-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 12px;
    background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.6));
  }

  .map-splash-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #fff;
  }

  .map-splash-placeholder {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface2);
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: var(--muted2);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .map-card-inner {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .map-wr-pct {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.5px;
  }
  .map-wr-pct.good { color: var(--win); }
  .map-wr-pct.mid { color: var(--accent); }
  .map-wr-pct.bad { color: var(--loss); }

  .map-games {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
  }

  .map-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
    overflow: hidden;
  }

  .map-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .map-bar-fill.good { background: var(--win); }
  .map-bar-fill.mid { background: var(--accent); }
  .map-bar-fill.bad { background: var(--loss); }

  .map-stats-mini {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    text-align: center;
  }

  .msm-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .msmv {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
  }

  .msml {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: var(--muted2);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .map-best-agent {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.5px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .map-best-agent b {
    color: var(--text);
  }

  .map-best-agent-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
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
    .maps-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .map-splash-wrap {
      height: 90px;
    }
  }
</style>

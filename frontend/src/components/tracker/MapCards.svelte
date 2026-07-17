<script>
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
    if (wr >= 60) return '🟢 Dominant';
    if (wr >= 55) return '🟢 Strong';
    if (wr >= 45) return '🟡 Neutral';
    if (wr >= 38) return '🔴 Weak';
    return '🔴 Avoid';
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
      return `⚠️ Bleeding ${Math.abs(rrDelta)} RR avg on ${name} — consider dodging`;
    }
    if (rrDelta !== null && rrDelta >= 15) {
      return `🏆 High RR earner (+${rrDelta} avg) — queue ${name} more`;
    }
    if (wr >= 60 && top3[0]) {
      return `🔥 Dominant here — keep playing ${top3[0].name}`;
    }
    if (wr < 45 && top3.length > 0) {
      const bestUnplayed = top3.find(a => a.matches <= 2);
      if (bestUnplayed) return `💡 Try ${bestUnplayed.name} — high WR in limited games`;
      return `💡 Stick to ${top3[0].name} on ${name} for best results`;
    }
    if (kd >= 1.5) {
      return `🎯 Great fragging (${kd.toFixed(2)} K/D) — convert more into wins`;
    }
    return `📊 ${m.matches} game sample — keep grinding for cleaner data`;
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
      <div class="map-card-bento visible" style="animation-delay:{i * 60}ms">
        <!-- Map splash banner -->
        {#if mapImg}
          <div class="map-splash-wrap">
            <img class="map-splash" src={mapImg} alt={name} loading="lazy" on:error={(e) => e.target.style.display='none'}>
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
                    <span class="ata-crown">👑</span>
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
          <div class="map-insight">{insight}</div>
        </div>
      </div>
    {/each}
  </div>
{/if}

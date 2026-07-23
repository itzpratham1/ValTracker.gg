<script>
  import { WEAPON_IMGS, WEAPON_TYPES } from '../../lib/constants';
  import { assetCache } from '../../lib/assets';

  export let precomputedWeapons = {};
  export let playerName = '';
  export let playerTag = '';
  export let mode = 'competitive';

  let activeExpandedWpn = null;

  function toggleWeaponExpand(wpn) {
    if (typeof window !== 'undefined' && window.innerWidth > 600) return;
    activeExpandedWpn = activeExpandedWpn === wpn ? null : wpn;
  }

  $: entries = Object.entries(precomputedWeapons)
    .filter(([, v]) => v.kills >= 1)
    .sort((a, b) => b[1].kills - a[1].kills);

  $: topWeapon = entries[0] || null;
  $: secondaryWeapons = entries.slice(1, 5); // limit to 4 secondary weapons

  // Reactive snapshot saving
  $: if (playerName && playerTag && precomputedWeapons && Object.keys(precomputedWeapons).length > 0) {
    saveWeaponSnapshot(precomputedWeapons);
  }

  function saveWeaponSnapshot(weaponData) {
    if (typeof window === 'undefined' || !playerName || !playerTag) return;
    const key = `vt_wpn_hist_${playerName.toLowerCase()}_${playerTag.toLowerCase()}_${(mode || 'competitive').toLowerCase()}`;
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(key)) || [];
    } catch(e) {
      history = [];
    }
    const snapshot = { ts: Date.now(), weapons: {} };
    Object.entries(weaponData).forEach(([wpn, v]) => {
      if (v.kills >= 1) {
        const total = (v.headshots || 0) + (v.bodyshots || 0) + (v.legshots || 0);
        snapshot.weapons[wpn] = {
          kills: v.kills,
          headshots: v.headshots || 0,
          bodyshots: v.bodyshots || 0,
          legshots: v.legshots || 0,
          hsPct: total ? Math.round((v.headshots || 0) / total * 100) : 0
        };
      }
    });
    // Deduplicate: overwrite if last snapshot was within 10 minutes (same session re-fetch)
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    if (history.length > 0 && history[history.length - 1].ts > tenMinAgo) {
      history[history.length - 1] = snapshot;
    } else {
      history.push(snapshot);
    }
    if (history.length > 15) history = history.slice(-15);
    try {
      localStorage.setItem(key, JSON.stringify(history));
    } catch(e) {}
  }

  function getWeaponTrend(wpn, currentHsPct) {
    if (typeof window === 'undefined' || !playerName || !playerTag) {
      return { trend: 'new', delta: 0 };
    }
    const key = `vt_wpn_hist_${playerName.toLowerCase()}_${playerTag.toLowerCase()}_${(mode || 'competitive').toLowerCase()}`;
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(key)) || [];
    } catch(e) {}
    const withData = history.filter(s => s.weapons && s.weapons[wpn] !== undefined);

    if (withData.length < 2) {
      return { trend: 'new', delta: 0 };
    }
    const prev = withData[withData.length - 2].weapons[wpn].hsPct;
    const delta = currentHsPct - prev;
    const trend = delta >= 3 ? 'up' : delta <= -3 ? 'down' : 'flat';
    return { trend, delta };
  }

  function getHsPct(v) {
    const total = (v.headshots || 0) + (v.bodyshots || 0) + (v.legshots || 0);
    return total ? Math.round((v.headshots || 0) / total * 100) : 0;
  }

  function getHsPctColor(pct) {
    if (pct >= 25) return 'var(--win)';
    if (pct >= 15) return 'var(--accent)';
    return 'var(--loss)';
  }

  function getWeaponImg(name) {
    const cached = assetCache.weapons[name.toLowerCase()];
    return cached ? cached.iconUrl : (WEAPON_IMGS[name] || null);
  }

  function getWeaponType(name) {
    return WEAPON_TYPES[name] || 'Weapon';
  }

  function buildSparklineSVG(points, w, h) {
    if (!points || points.length < 2) return '';
    const min = Math.min(...points), max = Math.max(...points), range = (max - min) || 1;
    const px = 4, py = 4, iw = w - px * 2, ih = h - py * 2;
    const pts = points.map((v, i) => {
      const x = px + (i / (points.length - 1)) * iw;
      const y = py + ih - ((v - min) / range) * ih;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const lp = pts[pts.length - 1].split(',');
    const lx = parseFloat(lp[0]), ly = parseFloat(lp[1]);
    const rising = points[points.length - 1] >= points[points.length - 2];
    const col = rising ? '#3ecf8e' : '#ff4d6d';
    return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;"><polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="${lx}" cy="${ly}" r="2.5" fill="${col}"/></svg>`;
  }

  function getHeatmapSvg(hsPct, height = 115, v = null) {
    const values = getHeatmapValues(v, hsPct);
    const hs = values.head;
    const bd = values.body;
    const lg = values.legs;
    const hsOpacity = Math.max(0.12, hs / 60);
    const bdOpacity = Math.max(0.12, bd / 100);
    const lgOpacity = Math.max(0.06, lg / 20);
    const hsFill = `rgba(255, 70, 85, ${hsOpacity})`;
    const bdFill = `rgba(255, 70, 85, ${bdOpacity})`;
    const lgFill = `rgba(255, 70, 85, ${lgOpacity})`;
    return `
      <svg viewBox="0 0 100 160" style="height:${height}px; width:auto; overflow:visible; display:block;" class="wpn-silhouette-svg">
        <defs>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
            <feComposite in="SourceGraphic" operator="over" />
          </filter>
        </defs>
        <path d="M 50 35 C 57 35, 62 29, 62 20 C 62 11, 57 5, 50 5 C 43 5, 38 11, 38 20 C 38 29, 43 35, 50 35 Z" fill="${hsFill}" stroke="#ff4655" stroke-width="1.5" style="filter: ${hs >= 30 ? 'url(#glow-red)' : 'none'};"/>
        <path d="M 32 40 L 68 40 C 72 45, 72 55, 70 70 L 66 110 C 66 110, 60 115, 50 115 C 40 115, 34 110, 34 110 L 30 70 C 28 55, 28 45, 32 40 Z" fill="${bdFill}" stroke="#ff4655" stroke-width="1.5" style="filter: ${bd >= 50 ? 'url(#glow-red)' : 'none'};"/>
        <path d="M 35 116 C 37 116, 47 118, 48 122 L 44 155 C 44 157, 36 157, 34 157 C 32 157, 32 153, 33 148 L 36 122 M 65 116 C 63 116, 53 118, 52 122 L 56 155 C 56 157, 64 157, 66 157 C 68 157, 68 153, 67 148 L 64 122" fill="${lgFill}" stroke="#ff4655" stroke-width="1.5"/>
      </svg>
    `;
  }

  function getMatchHistoryPoints(wpn) {
    if (!wpn || !wpn.matchHistory) return [];
    const sorted = [...wpn.matchHistory].sort((a, b) => a.gameStart - b.gameStart);
    return sorted.slice(-10).map(h => h.hsPct);
  }

  function getHeatmapValues(v, fallbackHsPct = 0) {
    if (v && typeof v === 'object') {
      const total = (v.headshots || 0) + (v.bodyshots || 0) + (v.legshots || 0);
      if (total > 0) {
        const head = Math.round((v.headshots || 0) / total * 100);
        const legs = Math.round((v.legshots || 0) / total * 100);
        const body = Math.max(0, 100 - head - legs);
        return { head, body, legs };
      }
    }
    const head = fallbackHsPct;
    const legs = 5;
    const body = Math.max(0, 100 - head - legs);
    return { head, body, legs };
  }
</script>

{#if entries.length === 0}
  <div class="card span-12 placeholder-card">
    <div class="placeholder-txt">No weapon data available for this mode</div>
  </div>
{:else}
  <div class="card span-12 weapons-card visible" id="weapons-card">
    <div class="card-accent-line"></div>
    <div class="card-label">Weapon Performance — Based on stored match data</div>
    <div class="weapons-showcase-container">
      {#if topWeapon}
        {@const [wpn, v] = topWeapon}
        {@const hsPct = getHsPct(v)}
        {@const hsCol = getHsPctColor(hsPct)}
        {@const imgUrl = getWeaponImg(wpn)}
        {@const type = getWeaponType(wpn)}
        {@const trend = getWeaponTrend(wpn, hsPct)}
        {@const topMatchPoints = getMatchHistoryPoints(v)}
        {@const topSparkSVG = buildSparklineSVG(topMatchPoints, 120, 32)}
        {@const heat = getHeatmapValues(v, hsPct)}
        <div class="top-weapon-showcase">
          <div class="top-weapon-badge">&#128293; Top Arsenal</div>
          <div class="top-weapon-img-wrap">
            {#if imgUrl}
              <img class="top-weapon-img" src={imgUrl} alt={wpn} on:error={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='block'; }}>
            {/if}
            <div class="weapon-img-fallback" style={imgUrl ? 'display:none;' : ''}>{wpn}</div>
          </div>
          <div class="top-weapon-info-wrap">
            <div class="top-weapon-left-col">
              <div class="top-weapon-details">
                <div class="top-weapon-name">{wpn}</div>
                <div class="top-weapon-type">{type}</div>
                <div class="top-weapon-stats-grid">
                  <div class="top-weapon-stat">
                    <span class="top-weapon-val">{v.kills}</span>
                    <span class="top-weapon-lbl">Kills</span>
                  </div>
                  <div class="top-weapon-stat">
                    <span class="top-weapon-val" style="color:{hsCol}">
                      {hsPct}%&thinsp;
                      {#if trend.trend === 'up'}
                        <span class="wpn-trend-pill wpn-trend-pill-up">&#9650; +{trend.delta}%</span>
                      {:else if trend.trend === 'down'}
                        <span class="wpn-trend-pill wpn-trend-pill-down">&#9660; {trend.delta}%</span>
                      {:else if trend.trend === 'flat'}
                        <span class="wpn-trend-pill wpn-trend-pill-flat">
                          {trend.delta > 0 ? `+${trend.delta}` : trend.delta < 0 ? `${trend.delta}` : `\u00B10`}%
                        </span>
                      {/if}
                    </span>
                    <span class="top-weapon-lbl">HS%</span>
                  </div>
                </div>
              </div>
              {#if topSparkSVG}
                <div class="wpn-sparkline-section">
                  <div class="wpn-sparkline-header">
                    <span class="wpn-sparkline-label">10-MATCH TREND</span>
                    <span class="wpn-sparkline-sessions">{topMatchPoints.length} match{topMatchPoints.length !== 1 ? 'es' : ''} tracked</span>
                  </div>
                  <div class="wpn-sparkline-wrap">{@html topSparkSVG}</div>
                  <div class="wpn-sparkline-axis">
                    <span>{Math.min(...topMatchPoints)}%</span>
                    <span class="wpn-sparkline-axis-mid">recent matches</span>
                    <span>{Math.max(...topMatchPoints)}%</span>
                  </div>
                </div>
              {:else}
                <div class="wpn-sparkline-section wpn-first-session">
                  <span class="wpn-sparkline-label">&#128202; TRACKING STARTED</span>
                  <span class="wpn-sparkline-sessions">Trend data builds across your next matches</span>
                </div>
              {/if}
            </div>
            
            <div class="wpn-heatmap-card">
              <div class="wpn-heatmap-inner">
                <div class="wpn-silhouette-wrap">
                  {@html getHeatmapSvg(hsPct, 105, v)}
                </div>
                <div class="wpn-heatmap-stats">
                  <div class="wpn-hm-stat-row">
                    <span class="wpn-hm-lbl head">HEAD</span>
                    <span class="wpn-hm-val">{heat.head}%</span>
                  </div>
                  <div class="wpn-hm-stat-row body-row">
                    <span class="wpn-hm-lbl body">BODY</span>
                    <span class="wpn-hm-val">{heat.body}%</span>
                  </div>
                  <div class="wpn-hm-stat-row legs-row">
                    <span class="wpn-hm-lbl legs">LEGS</span>
                    <span class="wpn-hm-val">{heat.legs}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if secondaryWeapons.length}
        <div class="secondary-weapon-stack">
          {#each secondaryWeapons as [wpn, v]}
            {@const hsPct = getHsPct(v)}
            {@const hsCol = getHsPctColor(hsPct)}
            {@const imgUrl = getWeaponImg(wpn)}
            {@const type = getWeaponType(wpn)}
            {@const trend = getWeaponTrend(wpn, hsPct)}
            {@const secMatchPoints = getMatchHistoryPoints(v)}
            {@const secSparkSVG = buildSparklineSVG(secMatchPoints, 120, 24)}
            {@const heat = getHeatmapValues(v, hsPct)}
            {@const isExpanded = activeExpandedWpn === wpn}
            
            <div 
              class="secondary-weapon-row wpn-tooltip-trigger {isExpanded ? 'is-expanded' : ''}"
              on:click={() => toggleWeaponExpand(wpn)}
              role="button"
              tabindex="0"
              on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleWeaponExpand(wpn)}
            >
              <div class="sec-weapon-img-wrap">
                {#if imgUrl}
                  <img class="sec-weapon-img" src={imgUrl} alt={wpn} on:error={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='block'; }}>
                {/if}
                <div class="weapon-img-fallback" style={imgUrl ? 'display:none;' : ''}>{wpn}</div>
              </div>
              <div class="sec-weapon-meta">
                <div class="sec-weapon-name">{wpn}</div>
                <div class="sec-weapon-type">{type}</div>
              </div>
              <div class="sec-weapon-stats-wrap">
                <div class="sec-weapon-stat">
                  <span class="sec-weapon-val">{v.kills}</span>
                  <span class="sec-weapon-lbl">Kills</span>
                </div>
                <!-- Mini Accuracy Bar for mobile layout -->
                <div class="sec-weapon-mini-bar-wrap" title="Accuracy: {hsPct}% Headshots">
                  <div class="sec-weapon-mini-bar-fill" style="width:{hsPct}%; background:var(--win);"></div>
                  <div class="sec-weapon-mini-bar-fill-rest" style="width:{100 - hsPct}%; background:rgba(255,255,255,0.1);"></div>
                </div>
                <div class="sec-weapon-stat text-right">
                  <span class="sec-weapon-val" style="color:{hsCol}">{hsPct}%</span>
                  <span class="sec-weapon-lbl">HS%</span>
                </div>
              </div>
              <div class="sec-weapon-acc-bars">
                <div class="sec-weapon-acc-row">
                  <span class="sec-war-lbl">HS</span>
                  <div class="sec-war-bar-wrap"><div class="sec-war-bar-fill" style="width:{hsPct}%;background:var(--win);"></div></div>
                  <span class="sec-war-pct" style="color:var(--win)">{hsPct}%</span>
                </div>
                <div class="sec-weapon-acc-row">
                  <span class="sec-war-lbl">BD/LG</span>
                  <div class="sec-war-bar-wrap"><div class="sec-war-bar-fill" style="width:{100 - hsPct}%;background:var(--muted2);"></div></div>
                  <span class="sec-war-pct" style="color:var(--muted2)">{100 - hsPct}%</span>
                </div>
              </div>
              
              <!-- Hover tooltip card for Desktop -->
              <div class="wpn-tooltip-card">
                <div class="wpn-tt-title">Target Heatmap</div>
                {@html getHeatmapSvg(hsPct, 64, v)}
                <div class="wpn-tt-stats">
                  <span class="head">H:{heat.head}%</span>
                  <span class="body">B:{heat.body}%</span>
                  <span class="legs">L:{heat.legs}%</span>
                </div>
                
                {#if secSparkSVG}
                  <div class="wpn-tt-trend-wrap">
                    <div class="wpn-tt-trend-header">
                      <span>10-Match Trend</span>
                      <span class="wpn-tt-trend-sub">{secMatchPoints.length} games</span>
                    </div>
                    <div class="wpn-tt-svg-box">
                      {@html secSparkSVG}
                    </div>
                    <div class="wpn-tt-axis">
                      <span>Min: {Math.min(...secMatchPoints)}%</span>
                      <span>Max: {Math.max(...secMatchPoints)}%</span>
                    </div>
                  </div>
                {:else}
                  <div class="wpn-tt-no-trend">
                    <span>10-MATCH TREND</span>
                    <span class="sub">Not enough matches played with this weapon</span>
                  </div>
                {/if}
              </div>

              <!-- Trend Arrow badge & Mobile Expand Icon -->
              <div class="sec-wpn-trend-col">
                {#if trend.trend === 'up'}
                  <span class="sec-wpn-trend sec-wpn-trend-up" title="HS% up +{trend.delta}% vs last session">&#9650; +{trend.delta}%</span>
                {:else if trend.trend === 'down'}
                  <span class="sec-wpn-trend sec-wpn-trend-down" title="HS% down {trend.delta}% vs last session">&#9660; {trend.delta}%</span>
                {:else if trend.trend === 'flat'}
                  <span class="sec-wpn-trend sec-wpn-trend-flat" title="HS% stable vs last session">{trend.delta > 0 ? `+${trend.delta}` : trend.delta < 0 ? `${trend.delta}` : `\u00B10`}%</span>
                {:else}
                  <span class="sec-wpn-trend sec-wpn-trend-new" title="First session — tracking started">NEW</span>
                {/if}
                <span class="sec-weapon-expand-chevron">{isExpanded ? '▲' : '▼'}</span>
              </div>

              <!-- Mobile Expanded Details Drawer -->
              {#if isExpanded}
                <div class="sec-weapon-expanded-panel" on:click|stopPropagation>
                  <div class="sec-expand-col heatmap-col">
                    <div class="sec-expand-title">Target Heatmap</div>
                    <div class="sec-expand-hm-body">
                      {@html getHeatmapSvg(hsPct, 75, v)}
                      <div class="sec-expand-hm-stats">
                        <div class="sec-hm-row"><span class="head-lbl">HEAD</span> <strong class="head-val">{heat.head}%</strong></div>
                        <div class="sec-hm-row"><span class="body-lbl">BODY</span> <strong class="body-val">{heat.body}%</strong></div>
                        <div class="sec-hm-row"><span class="legs-lbl">LEGS</span> <strong class="legs-val">{heat.legs}%</strong></div>
                      </div>
                    </div>
                  </div>
                  {#if secSparkSVG}
                    <div class="sec-expand-col trend-col">
                      <div class="sec-expand-title">
                        <span>10-Match Trend</span>
                        <span class="sec-expand-sub">{secMatchPoints.length} games</span>
                      </div>
                      <div class="sec-expand-svg-wrap">
                        {@html secSparkSVG}
                      </div>
                      <div class="sec-expand-axis">
                        <span>Min: {Math.min(...secMatchPoints)}%</span>
                        <span>Max: {Math.max(...secMatchPoints)}%</span>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="weapon-disclaimer">
      <span class="asterisk">*</span>
      <div>
        Riot Games' match API only exposes weapon data in individual final kill events.
        <strong>HS%</strong> is headshot accuracy: headshots hit divided by total shots landed with this weapon (head + body + legs). Typical range is 15&#8211;30%.
        <strong>Trend arrows</strong> compare your current HS% with your previous tracked session &#8212; stored locally in your browser and never sent to any server.
      </div>
    </div>
  </div>
{/if}

<style>
  /* Local component style overrides if needed, leaving empty to match standard conventions */
</style>

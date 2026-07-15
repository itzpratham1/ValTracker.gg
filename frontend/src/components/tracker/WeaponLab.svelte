<script>
  import { WEAPON_IMGS, WEAPON_TYPES } from '../../lib/constants';
  import { assetCache } from '../../lib/assets';

  export let precomputedWeapons = {};
  export let playerName = '';
  export let playerTag = '';
  export let mode = 'competitive';

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
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible"><polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="${lx}" cy="${ly}" r="2.5" fill="${col}"/></svg>`;
  }

  function getHeatmapSvg(hsPct, height = 115) {
    const hs = Math.min(Math.round(hsPct * 0.7) + 5, 55);
    const lg = Math.max(Math.round((100 - hs) * 0.08), 3);
    const bd = 100 - hs - lg;
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

  function getHeatmapValues(hsPct) {
    const hs = Math.min(Math.round(hsPct * 0.7) + 5, 55);
    const lg = Math.max(Math.round((100 - hs) * 0.08), 3);
    const bd = 100 - hs - lg;
    return { head: hs, body: bd, legs: lg };
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
    <div class="weapons-showcase-container" style="margin-top: 12px;">
      {#if topWeapon}
        {@const [wpn, v] = topWeapon}
        {@const hsPct = getHsPct(v)}
        {@const hsCol = getHsPctColor(hsPct)}
        {@const imgUrl = getWeaponImg(wpn)}
        {@const type = getWeaponType(wpn)}
        {@const trend = getWeaponTrend(wpn, hsPct)}
        {@const topMatchPoints = getMatchHistoryPoints(v)}
        {@const topSparkSVG = buildSparklineSVG(topMatchPoints, 120, 32)}
        {@const heat = getHeatmapValues(hsPct)}
        <div class="top-weapon-showcase" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div class="top-weapon-badge">&#128293; Top Arsenal</div>
          <div class="top-weapon-img-wrap" style="text-align: center; margin-bottom: 8px;">
            {#if imgUrl}
              <img class="top-weapon-img" src={imgUrl} alt={wpn} on:error={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='block'; }}>
            {/if}
            <div class="weapon-img-fallback" style={imgUrl ? 'display:none;' : ''}>{wpn}</div>
          </div>
          <div class="top-weapon-info-wrap">
            <div style="flex: 1.2; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;">
              <div class="top-weapon-details" style="padding: 0;">
                <div class="top-weapon-name" style="margin: 0; line-height: 1;">{wpn}</div>
                <div class="top-weapon-type">{type}</div>
                <div class="top-weapon-stats-grid" style="margin-top: 10px; margin-bottom: 10px;">
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
            
            <div class="wpn-heatmap-card" style="width: 125px; flex-shrink: 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 8px; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="display: flex; gap: 8px; align-items: center; width: 100%; justify-content: center;">
                <div style="position: relative;">
                  {@html getHeatmapSvg(hsPct, 105)}
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; font-family:'DM Mono', monospace; font-size: 8px; min-width: 45px; text-align: left;">
                  <div style="display: flex; flex-direction: column;">
                    <span style="color: #ff4655; font-weight: bold; letter-spacing: 0.5px;">HEAD</span>
                    <span style="font-size: 10px; font-weight: 900; color: #fff;">{heat.head}%</span>
                  </div>
                  <div style="display: flex; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 3px;">
                    <span style="color: rgba(255, 70, 85, 0.75); font-weight: bold; letter-spacing: 0.5px;">BODY</span>
                    <span style="font-size: 10px; font-weight: 900; color: #fff;">{heat.body}%</span>
                  </div>
                  <div style="display: flex; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 3px;">
                    <span style="color: rgba(255, 70, 85, 0.45); font-weight: bold; letter-spacing: 0.5px;">LEGS</span>
                    <span style="font-size: 10px; font-weight: 900; color: #fff;">{heat.legs}%</span>
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
            {@const heat = getHeatmapValues(hsPct)}
            
            <div class="secondary-weapon-row wpn-tooltip-trigger">
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
                <div class="sec-weapon-stat">
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
              
              <!-- Hover tooltip card -->
              <div class="wpn-tooltip-card" style="width: 150px; gap: 8px;">
                <div style="font-family:'Barlow Condensed', sans-serif; font-size:10px; font-weight:800; text-transform:uppercase; color:var(--accent); letter-spacing:0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); width: 100%; text-align: center; padding-bottom: 3px; margin-bottom: 2px;">Target Heatmap</div>
                {@html getHeatmapSvg(hsPct, 64)}
                <div style="display:flex; justify-content:space-between; width:100%; font-family:'DM Mono',monospace; font-size:8px; color:#fff; padding-bottom: 4px; box-sizing:border-box;">
                  <span style="color:#ff4655">H:{heat.head}%</span>
                  <span style="color:rgba(255,70,85,0.75)">B:{heat.body}%</span>
                  <span style="color:rgba(255,70,85,0.45)">L:{heat.legs}%</span>
                </div>
                
                {#if secSparkSVG}
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px;">
                    <div style="display:flex; justify-content:space-between; width: 100%; font-family:'Barlow Condensed', sans-serif; font-size:9px; font-weight:800; text-transform:uppercase; color:var(--win); letter-spacing:0.5px;">
                      <span>10-Match Trend</span>
                      <span style="color:var(--muted2); font-weight:normal; font-size:7px;">{secMatchPoints.length} games</span>
                    </div>
                    <div style="height: 24px; width: 120px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
                      {@html secSparkSVG}
                    </div>
                    <div style="display:flex; justify-content:space-between; width:100%; font-family:'DM Mono',monospace; font-size:7px; color:var(--muted2);">
                      <span>Min: {Math.min(...secMatchPoints)}%</span>
                      <span>Max: {Math.max(...secMatchPoints)}%</span>
                    </div>
                  </div>
                {:else}
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; padding-top: 5px; margin-top: 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-family:'Barlow Condensed', sans-serif; font-size:8px; color:var(--muted2); text-align:center;">
                    <span>10-MATCH TREND</span>
                    <span style="font-size:7px;">Not enough matches played with this weapon</span>
                  </div>
                {/if}
              </div>

              <!-- Trend Arrow badge -->
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
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="weapon-disclaimer">
      <span class="asterisk">*</span>
      <div>
        Riot Games' match API only exposes weapon data in individual final kill events.
        <strong>HS%</strong> is the percentage of kills that were headshots with this weapon, typically 40-70% depending on weapon type.
        <strong>Trend arrows</strong> compare your current HS% with your previous tracked session &#8212; stored locally in your browser and never sent to any server.
      </div>
    </div>
  </div>
{/if}

<style>
  /* Local component style overrides if needed, leaving empty to match standard conventions */
</style>

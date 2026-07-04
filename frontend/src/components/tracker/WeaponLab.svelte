<script>
  import { WEAPON_IMGS, WEAPON_TYPES } from '../../lib/constants';

  export let precomputedWeapons = {};
  export let playerName = '';
  export let playerTag = '';

  $: entries = Object.entries(precomputedWeapons)
    .filter(([, v]) => v.kills >= 1)
    .sort((a, b) => b[1].kills - a[1].kills);

  $: topWeapon = entries[0] || null;
  $: secondaryWeapons = entries.slice(1, 5);

  function getHsPct(v) {
    return v.kills ? Math.round(v.hs / v.kills * 100) : 0;
  }

  function getHsPctColor(pct) {
    if (pct >= 30) return 'var(--win)';
    if (pct >= 20) return 'var(--accent)';
    return 'var(--loss)';
  }

  function getWeaponImg(name) {
    return WEAPON_IMGS[name] || null;
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
      <svg viewBox="0 0 100 160" style="height:${height}px; width:auto; overflow:visible; display:block;">
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
    if (!wpn.matchHistory) return [];
    return wpn.matchHistory.slice(-10).map(h => h.hsPct);
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
  <div class="card span-12 weapons-card" id="weapons-card">
    <div class="card-accent-line"></div>
    <div class="card-label">Weapon Performance — Based on stored match data</div>
    <div class="weapons-showcase-container" style="margin-top: 12px;">
      {#if topWeapon}
        {@const [wpn, v] = topWeapon}
        {@const hsPct = getHsPct(v)}
        {@const hsCol = getHsPctColor(hsPct)}
        {@const imgUrl = getWeaponImg(wpn)}
        {@const type = getWeaponType(wpn)}
        {@const sparkPoints = getMatchHistoryPoints(v)}
        {@const sparkSVG = buildSparklineSVG(sparkPoints, 120, 32)}
        {@const heat = getHeatmapValues(hsPct)}
        <div class="top-weapon-showcase">
          <div class="top-weapon-badge">Top Arsenal</div>
          <div class="top-weapon-img-wrap">
            {#if imgUrl}
              <img class="top-weapon-img" src={imgUrl} alt={wpn}>
            {/if}
            <div class="weapon-img-fallback" style={imgUrl ? 'display:none' : ''}>{wpn}</div>
          </div>
          <div class="top-weapon-details">
            <div class="top-weapon-name">{wpn}</div>
            <div class="top-weapon-type">{type}</div>
            <div class="top-weapon-stats-grid">
              <div class="top-weapon-stat">
                <span class="top-weapon-val">{v.kills}</span>
                <span class="top-weapon-lbl">Kills</span>
              </div>
              <div class="top-weapon-stat">
                <span class="top-weapon-val" style="color:{hsCol}">{hsPct}%</span>
                <span class="top-weapon-lbl">HS Kill %</span>
              </div>
            </div>
          </div>
          {#if sparkSVG}
            <div class="wpn-sparkline-section">
              <span class="wpn-sparkline-label">10-MATCH TREND</span>
              <div class="wpn-sparkline-wrap">{@html sparkSVG}</div>
            </div>
          {/if}
          <div class="wpn-heatmap-card">
            <div class="wpn-heatmap-inner">
              <div class="wpn-heatmap-svg">{@html getHeatmapSvg(hsPct, 105)}</div>
              <div class="wpn-heatmap-labels">
                <div class="wpn-hl-row">
                  <span style="color:#ff4655">HEAD</span>
                  <span>{heat.head}%</span>
                </div>
                <div class="wpn-hl-row">
                  <span style="color:rgba(255,70,85,0.75)">BODY</span>
                  <span>{heat.body}%</span>
                </div>
                <div class="wpn-hl-row">
                  <span style="color:rgba(255,70,85,0.45)">LEGS</span>
                  <span>{heat.legs}%</span>
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
            <div class="secondary-weapon-row">
              <div class="sec-weapon-img-wrap">
                {#if imgUrl}
                  <img class="sec-weapon-img" src={imgUrl} alt={wpn}>
                {/if}
                <div class="weapon-img-fallback" style={imgUrl ? 'display:none' : ''}>{wpn}</div>
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
                  <span class="sec-weapon-lbl">HS Kill %</span>
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
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="weapon-disclaimer">
      <span class="asterisk">*</span>
      <div>
        Riot Games' match API only exposes weapon data in individual final kill events.
        <strong>HS Kill %</strong> represents the percentage of your kills that were finished with a headshot, which typically ranges from 40-70% depending on weapon type, and is distinct from overall bullet hit accuracy.
      </div>
    </div>
  </div>
{/if}

<style>
</style>

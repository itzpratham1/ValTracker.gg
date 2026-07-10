<script>
  import { AGENT_ROLES } from '../../lib/constants';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';

  function normalizeName(str) {
    return (str || '').toLowerCase().replace(/\s+/g, '');
  }

  function findMe(match) {
    if (!match) return null;
    const all = Array.isArray(match.players) ? match.players : (match.players?.all_players || match.players || []);
    const tn = normalizeName(playerName);
    const tt = normalizeName(playerTag);
    return (Array.isArray(all) ? all : []).find(
      p => normalizeName(p.name) === tn && normalizeName(p.tag) === tt
    ) || null;
  }

  function getRoleClass(agentName) {
    let cleanName = agentName || '';
    if (cleanName.toLowerCase() === 'kayo' || cleanName.toLowerCase() === 'kay/o') cleanName = 'KAY/O';
    return AGENT_ROLES[cleanName.toLowerCase().replace(/\//g, '')] || 'duelist';
  }

  function buildAccuracyBodySvg(hsPct, bsPct, lsPct) {
    const headColor = hsPct >= 25 ? 'var(--win)' : (hsPct >= 15 ? 'var(--accent)' : '#ff4655');
    const headFill = hsPct >= 25 ? 'rgba(62,207,142,0.15)' : (hsPct >= 15 ? 'rgba(232,255,71,0.09)' : 'rgba(255,70,85,0.09)');
    const visorColor = hsPct >= 25 ? '#3ecf8e' : (hsPct >= 15 ? '#e8ff47' : '#ff4655');
    const bodyColor = bsPct >= 50 ? '#ff4655' : 'rgba(255,255,255,0.25)';
    const bodyFill = bsPct >= 50 ? 'rgba(255,70,85,0.12)' : 'rgba(255,255,255,0.02)';
    const coreColor = bsPct >= 50 ? '#ff4655' : 'rgba(255,255,255,0.4)';
    const legsColor = 'rgba(255,255,255,0.2)';
    const legsFill = 'rgba(255,255,255,0.015)';

    return `<svg class="acc-figure" width="90" height="120" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block !important; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); flex-shrink:0;">
      <defs>
        <pattern id="holo-grid-acc" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <circle cx="50" cy="65" r="48" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" fill="none" />
      <circle cx="50" cy="65" r="44" stroke="rgba(255, 255, 255, 0.02)" stroke-width="0.75" stroke-dasharray="4,4" fill="none" />
      <circle cx="50" cy="65" r="54" stroke="rgba(255, 255, 255, 0.015)" stroke-width="0.5" fill="none" />
      <path d="M 12 18 H 6 V 24" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 88 18 H 94 V 24" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 12 112 H 6 V 106" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <path d="M 88 112 H 94 V 106" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" fill="none" />
      <circle cx="50" cy="65" r="44" fill="url(#holo-grid-acc)" />
      <path d="M50,10 C56,10 60,14 60,20 C60,24 58,28 55,29 L50,32 L45,29 C42,28 40,24 40,20 C40,14 44,10 50,10 Z" fill="${headFill}" stroke="${headColor}" stroke-width="1.5"/>
      <path d="M44,18 H56 V20 H44 Z" fill="${visorColor}" opacity="0.8" style="filter: drop-shadow(0 0 3px ${visorColor});"/>
      <text x="50" y="27" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="white" font-weight="700" style="letter-spacing:-0.2px;">${hsPct}%</text>
      <path d="M32,36 H68 C72,36 75,39 74,43 L69,72 C68,75 65,77 62,77 H38 C35,77 32,75 31,72 L26,43 C25,39 28,36 32,36 Z" fill="${bodyFill}" stroke="${bodyColor}" stroke-width="1.2"/>
      <path d="M36,40 H64 L61,71 H39 Z" stroke="rgba(255,255,255,0.05)" stroke-width="0.75" fill="none"/>
      <circle cx="50" cy="48" r="3.5" fill="none" stroke="${coreColor}" stroke-width="1"/>
      <circle cx="50" cy="48" r="1.5" fill="${coreColor}"/>
      <text x="50" y="65" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="rgba(255,255,255,0.9)" font-weight="700">${bsPct}%</text>
      <path d="M30,82 H44 L40,118 H32 Z" fill="${legsFill}" stroke="${legsColor}" stroke-width="1"/>
      <path d="M56,82 H70 L68,118 H60 Z" fill="${legsFill}" stroke="${legsColor}" stroke-width="1"/>
      <path d="M33,100 H39" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" />
      <path d="M61,100 H67" stroke="rgba(255,255,255,0.15)" stroke-width="0.75" />
      <text x="50" y="103" text-anchor="middle" font-family="'DM Mono', monospace" font-size="7" fill="rgba(255,255,255,0.65)" font-weight="700">${lsPct}%</text>
    </svg>`;
  }

  $: (() => {
    if (!matches || matches.length === 0) return;

    let totHS = 0, totBS = 0, totLS = 0, totShots = 0;
    const roleStats = {};

    matches.forEach(match => {
      const me = findMe(match);
      if (!me) return;
      const s = me.stats || {};
      totHS += s.headshots || 0;
      totBS += s.bodyshots || 0;
      totLS += s.legshots || 0;
      totShots += (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);

      const agentName = me.character || 'Unknown';
      const role = getRoleClass(agentName);
      const myTeamId = (me.team || '').toLowerCase();
      const myTeam = match.teams?.[myTeamId];
      const oppTeam = match.teams?.[myTeamId === 'red' ? 'blue' : 'red'];
      let won = false;
      if (myTeam?.has_won === true) won = true;
      else if (myTeam?.rounds_won != null && oppTeam?.rounds_won != null)
        won = myTeam.rounds_won > oppTeam.rounds_won;

      if (!roleStats[role]) roleStats[role] = { m: 0, w: 0, k: 0, d: 0, a: 0 };
      const r = roleStats[role];
      r.m++; if (won) r.w++;
      r.k += s.kills || 0; r.d += s.deaths || 0; r.a += s.assists || 0;
    });

    accData = { totHS, totBS, totLS, totShots };
    roleData = roleStats;
  })();

  let accData = { totHS: 0, totBS: 0, totLS: 0, totShots: 0 };
  let roleData = {};

  $: hsPct = accData.totShots ? Math.round(accData.totHS / accData.totShots * 100) : 0;
  $: bsPct = accData.totShots ? Math.round(accData.totBS / accData.totShots * 100) : 0;
  $: lsPct = accData.totShots ? Math.round(accData.totLS / accData.totShots * 100) : 0;

  const roleConfig = {
    duelist:    { icon: '⚔️', color: '#ff7b7b', label: 'Duelist' },
    initiator:  { icon: '🔍', color: '#f5a623', label: 'Initiator' },
    controller: { icon: '💨', color: 'var(--win)', label: 'Controller' },
    sentinel:   { icon: '🛡️', color: '#7ab8ff', label: 'Sentinel' },
  };

  $: roleEntries = Object.entries(roleData).filter(([, v]) => v.m > 0).sort((a, b) => b[1].m - a[1].m);
</script>

<div class="accuracy-roles-wrap">
  <!-- Accuracy Card -->
  <div class="card acc-card visible" style="animation-delay:0ms;">
    <div class="card-accent-line"></div>
    <div class="card-label">Shot Accuracy</div>
    <div class="acc-body-row">
      {#if accData.totShots > 0}
        {@html buildAccuracyBodySvg(hsPct, bsPct, lsPct)}
        <div class="acc-bars">
          {#each [['HEAD', accData.totHS, hsPct, hsPct >= 25 ? 'var(--win)' : hsPct >= 15 ? 'var(--accent)' : 'var(--loss)'],
                  ['BODY', accData.totBS, bsPct, 'rgba(255,255,255,0.5)'],
                  ['LEGS', accData.totLS, lsPct, 'var(--loss)']] as [lbl, hits, pct, col]}
            <div class="acc-row">
              <span class="acc-lbl">{lbl}</span>
              <div class="acc-track"><div class="acc-fill" style="width:{pct}%;background:{col};"></div></div>
              <span class="acc-pct" style="color:{col}">{pct}%</span>
              <span class="acc-hits">{hits.toLocaleString()} hits</span>
            </div>
          {/each}
          <div class="acc-total-row">
            <span>AVG HS%</span>
            <span class="acc-total-val" style="color:{hsPct >= 25 ? 'var(--win)' : hsPct >= 15 ? 'var(--accent)' : 'var(--loss)'}">{hsPct}%</span>
          </div>
        </div>
      {:else}
        <div class="placeholder-txt">Fetch stats to see accuracy</div>
      {/if}
    </div>
  </div>

  <!-- Roles Card -->
  <div class="card roles-card visible" style="animation-delay:60ms;">
    <div class="card-accent-line"></div>
    <div class="card-label">Performance by Role</div>
    <div class="roles-wrap">
      {#if roleEntries.length > 0}
        {#each roleEntries as [role, v]}
          {@const cfg = roleConfig[role] || { icon: '🎮', color: 'var(--muted)', label: role }}
          {@const wr = Math.round(v.w / v.m * 100)}
          {@const kda = v.d ? ((v.k + v.a * 0.5) / v.d).toFixed(2) : v.k.toFixed(2)}
          {@const wrCol = wr >= 55 ? 'var(--win)' : wr <= 44 ? 'var(--loss)' : 'var(--accent)'}
          <div class="role-row">
            <div class="role-icon-wrap" style="background:{cfg.color}22;border:1px solid {cfg.color}33;">
              <span style="font-size:17px">{cfg.icon}</span>
            </div>
            <div class="role-name-col">
              <div class="role-title" style="color:{cfg.color}">{cfg.label}</div>
              <div class="role-wl">{v.w}W · {v.m - v.w}L · {v.m} games</div>
            </div>
            <div class="role-stat">
              <div class="role-wr" style="color:{wrCol}">{wr}%</div>
              <div class="role-stat-label">WR</div>
            </div>
            <div class="role-stat">
              <div class="role-kda">{kda}</div>
              <div class="role-stat-label">KDA</div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="placeholder-txt">Fetch stats to see role breakdown</div>
      {/if}
    </div>
  </div>
</div>

<style>
</style>

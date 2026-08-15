<script>
  import { tick } from 'svelte';
  import { getAgentIconUrl, getAgentPortraitUrl } from '../../lib/assets';
  import { getRankImgUrl } from '../../lib/constants';
  import { AGENT_ROLES } from '../../lib/constants';

  export let open = false;
  export let stats = null;
  export let mmrData = null;
  export let accountData = null;
  export let mmrHistory = {};
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let mode = 'competitive';
  export let onClose = () => {};

  let loading = false;
  let loaded = false;
  let loadingTxt = 'GENERATING STATS CARD...';
  let loadingPct = 0;
  let imgPreview = '';
  let copyFeedback = false;
  let copyFeedbackMsg = '';

  // ─── Themes ────────────────────────────────────────────────────────────────
  const FLEX_THEMES = [
    {
      id: 'champions',
      name: 'VCT Champions',
      badge: '🏆 CHAMPIONS',
      accent: '#ffd700',
      accentHex: 'ffd700',
      accentShadow: 'rgba(255, 215, 0, 0.4)',
      accentShadowLight: 'rgba(255, 215, 0, 0.15)',
      border: 'rgba(255, 215, 0, 0.45)',
      bgGradient: 'radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.18) 0%, rgba(18, 14, 4, 0.97) 65%, rgba(8, 6, 2, 0.99) 100%)',
      cardBg: '#090805',
      pillGrad: 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,215,0,0.08))',
    },
    {
      id: 'obsidian',
      name: 'Obsidian Valor',
      badge: '🔥 OBSIDIAN',
      accent: '#fa4454',
      accentHex: 'fa4454',
      accentShadow: 'rgba(250, 68, 84, 0.4)',
      accentShadowLight: 'rgba(250, 68, 84, 0.14)',
      border: 'rgba(250, 68, 84, 0.45)',
      bgGradient: 'radial-gradient(circle at 20% 30%, rgba(250, 68, 84, 0.15) 0%, rgba(10, 10, 15, 0.96) 65%, rgba(4, 4, 6, 0.99) 100%)',
      cardBg: '#050508',
      pillGrad: 'linear-gradient(135deg, rgba(250,68,84,0.25), rgba(250,68,84,0.08))',
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      badge: '⚡ CYBERPUNK',
      accent: '#00f3ff',
      accentHex: '00f3ff',
      accentShadow: 'rgba(0, 243, 255, 0.4)',
      accentShadowLight: 'rgba(0, 243, 255, 0.12)',
      border: 'rgba(0, 243, 255, 0.45)',
      bgGradient: 'radial-gradient(circle at 80% 20%, rgba(255, 0, 85, 0.1) 0%, rgba(0, 243, 255, 0.08) 40%, rgba(6, 12, 24, 0.97) 70%, rgba(3, 6, 14, 0.99) 100%)',
      cardBg: '#040810',
      pillGrad: 'linear-gradient(135deg, rgba(0,243,255,0.22), rgba(0,243,255,0.06))',
    },
    {
      id: 'icebox',
      name: 'Icebox Frost',
      badge: '❄️ FROST',
      accent: '#38bdf8',
      accentHex: '38bdf8',
      accentShadow: 'rgba(56, 189, 248, 0.4)',
      accentShadowLight: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.45)',
      bgGradient: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.18) 0%, rgba(10, 20, 30, 0.96) 65%, rgba(4, 8, 15, 0.99) 100%)',
      cardBg: '#060c14',
      pillGrad: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(56,189,248,0.06))',
    },
    {
      id: 'sovereign',
      name: 'Sovereign',
      badge: '☯️ SOVEREIGN',
      accent: '#e2e8f0',
      accentHex: 'e2e8f0',
      accentShadow: 'rgba(226, 232, 240, 0.3)',
      accentShadowLight: 'rgba(226, 232, 240, 0.08)',
      border: 'rgba(226, 232, 240, 0.28)',
      bgGradient: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.07) 0%, rgba(15, 15, 18, 0.98) 65%, rgba(8, 8, 10, 0.99) 100%)',
      cardBg: '#09090b',
      pillGrad: 'linear-gradient(135deg, rgba(226,232,240,0.18), rgba(226,232,240,0.05))',
    }
  ];

  let selectedThemeId = 'champions';
  $: activeTheme = FLEX_THEMES.find(t => t.id === selectedThemeId) || FLEX_THEMES[0];

  // 3D Tilt
  let rotateX = 0;
  let rotateY = 0;
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
  }
  function handleMouseLeave() { rotateX = 0; rotateY = 0; }

  $: if (open) generateCard();

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function getRankName() { return mmrData?.current?.tier?.name || 'Unranked'; }
  function getRRText() { const rr = mmrData?.current?.rr; return rr != null ? `${rr} RR` : ''; }
  function getPeakName() { return mmrData?.peak?.tier?.name || ''; }

  function getTopAgents(n = 3) {
    if (!stats?.agentMap) return [];
    return Object.entries(stats.agentMap)
      .sort((a, b) => b[1].matches - a[1].matches)
      .slice(0, n)
      .map(([name, d]) => ({ name, matches: d.matches, wins: d.wins || 0 }));
  }

  function getAgentRole(agentName) {
    const key = (agentName || '').toLowerCase();
    return AGENT_ROLES[key] || null;
  }

  const ROLE_COLORS = {
    duelist: { color: '#fa4454', bg: 'rgba(250,68,84,0.18)', label: 'DUELIST' },
    sentinel: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.18)', label: 'SENTINEL' },
    initiator: { color: '#e8ff47', bg: 'rgba(232,255,71,0.18)', label: 'INITIATOR' },
    controller: { color: '#38bdf8', bg: 'rgba(56,189,248,0.18)', label: 'CONTROLLER' },
  };

  // Build SVG sparkline from mmrHistory
  function buildSparklineSvg(formMatches, width = 240, height = 36) {
    const changes = formMatches.map(m => {
      const rr = mmrHistory[m.matchId];
      return rr !== undefined ? rr : (m.won ? 20 : -12);
    });
    if (changes.length < 2) return '';

    // Cumulative RR
    const cumulative = [];
    let acc = 0;
    changes.forEach(c => { acc += c; cumulative.push(acc); });
    const min = Math.min(...cumulative);
    const max = Math.max(...cumulative);
    const range = max - min || 1;
    const pad = 4;
    const pts = cumulative.map((v, i) => {
      const x = pad + (i / (cumulative.length - 1)) * (width - pad * 2);
      const y = pad + ((max - v) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const polyline = pts.join(' ');
    const lastChange = changes[changes.length - 1] || 0;
    const lineColor = lastChange >= 0 ? '#3ecf8e' : '#ff5757';

    // Gradient fill
    const first = pts[0].split(',');
    const last = pts[pts.length - 1].split(',');
    const fillPts = `${polyline} ${last[0]},${height} ${first[0]},${height}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points="${fillPts}" fill="url(#sg)" />
      <polyline points="${polyline}" fill="none" stroke="${lineColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${lineColor}" />
    </svg>`;
  }

  async function selectTheme(themeId) {
    if (selectedThemeId === themeId) return;
    selectedThemeId = themeId;
    activeTheme = FLEX_THEMES.find(t => t.id === themeId) || FLEX_THEMES[0];
    await tick();
    await generateCard();
  }

  // ─── Card Generator ────────────────────────────────────────────────────────
  async function generateCard() {
    if (!open || !stats) return;
    loading = true;
    loaded = false;
    loadingPct = 0;
    loadingTxt = 'COMPILING PROFILE FLEX CARD...';

    const matches = stats.recentMatches || [];
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const total = wins + losses;
    const wr = total ? Math.round((wins / total) * 100) : 0;
    const kd = parseFloat(stats.kd || '0').toFixed(2);
    const totalK = matches.reduce((s, m) => s + (m.kills || 0), 0);
    const totalD = matches.reduce((s, m) => s + (m.deaths || 0), 0);
    const avgACS = stats.avgACS || 0;
    const avgHS = stats.hsRate || 0;
    const avgADR = stats.avgADR || Math.round(avgACS * 0.72);
    const rankName = getRankName();
    const rrTxt = getRRText();
    const regionUpper = (region || 'ap').toUpperCase();
    const modeName = mode === 'competitive' ? 'Competitive' : (mode || 'competitive').toUpperCase();
    const peakName = getPeakName();
    const bannerUrl = accountData?.card?.wide || accountData?.card?.large || '';
    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    loadingPct = 25;

    const topAgents = getTopAgents(3);
    const topAgentName = topAgents[0]?.name || '—';
    const topAgentPortrait = getAgentPortraitUrl(topAgentName) || getAgentIconUrl(topAgentName) || '';

    const formMatches = matches.slice(0, 10);
    const sparklineSvg = buildSparklineSvg(formMatches);

    const rImg = getRankImgUrl(rankName);
    const peakImg = getRankImgUrl(peakName);

    // Progress bar pct helpers (clamped 0–100)
    const wrPct = Math.min(100, wr);
    const kdPct = Math.min(100, Math.round((parseFloat(kd) / 3.0) * 100));
    const hsPct = Math.min(100, Math.round((avgHS / 35) * 100));
    const adrPct = Math.min(100, Math.round((avgADR / 200) * 100));
    const acsPct = Math.min(100, Math.round((avgACS / 300) * 100));

    // Agent bento cards
    const agentBentos = topAgents.map(ag => {
      const agIcon = getAgentIconUrl(ag.name);
      const agWr = ag.matches ? Math.round((ag.wins / ag.matches) * 100) : 0;
      const wrColor = agWr >= 55 ? '#3ecf8e' : agWr >= 45 ? '#ffb01f' : '#ff5757';
      const role = getAgentRole(ag.name);
      const roleStyle = role && ROLE_COLORS[role] ? ROLE_COLORS[role] : null;
      const agWrPct = Math.min(100, agWr);

      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; padding:10px 8px 10px; background:rgba(12,12,18,0.85); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; border-radius:12px; box-sizing:border-box; position:relative; overflow:hidden;">
          <div style="position:absolute; inset:0; background:${activeTheme.pillGrad}; pointer-events:none; border-radius:12px; opacity:0.5;"></div>
          ${agIcon ? `<img src="${agIcon}" crossorigin="anonymous" style="width:52px; height:52px; border-radius:50%; border:2px solid ${activeTheme.accent}; box-shadow:0 0 14px ${activeTheme.accentShadow}; position:relative; z-index:1; object-fit:cover;" />` : `<div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.05);position:relative;z-index:1;"></div>`}
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.3px; text-align:center; position:relative; z-index:1; line-height:1;">${ag.name}</div>
          ${roleStyle ? `<div style="font-family:'DM Mono',monospace; font-size:7.5px; font-weight:700; color:${roleStyle.color}; background:${roleStyle.bg}; padding:2px 7px; border-radius:10px; letter-spacing:0.8px; position:relative; z-index:1;">${roleStyle.label}</div>` : ''}
          <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.5); text-align:center; position:relative; z-index:1; line-height:1;">${ag.matches} MATCHES</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; color:${wrColor}; text-align:center; position:relative; z-index:1; line-height:1;">${agWr}% <span style="font-size:10px; font-weight:600; color:rgba(255,255,255,0.4);">WR</span></div>
          <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden; position:relative; z-index:1;">
            <div style="height:100%; width:${agWrPct}%; background:linear-gradient(90deg, ${activeTheme.accent}cc, ${activeTheme.accent}); border-radius:4px; box-shadow:0 0 6px ${activeTheme.accentShadow};"></div>
          </div>
        </div>`;
    }).join('');

    // Recent form tiles
    const recentFormHtml = formMatches.map(m => {
      const isWin = m.won;
      const aIcon = getAgentIconUrl(m.agentName);
      const rr = mmrHistory[m.matchId];
      const rrDisplay = rr !== undefined ? (rr > 0 ? `+${rr}` : `${rr}`) : '';
      const rrColor = rr >= 0 ? '#3ecf8e' : '#ff5757';
      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; padding:5px 3px; background:${isWin ? 'rgba(62,207,142,0.07)' : 'rgba(255,87,87,0.06)'}; border:1px solid ${isWin ? 'rgba(62,207,142,0.3)' : 'rgba(255,87,87,0.22)'}; border-top:2px solid ${isWin ? '#3ecf8e' : '#ff5757'}; border-radius:8px; box-sizing:border-box;">
          <span style="font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:900; color:${isWin ? '#3ecf8e' : '#ff5757'}; line-height:1;">${isWin ? 'W' : 'L'}</span>
          ${aIcon ? `<img src="${aIcon}" crossorigin="anonymous" style="width:22px; height:22px; border-radius:50%; border:1px solid rgba(255,255,255,0.18); object-fit:cover;">` : `<div style="width:22px;height:22px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>`}
          ${rrDisplay ? `<span style="font-family:'DM Mono',monospace; font-size:8.5px; font-weight:700; color:${rrColor}; line-height:1;">${rrDisplay}</span>` : `<span style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.2); line-height:1;">—</span>`}
        </div>`;
    }).join('');

    loadingPct = 60;

    // ─── Build the capture HTML (1200×630) ─────────────────────────────────
    document.getElementById('export-profile-capture').innerHTML = `
      <div id="profile-capture-target" style="width:1200px; height:630px; padding:32px 36px 28px; background:${activeTheme.cardBg}; border:1.5px solid ${activeTheme.border}; border-radius:24px; color:#fff; font-family:'Barlow Condensed',sans-serif; box-sizing:border-box; position:relative; overflow:hidden; display:flex; flex-direction:column; gap:0;">

        <!-- Scan-line texture -->
        <div style="position:absolute; inset:0; background:repeating-linear-gradient(0deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 4px); pointer-events:none; z-index:0; border-radius:24px;"></div>

        <!-- Player banner background -->
        ${bannerUrl ? `<img src="${bannerUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.18; filter:blur(2px) saturate(1.2); pointer-events:none; z-index:0; border-radius:24px;">` : ''}

        <!-- Radial theme gradient overlay -->
        <div style="position:absolute; inset:0; background:${activeTheme.bgGradient}; z-index:1; pointer-events:none; border-radius:24px;"></div>

        <!-- Left accent bar -->
        <div style="position:absolute; left:0; top:0; bottom:0; width:6px; background:${activeTheme.accent}; border-radius:24px 0 0 24px; z-index:4; box-shadow:4px 0 24px ${activeTheme.accentShadow};"></div>

        <!-- Diagonal VALTRACKER watermark -->
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-12deg); font-family:'Barlow Condensed',sans-serif; font-size:148px; font-weight:900; color:rgba(255,255,255,0.028); white-space:nowrap; pointer-events:none; z-index:2; letter-spacing:4px; user-select:none;">VALTRACKER</div>

        <!-- Agent portrait silhouette (right side) -->
        ${topAgentPortrait ? `<img src="${topAgentPortrait}" crossorigin="anonymous" style="position:absolute; right:-20px; bottom:-30px; height:108%; object-fit:contain; opacity:0.2; filter:drop-shadow(0 0 24px ${activeTheme.accentShadow}); pointer-events:none; z-index:2;" />` : ''}

        <!-- Content -->
        <div style="position:relative; z-index:3; display:flex; flex-direction:column; height:100%; gap:0;">

          <!-- ── HEADER ROW ──────────────────────────────────────────────── -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:16px;">

            <!-- Left: Logo + Player identity -->
            <div style="display:flex; align-items:center; gap:16px;">
              <img src="/logo.png" style="height:28px; width:auto; filter:drop-shadow(0 0 10px ${activeTheme.accentShadow}); display:block;" alt="ValTracker" />
              <div style="width:1px; height:36px; background:rgba(255,255,255,0.1);"></div>
              <div>
                <div style="display:flex; align-items:baseline; gap:8px;">
                  <span style="font-size:32px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; color:#fff; line-height:1;">${playerName}</span>
                  <span style="font-family:'DM Mono',monospace; font-size:16px; color:${activeTheme.accent}; font-weight:700; text-shadow:0 0 12px ${activeTheme.accentShadow};">#${playerTag}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:5px;">
                  <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.5); text-transform:uppercase; border:1px solid ${activeTheme.border}; padding:2px 8px; border-radius:20px; line-height:1; background:${activeTheme.accentShadowLight};">${regionUpper} SERVER</span>
                  <span style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.5); text-transform:uppercase; border:1px solid rgba(255,255,255,0.12); padding:2px 8px; border-radius:20px; line-height:1;">${modeName}</span>
                </div>
              </div>
            </div>

            <!-- Right: Rank capsule -->
            <div style="display:flex; align-items:center; gap:12px; background:rgba(10,10,16,0.8); border:1px solid ${activeTheme.border}; padding:8px 18px 8px 12px; border-radius:40px; box-shadow:0 0 20px ${activeTheme.accentShadow}, inset 0 1px 0 rgba(255,255,255,0.06);">
              ${rImg ? `<img src="${rImg}" crossorigin="anonymous" style="width:46px; height:46px; object-fit:contain; filter:drop-shadow(0 0 8px ${activeTheme.accentShadow});">` : `<div style="font-size:26px;">🏆</div>`}
              <div style="text-align:left;">
                <div style="font-size:20px; font-weight:900; text-transform:uppercase; color:#fff; line-height:1.1; letter-spacing:0.3px;">${rankName}</div>
                <div style="font-family:'DM Mono',monospace; font-size:10px; font-weight:700; margin-top:3px; display:flex; align-items:center; gap:8px;">
                  ${rrTxt ? `<span style="color:${activeTheme.accent};">${rrTxt}</span>` : ''}
                  ${peakName ? `<span style="color:rgba(255,255,255,0.35); font-size:9px;">│ PEAK: ${peakName}</span>` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- ── STAT MATRIX (5 tiles) ───────────────────────────────────── -->
          <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:14px;">

            <!-- K/D Ratio -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; padding:14px 12px 10px; border-radius:14px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${activeTheme.accentShadowLight};">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; line-height:1;">K / D Ratio</div>
              <div style="font-size:36px; font-weight:900; color:${parseFloat(kd) >= 1.3 ? '#3ecf8e' : parseFloat(kd) >= 0.9 ? '#ffb01f' : '#fa4454'}; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${kd}</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3); line-height:1;">${totalK}K / ${totalD}D</div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${kdPct}%; background:linear-gradient(90deg, ${activeTheme.accent}99, ${activeTheme.accent}); border-radius:4px;"></div>
              </div>
            </div>

            <!-- Win Rate -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; padding:14px 12px 10px; border-radius:14px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${activeTheme.accentShadowLight};">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; line-height:1;">Win Rate</div>
              <div style="font-size:36px; font-weight:900; color:${wr >= 55 ? '#3ecf8e' : wr >= 48 ? '#ffb01f' : '#fa4454'}; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${wr}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3); line-height:1;">${wins}W · ${losses}L</div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${wrPct}%; background:linear-gradient(90deg, ${activeTheme.accent}99, ${activeTheme.accent}); border-radius:4px;"></div>
              </div>
            </div>

            <!-- AVG ACS -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; padding:14px 12px 10px; border-radius:14px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${activeTheme.accentShadowLight};">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; line-height:1;">AVG ACS</div>
              <div style="font-size:36px; font-weight:900; color:${avgACS >= 240 ? '#ffd700' : avgACS >= 180 ? '#ffffff' : '#fa4454'}; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${avgACS}</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3); line-height:1;">COMBAT SCORE</div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${acsPct}%; background:linear-gradient(90deg, ${activeTheme.accent}99, ${activeTheme.accent}); border-radius:4px;"></div>
              </div>
            </div>

            <!-- Headshot % -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; padding:14px 12px 10px; border-radius:14px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${activeTheme.accentShadowLight};">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; line-height:1;">Headshot %</div>
              <div style="font-size:36px; font-weight:900; color:${avgHS >= 25 ? '#3ecf8e' : avgHS >= 16 ? '#ffb01f' : '#fa4454'}; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${avgHS}%</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3); line-height:1;">ACCURACY</div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${hsPct}%; background:linear-gradient(90deg, ${activeTheme.accent}99, ${activeTheme.accent}); border-radius:4px;"></div>
              </div>
            </div>

            <!-- ADR -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; border-top:2px solid ${activeTheme.accent}; padding:14px 12px 10px; border-radius:14px; text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:6px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px ${activeTheme.accentShadowLight};">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; line-height:1;">Avg ADR</div>
              <div style="font-size:36px; font-weight:900; color:${avgADR >= 150 ? '#3ecf8e' : avgADR >= 110 ? '#ffffff' : '#fa4454'}; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${avgADR}</div>
              <div style="font-family:'DM Mono',monospace; font-size:8px; color:rgba(255,255,255,0.3); line-height:1;">DMG / ROUND</div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${adrPct}%; background:linear-gradient(90deg, ${activeTheme.accent}99, ${activeTheme.accent}); border-radius:4px;"></div>
              </div>
            </div>
          </div>

          <!-- ── BOTTOM ROW: Agent Bentos + Recent Form + Sparkline ─────── -->
          <div style="display:grid; grid-template-columns:auto 1fr; gap:14px; flex:1; min-height:0;">

            <!-- Agent bento cards -->
            <div style="display:flex; flex-direction:column; gap:0;">
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:${activeTheme.accent}; letter-spacing:1.4px; text-transform:uppercase; font-weight:700; margin-bottom:8px;">MOST PLAYED</div>
              <div style="display:flex; gap:10px; flex:1; align-items:stretch;">
                ${agentBentos}
              </div>
            </div>

            <!-- Recent form + sparkline -->
            <div style="background:rgba(10,10,16,0.82); border:1px solid ${activeTheme.border}; padding:14px 16px 10px; border-radius:14px; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-family:'DM Mono',monospace; font-size:9px; color:${activeTheme.accent}; letter-spacing:1.2px; text-transform:uppercase; font-weight:700;">RECENT FORM · LAST ${formMatches.length} MATCHES</div>
                ${sparklineSvg ? `<div style="display:flex; align-items:center;">${sparklineSvg}</div>` : ''}
              </div>
              <div style="display:flex; gap:6px; justify-content:flex-start; flex:1; align-items:stretch;">
                ${recentFormHtml}
              </div>
            </div>
          </div>

          <!-- ── FOOTER ───────────────────────────────────────────────────── -->
          <div style="display:flex; justify-content:space-between; align-items:center; font-family:'DM Mono',monospace; font-size:9px; color:rgba(255,255,255,0.35); margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; align-items:center; gap:7px; line-height:1;">
              <img src="/logo.png" style="height:13px; width:auto; display:block; opacity:0.7;" alt="" />
              <span>Generated by ValTracker.gg · ${now}</span>
            </div>
            <div style="color:${activeTheme.accent}; font-weight:bold; letter-spacing:1px; line-height:1; text-shadow:0 0 10px ${activeTheme.accentShadow};">TRACK. ANALYZE. CONQUER.</div>
          </div>

        </div>
      </div>
    `;

    await tick();
    loadingPct = 75;

    setTimeout(async () => {
      try {
        if (typeof html2canvas === 'undefined') {
          loadingTxt = 'LOADING ENGINE...';
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        const el = document.getElementById('profile-capture-target');
        if (!el) { loading = false; return; }

        const canvas = await html2canvas(el, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
          width: 1200,
          height: 630
        });

        imgPreview = canvas.toDataURL('image/png');
        loadingPct = 100;
        loading = false;
        loaded = true;
      } catch (e) {
        console.error('[Profile Card Capture Error]', e);
        loadingTxt = 'FAILED TO COMPILE. TRY AGAIN.';
        loading = false;
      }
    }, 120);
  }

  async function copyImageToClipboard() {
    try {
      const el = document.getElementById('profile-capture-target');
      if (!el || typeof html2canvas === 'undefined') return;
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2.0, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copyFeedbackMsg = '✨ HD Image copied! Paste into Discord / X.';
          copyFeedback = true;
          setTimeout(() => { copyFeedback = false; }, 4000);
        }
      }, 'image/png');
    } catch (e) {
      copyFeedbackMsg = '⚠️ Clipboard blocked. Use Download instead.';
      copyFeedback = true;
      setTimeout(() => { copyFeedback = false; }, 4000);
    }
  }

  function downloadCard() {
    if (!imgPreview) return;
    const a = document.createElement('a');
    a.href = imgPreview;
    a.download = `valtracker_${activeTheme.id}_stats_${playerName}_${Date.now()}.png`;
    a.click();
  }

  function shareToTwitter() {
    const text = `📊 Check out my VALORANT stats on ValTracker.gg!\n\n${playerName}#${playerTag} · ${getRankName()}\nK/D: ${stats?.kd || '—'} | WR: ${stats && (stats.wins + stats.losses) ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : '—'}% | ACS: ${stats?.avgACS || '—'}\n\n#VALORANT @ValTracker`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }
</script>

<!-- Off-screen capture target -->
<div id="export-profile-capture" style="position:absolute; left:-9999px; top:0;"></div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="epc-overlay" class:open={open} on:click|self={onClose}>
  <div class="epc-modal">

    <!-- Header -->
    <div class="epc-header" style="background: linear-gradient(135deg, {activeTheme.accentShadowLight} 0%, rgba(0,0,0,0) 100%);">
      <div class="epc-title">
        <img src="/logo.png" style="height:22px; width:auto;" alt="Logo" />
        Export Profile Flex Card
      </div>
      <button class="epc-close" on:click={onClose}>&#10005;</button>
    </div>

    <!-- Top accent bar (theme color) -->
    <div class="epc-accent-bar" style="background: linear-gradient(90deg, {activeTheme.accent}, {activeTheme.accent}44);"></div>

    <div class="epc-body">

      <!-- Theme pills -->
      <div class="epc-section">
        <div class="epc-label">SELECT THEME</div>
        <div class="epc-pills">
          {#each FLEX_THEMES as theme}
            <button
              class="epc-pill"
              class:active={selectedThemeId === theme.id}
              style="--t-accent:{theme.accent}; --t-border:{theme.border}; --t-glow:{theme.accentShadow}; --t-grad:{theme.pillGrad}"
              on:click={() => selectTheme(theme.id)}
            >
              <span class="epc-pill-swatch" style="background:{theme.pillGrad}; border:1px solid {theme.border};"></span>
              {theme.name}
            </button>
          {/each}
        </div>
      </div>

      <!-- Loading state -->
      {#if loading}
        <div class="epc-loading">
          <div class="epc-loading-bar">
            <div class="epc-loading-fill" style="width:{loadingPct}%; background:linear-gradient(90deg, {activeTheme.accent}cc, {activeTheme.accent}); box-shadow:0 0 12px {activeTheme.accentShadow};"></div>
          </div>
          <div class="epc-loading-txt" style="color:{activeTheme.accent};">{loadingTxt}</div>
        </div>
      {/if}

      <!-- Loaded state -->
      {#if loaded}
        <div class="epc-loaded">
          <!-- 3D Tilt preview -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="epc-preview-wrap"
            style="border-color:{activeTheme.border}; box-shadow:0 16px 50px rgba(0,0,0,0.8), 0 0 40px {activeTheme.accentShadowLight}; transform:perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg);"
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseLeave}
          >
            <img class="epc-preview-img" src={imgPreview} alt="Profile Card Preview" />
            <div class="epc-preview-badge" style="border-color:{activeTheme.accent}55; color:{activeTheme.accent};">
              {activeTheme.badge} · 3D PREVIEW
            </div>
          </div>

          {#if copyFeedback}
            <div class="epc-clip-status" class:warning={copyFeedbackMsg.includes('⚠️')}>
              {copyFeedbackMsg}
            </div>
          {/if}

          <!-- Action buttons -->
          <div class="epc-actions">
            <button
              class="epc-btn epc-btn-copy"
              style="background:linear-gradient(135deg, {activeTheme.accent}, {activeTheme.accent}cc); box-shadow:0 4px 22px {activeTheme.accentShadow}; color:{activeTheme.id === 'sovereign' || activeTheme.id === 'champions' ? '#000' : '#fff'};"
              on:click={copyImageToClipboard}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Copy Image
            </button>
            <button class="epc-btn epc-btn-download" on:click={downloadCard}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download HD
            </button>
            <button class="epc-btn epc-btn-twitter" on:click={shareToTwitter}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post on X
            </button>
            <button class="epc-btn epc-btn-discord" on:click={copyImageToClipboard}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Copy for Discord
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .epc-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .epc-overlay.open { display: flex; }

  .epc-modal {
    max-width: 820px;
    width: 96%;
    background: rgba(8, 8, 14, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .epc-accent-bar {
    height: 2px;
    width: 100%;
  }

  .epc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    transition: background 0.3s ease;
  }

  .epc-title {
    color: #fff;
    font-size: 18px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .epc-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.45);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .epc-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .epc-body {
    padding: 20px 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: 82vh;
    overflow-y: auto;
  }

  .epc-section { display: flex; flex-direction: column; gap: 9px; }

  .epc-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 1.2px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .epc-pills { display: flex; flex-wrap: wrap; gap: 7px; }

  .epc-pill {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.65);
    padding: 6px 14px 6px 8px;
    border-radius: 30px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.22s ease;
    letter-spacing: 0.3px;
  }
  .epc-pill:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
    border-color: var(--t-border);
  }
  .epc-pill.active {
    background: rgba(255,255,255,0.1);
    border-color: var(--t-border);
    color: #fff;
    box-shadow: 0 0 14px var(--t-glow), inset 0 0 0 1px var(--t-border);
  }

  .epc-pill-swatch {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  /* Loading */
  .epc-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 14px;
  }
  .epc-loading-bar {
    width: 220px;
    height: 5px;
    background: rgba(255,255,255,0.07);
    border-radius: 4px;
    overflow: hidden;
    transform: skewX(-10deg);
  }
  .epc-loading-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease;
    background: repeating-linear-gradient(90deg, currentColor 0px, currentColor 6px, transparent 6px, transparent 9px);
  }
  .epc-loading-txt {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    animation: epc-pulse 1.4s ease-in-out infinite;
  }
  @keyframes epc-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

  /* Loaded */
  .epc-loaded { display: flex; flex-direction: column; gap: 16px; }

  .epc-preview-wrap {
    position: relative;
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.5);
    transition: transform 0.15s ease-out, box-shadow 0.3s ease;
    transform-style: preserve-3d;
    cursor: grab;
  }
  .epc-preview-img { width: 100%; height: auto; display: block; }

  .epc-preview-badge {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(8px);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    border: 1px solid;
  }

  .epc-clip-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
    background: rgba(62, 207, 142, 0.1);
    border: 1px solid rgba(62, 207, 142, 0.3);
    padding: 8px 14px;
    border-radius: 8px;
  }
  .epc-clip-status.warning {
    color: #ff5757;
    background: rgba(255, 87, 87, 0.1);
    border-color: rgba(255, 87, 87, 0.3);
  }

  /* Action buttons */
  .epc-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .epc-btn {
    border: none;
    border-radius: 10px;
    padding: 12px 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: all 0.22s ease;
  }
  .epc-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
  .epc-btn:active { transform: translateY(0px); }

  /* Copy button style comes from inline (theme-reactive) */
  .epc-btn-copy { font-weight: 900; }

  .epc-btn-download {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    color: #fff;
  }
  .epc-btn-download:hover { background: rgba(255,255,255,0.1); }

  .epc-btn-twitter { background: #1d9bf0; color: #fff; }

  .epc-btn-discord { background: #5865f2; color: #fff; }
</style>

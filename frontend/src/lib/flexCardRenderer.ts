// ValTracker — Flex Card 2.0 Native Canvas 2D Engine

export interface FlexCardData {
  playerName: string;
  playerTag: string;
  playerLevel: string;
  playerBannerUrl?: string;
  agentName: string;
  agentIconUrl?: string;
  agentPortraitUrl?: string;
  mapName: string;
  mapImgUrl?: string;
  won: boolean;
  score: string;
  gameDate?: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  acs: number;
  hsPct: number;
  adr: number;
  fkFdDiff: string;
  combatRating: string;
  perfGrade: string;
  coolTitle: string;
  customHeadline?: string;
  isMatchMVP: boolean;
  isTeamMVP: boolean;
  userRank: string;
  userRankImgUrl?: string;
  lobbyRank: string;
  lobbyRankImgUrl?: string;
  rounds: Array<{ won: boolean; isClutch?: boolean }>;
  feats: {
    aces: number;
    clutches: number;
    quads: number;
    triples: number;
    doubles: number;
  };
  alliedPlayers: Array<{ name: string; tag?: string; iconUrl?: string; kda: string; acs: number; isMe?: boolean }>;
  enemyPlayers: Array<{ name: string; tag?: string; iconUrl?: string; kda: string; acs: number }>;
}

export interface FlexCardTheme {
  id: string;
  name: string;
  badge: string;
  accent: string;
  accentShadow: string;
  border: string;
  bgGradStart: string;
  bgGradEnd: string;
  cardBg: string;
  titleBgStart: string;
  titleColor: string;
  titleBorder: string;
}

const IMAGE_CACHE: Record<string, HTMLImageElement> = {};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  if (IMAGE_CACHE[src]) return Promise.resolve(IMAGE_CACHE[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      IMAGE_CACHE[src] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderFlexCardToCanvas(
  canvas: HTMLCanvasElement,
  data: FlexCardData,
  theme: FlexCardTheme,
  options = { showScoreboard: true, showTimeline: true, showFeats: true }
): Promise<void> {
  const width = 960;
  const height = 540;
  const scale = 2; // 2x Retina Resolution (1920x1080 internal)

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, width, height);

  // Preload all assets in parallel
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';
  const [
    logoImg,
    mapImg,
    agentPortraitImg,
    agentIconImg,
    userRankImg,
    lobbyRankImg,
    playerBannerImg,
    ...alliedIcons
  ] = await Promise.all([
    loadImage(logoUrl),
    loadImage(data.mapImgUrl || ''),
    loadImage(data.agentPortraitUrl || ''),
    loadImage(data.agentIconUrl || ''),
    loadImage(data.userRankImgUrl || ''),
    loadImage(data.lobbyRankImgUrl || ''),
    loadImage(data.playerBannerUrl || ''),
    ...data.alliedPlayers.map(p => loadImage(p.iconUrl || '')),
    ...data.enemyPlayers.map(p => loadImage(p.iconUrl || ''))
  ]);

  const enemyIcons = alliedIcons.slice(data.alliedPlayers.length);

  // --- 1. OUTER CONTAINER BACKGROUND ---
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, width, height, 22);
  else ctx.rect(0, 0, width, height);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();

  // Border Stroke
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  // Map Splash Layer
  if (mapImg) {
    ctx.globalAlpha = 0.18;
    ctx.drawImage(mapImg, 0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }

  // Radial Theme Overlay
  const bgGrad = ctx.createRadialGradient(width * 0.3, height * 0.2, 50, width * 0.5, height * 0.5, 600);
  bgGrad.addColorStop(0, theme.bgGradStart || 'rgba(255,215,0,0.15)');
  bgGrad.addColorStop(0.7, theme.bgGradEnd || 'rgba(10,10,15,0.96)');
  bgGrad.addColorStop(1, 'rgba(4,4,6,0.99)');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Left Theme Accent Bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, 6, height);

  // Background Watermark Text
  ctx.font = '900 140px "Barlow Condensed", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.fillText('VALTRACKER', 0, 0);
  ctx.restore();

  // Agent 3D Full Portrait Background Overlay (Right Side)
  if (agentPortraitImg) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    const aspect = agentPortraitImg.width / agentPortraitImg.height;
    const pHeight = height * 1.05;
    const pWidth = pHeight * aspect;
    ctx.drawImage(agentPortraitImg, width - pWidth + 20, -10, pWidth, pHeight);
    ctx.restore();
  }

  // --- 2. HEADER ROW (Y: 18px - 54px) ---
  const headerY = 22;
  
  // Real Logo
  if (logoImg) {
    ctx.drawImage(logoImg, 24, headerY, 26, 26);
  }

  // Brand Name
  ctx.font = '900 22px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('VALTRACKER.GG', 58, headerY + 13);

  // Flex Card Badge Pill
  const brandWidth = ctx.measureText('VALTRACKER.GG').width;
  const pillX = 64 + brandWidth;
  ctx.fillStyle = theme.accent + '20';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX, headerY + 3, 76, 20, 4);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  ctx.font = '700 8.5px "DM Mono", monospace';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.fillText('FLEX CARD', pillX + 38, headerY + 13);

  // Player Banner & Name Capsule
  const playerCapX = pillX + 124;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(playerCapX, headerY, 190, 26, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  if (playerBannerImg) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(playerCapX + 3, headerY + 3, 65, 20, 4);
    ctx.clip();
    ctx.drawImage(playerBannerImg, playerCapX + 3, headerY + 3, 65, 20);
    ctx.restore();
  }

  ctx.font = '900 14px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  const nameX = playerBannerImg ? playerCapX + 74 : playerCapX + 10;
  ctx.fillText(`${data.playerName}#${data.playerTag}`.toUpperCase(), nameX, headerY + 10);

  ctx.font = '700 8px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText(`LVL ${data.playerLevel || '—'}`, nameX, headerY + 20);



  // Match Outcome Badge (Right Side)
  const outcomeText = `${data.won ? 'VICTORY' : 'DEFEAT'} ${data.score}`;
  ctx.font = '900 22px "Barlow Condensed", sans-serif';
  const outcomeWidth = ctx.measureText(outcomeText).width + 24;
  const outcomeX = width - outcomeWidth - 110;

  ctx.fillStyle = theme.accent + '20';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(outcomeX, headerY - 2, outcomeWidth, 30, 6);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.fillText(outcomeText, outcomeX + outcomeWidth / 2, headerY + 13);

  // Flex Card Tag
  const modeX = width - 96;
  ctx.fillStyle = 'rgba(255, 176, 31, 0.08)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(modeX, headerY, 72, 26, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 176, 31, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '800 11px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#ffb01f';
  ctx.fillText('FLEX CARD', modeX + 36, headerY + 13);

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 62);
  ctx.lineTo(width - 24, 62);
  ctx.stroke();

  // --- 3. LEFT COLUMN (Y: 72px - 500px, Width: 410px) ---
  const leftX = 24;
  const leftW = options.showScoreboard ? 410 : 912;

  // Row 1: Profile & Performance Title Pill (Y: 72px, H: 46px)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(leftX, 72, leftW, 46, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  if (agentIconImg) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(leftX + 8, 78, 34, 34, 8);
    ctx.clip();
    ctx.drawImage(agentIconImg, leftX + 8, 78, 34, 34);
    ctx.restore();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.accent;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(leftX + 8, 78, 34, 34, 8);
    ctx.stroke();
  }

  // Performance Title Pill
  const titleText = data.customHeadline || data.coolTitle;
  ctx.font = '900 13.5px "Barlow Condensed", sans-serif';
  const titleW = ctx.measureText(titleText).width + 20;

  ctx.fillStyle = theme.titleBgStart || theme.accent + '25';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(leftX + 50, 78, titleW, 20, 5);
  ctx.fill();
  ctx.strokeStyle = theme.titleBorder || theme.accent;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = theme.titleColor || theme.accent;
  ctx.textAlign = 'left';
  ctx.fillText(titleText, leftX + 60, 88);

  ctx.font = '700 9px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(`${data.agentName.toUpperCase()} · ${data.mapName.toUpperCase()} · ${data.gameDate || 'RECENT MATCH'}`, leftX + 50, 106);

  // Row 2: Combat Rating & Grade Box (Y: 126px, H: 54px)
  ctx.fillStyle = 'rgba(15, 15, 22, 0.75)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(leftX, 126, leftW, 54, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  ctx.font = '700 8px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('ESPORTS COMBAT RATING', leftX + 14, 140);

  ctx.font = '900 34px "Barlow Condensed", sans-serif';
  const ratingNum = data.combatRating || '8.5';
  const ratingColor = Number(ratingNum) >= 8.2 ? '#e8ff47' : Number(ratingNum) >= 6.2 ? '#3ecf8e' : '#fa4454';
  ctx.fillStyle = ratingColor;
  ctx.fillText(ratingNum, leftX + 14, 166);

  const rNumW = ctx.measureText(ratingNum).width;
  ctx.font = '700 12px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText('/ 10', leftX + 18 + rNumW, 164);

  // Performance Grade Badge
  const gradeX = leftX + leftW - 120;
  ctx.fillStyle = data.perfGrade.includes('S') ? 'rgba(255,215,0,0.2)' : 'rgba(62,207,142,0.15)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(gradeX, 134, 38, 38, 8);
  ctx.fill();
  ctx.strokeStyle = data.perfGrade.includes('S') ? '#ffd700' : '#3ecf8e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '900 22px "Barlow Condensed", sans-serif';
  ctx.fillStyle = data.perfGrade.includes('S') ? '#ffd700' : '#3ecf8e';
  ctx.textAlign = 'center';
  ctx.fillText(data.perfGrade, gradeX + 19, 153);

  // MVP Badge
  if (data.isMatchMVP || data.isTeamMVP) {
    const mvpText = data.isMatchMVP ? '👑 MATCH MVP' : '⭐ TEAM MVP';
    const mvpColor = data.isMatchMVP ? '#ffd700' : '#e8ff47';
    ctx.font = '900 11px "Barlow Condensed", sans-serif';
    const mvpW = ctx.measureText(mvpText).width + 16;
    const mvpX = gradeX + 46;

    ctx.fillStyle = mvpColor + '20';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(mvpX, 140, mvpW, 26, 6);
    ctx.fill();
    ctx.strokeStyle = mvpColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = mvpColor;
    ctx.textAlign = 'center';
    ctx.fillText(mvpText, mvpX + mvpW / 2, 153);
  }

  // Row 3: Ranks Capsules (Y: 188px, H: 44px)
  const rankW = (leftW - 10) / 2;

  // Your Rank Box
  ctx.fillStyle = 'rgba(15, 15, 22, 0.75)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(leftX, 188, rankW, 44, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.stroke();

  if (userRankImg) {
    ctx.drawImage(userRankImg, leftX + 10, 196, 28, 28);
  }
  ctx.textAlign = 'left';
  ctx.font = '700 7.5px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('YOUR RANK', leftX + 44, 199);

  ctx.font = '800 13px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.userRank.toUpperCase(), leftX + 44, 214);

  // Lobby Avg Rank Box
  const lobbyX = leftX + rankW + 10;
  ctx.fillStyle = 'rgba(15, 15, 22, 0.75)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(lobbyX, 188, rankW, 44, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.stroke();

  if (lobbyRankImg) {
    ctx.drawImage(lobbyRankImg, lobbyX + 10, 196, 28, 28);
  }
  ctx.font = '700 7.5px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('LOBBY AVG', lobbyX + 44, 199);

  ctx.font = '800 13px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.lobbyRank.toUpperCase(), lobbyX + 44, 214);

  // Row 4: Telemetry Grid 2x3 (Y: 240px, H: 104px)
  const tileW = (leftW - 12) / 3;
  const tileH = 48;
  const metrics = [
    { label: 'K / D / A', val: `${data.kills}/${data.deaths}/${data.assists}`, color: '#ffffff' },
    { label: 'K/D RATIO', val: data.kd, color: Number(data.kd) >= 1.0 ? '#3ecf8e' : '#fa4454' },
    { label: 'ACS SCORE', val: `${data.acs}`, color: data.acs >= 240 ? '#ffd700' : '#ffffff' },
    { label: 'HS %', val: `${data.hsPct}%`, color: data.hsPct >= 22 ? '#3ecf8e' : data.hsPct >= 14 ? '#ffb01f' : '#fa4454' },
    { label: 'ADR', val: `${data.adr}`, color: '#ffffff' },
    { label: 'FK / FD DIFF', val: data.fkFdDiff, color: data.fkFdDiff.startsWith('+') ? '#3ecf8e' : '#fa4454' }
  ];

  metrics.forEach((m, idx) => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    const mx = leftX + c * (tileW + 6);
    const my = 240 + r * (tileH + 8);

    ctx.fillStyle = 'rgba(15, 15, 22, 0.75)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(mx, my, tileW, tileH, 10);
    ctx.fill();
    ctx.strokeStyle = m.color !== '#ffffff' ? m.color + '40' : 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 8px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, mx + tileW / 2, my + 14);

    ctx.font = '900 19px "Barlow Condensed", sans-serif';
    ctx.fillStyle = m.color;
    ctx.fillText(m.val, mx + tileW / 2, my + 34);
  });

  // Row 5: Round Timeline Dots (Y: 356px)
  if (options.showTimeline && data.rounds.length > 0) {
    ctx.font = '700 8px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('ROUNDS:', leftX, 368);

    let dotX = leftX + 48;
    data.rounds.forEach((rd, idx) => {
      ctx.beginPath();
      ctx.arc(dotX + 6, 364, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = rd.won ? 'rgba(62, 207, 142, 0.85)' : 'rgba(255, 87, 87, 0.75)';
      ctx.fill();
      if (rd.isClutch) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.font = '700 7px "DM Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, dotX + 6, 366.5);
      dotX += 16;
    });
  }

  // Row 6: Impact Feats Chips (Y: 392px)
  if (options.showFeats) {
    ctx.font = '700 8px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('FEATS:', leftX, 404);

    let chipX = leftX + 48;
    const featChips = [];
    if (data.feats.aces > 0) featChips.push({ text: `👑 ACE x${data.feats.aces}`, color: '#ffd700' });
    if (data.feats.clutches > 0) featChips.push({ text: `⚡ CLUTCH x${data.feats.clutches}`, color: '#e8ff47' });
    if (data.feats.quads > 0) featChips.push({ text: `🔥 4K x${data.feats.quads}`, color: '#ff4655' });
    if (data.feats.triples > 0) featChips.push({ text: `💀 3K x${data.feats.triples}`, color: '#a855f7' });
    if (data.feats.doubles > 0) featChips.push({ text: `💥 2K x${data.feats.doubles}`, color: '#3b82f6' });

    featChips.forEach((chip) => {
      ctx.font = '700 10.5px "Barlow Condensed", sans-serif';
      const cW = ctx.measureText(chip.text).width + 14;

      ctx.fillStyle = chip.color + '20';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(chipX, 392, cW, 20, 4);
      ctx.fill();
      ctx.strokeStyle = chip.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = chip.color;
      ctx.textAlign = 'center';
      ctx.fillText(chip.text, chipX + cW / 2, 403);
      chipX += cW + 6;
    });
  }

  // --- 4. RIGHT COLUMN (SCOREBOARD) (Y: 72px - 490px, Width: 420px) ---
  if (options.showScoreboard) {
    const sbX = 516;
    const sbW = 420;
    const sbH = 422;

    ctx.fillStyle = 'rgba(15, 15, 22, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sbX, 72, sbW, sbH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Scoreboard Header
    ctx.font = '900 12px "Barlow Condensed", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('MATCH SCOREBOARD', sbX + 14, 90);

    ctx.font = '700 8px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('ALLIED VS ENEMY ROSTER', sbX + sbW - 14, 90);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(sbX + 14, 98);
    ctx.lineTo(sbX + sbW - 14, 98);
    ctx.stroke();

    // Table Column Titles
    ctx.font = '900 9.5px "Barlow Condensed", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('PLAYER / CHARACTER', sbX + 14, 112);
    ctx.textAlign = 'center';
    ctx.fillText('K/D/A', sbX + 270, 112);
    ctx.textAlign = 'right';
    ctx.fillText('ACS', sbX + sbW - 14, 112);

    // Team 1 Header: YOUR TEAM
    let rowY = 126;
    ctx.font = '900 8.5px "Barlow Condensed", sans-serif';
    ctx.fillStyle = '#3ecf8e';
    ctx.textAlign = 'left';
    ctx.fillText('▲ YOUR TEAM', sbX + 14, rowY + 10);
    ctx.strokeStyle = 'rgba(62, 207, 142, 0.2)';
    ctx.beginPath();
    ctx.moveTo(sbX + 14, rowY + 14);
    ctx.lineTo(sbX + sbW - 14, rowY + 14);
    ctx.stroke();

    rowY += 18;

    // Allied Player Rows
    data.alliedPlayers.forEach((p, i) => {
      if (p.isMe) {
        ctx.fillStyle = 'rgba(62, 207, 142, 0.14)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(sbX + 10, rowY, sbW - 20, 22, 4);
        ctx.fill();
        ctx.fillStyle = '#3ecf8e';
        ctx.fillRect(sbX + 10, rowY, 3, 22);
      }

      const pIcon = alliedIcons[i];
      if (pIcon) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sbX + 24, rowY + 11, 7.5, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pIcon, sbX + 16.5, rowY + 3.5, 15, 15);
        ctx.restore();
      }

      ctx.font = p.isMe ? '700 10.5px "DM Mono", monospace' : '500 10.5px "DM Mono", monospace';
      ctx.fillStyle = p.isMe ? '#3ecf8e' : '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(p.name, sbX + 38, rowY + 15);

      ctx.font = '500 10.5px "DM Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(p.kda, sbX + 270, rowY + 15);

      ctx.font = '700 10.5px "DM Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.acs}`, sbX + sbW - 14, rowY + 15);

      rowY += 24;
    });

    // Team 2 Header: ENEMY TEAM
    rowY += 4;
    ctx.font = '900 8.5px "Barlow Condensed", sans-serif';
    ctx.fillStyle = '#fa4454';
    ctx.textAlign = 'left';
    ctx.fillText('▼ ENEMY TEAM', sbX + 14, rowY + 10);
    ctx.strokeStyle = 'rgba(250, 68, 84, 0.2)';
    ctx.beginPath();
    ctx.moveTo(sbX + 14, rowY + 14);
    ctx.lineTo(sbX + sbW - 14, rowY + 14);
    ctx.stroke();

    rowY += 18;

    // Enemy Player Rows
    data.enemyPlayers.forEach((p, i) => {
      const pIcon = enemyIcons[i];
      if (pIcon) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sbX + 24, rowY + 11, 7.5, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pIcon, sbX + 16.5, rowY + 3.5, 15, 15);
        ctx.restore();
      }

      ctx.font = '500 10.5px "DM Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(p.name, sbX + 38, rowY + 15);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(p.kda, sbX + 270, rowY + 15);

      ctx.font = '700 10.5px "DM Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.acs}`, sbX + sbW - 14, rowY + 15);

      rowY += 24;
    });
  }

  // --- 5. FOOTER (Y: 504px - 530px) ---
  const footerY = 516;
  if (logoImg) {
    ctx.drawImage(logoImg, 24, footerY, 14, 14);
  }

  ctx.font = '500 9px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('Telemetry compiled by ValTracker.gg', 44, footerY + 10);

  ctx.font = '900 10px "Barlow Condensed", sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'right';
  ctx.fillText('TRACK. ANALYZE. CONQUER.', width - 24, footerY + 10);
}

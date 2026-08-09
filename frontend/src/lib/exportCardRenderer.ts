// ValTracker — High-DPI Canvas Rendering Engine for Export Cards (Perfect Geometry & Full-Width Layout)

export interface MatchExportData {
  playerName: string;
  playerTag: string;
  playerLevel?: string;
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
  fkFdDiff?: string;
  combatRating?: string;
  perfGrade?: string;
  coolTitle?: string;
  customHeadline?: string;
  isMatchMVP?: boolean;
  isTeamMVP?: boolean;
  userRank?: string;
  userRankImgUrl?: string;
  lobbyRank?: string;
  lobbyRankImgUrl?: string;
  rounds?: Array<{ won: boolean; isClutch?: boolean }>;
  feats?: {
    aces?: number;
    clutches?: number;
    quads?: number;
    triples?: number;
    doubles?: number;
  };
  alliedPlayers?: Array<{ name: string; tag?: string; iconUrl?: string; kda: string; acs: number; isMe?: boolean }>;
  enemyPlayers?: Array<{ name: string; tag?: string; iconUrl?: string; kda: string; acs: number }>;
}

export interface ProfileExportData {
  playerName: string;
  playerTag: string;
  region?: string;
  playerBannerUrl?: string;
  currentRank: string;
  currentRankImgUrl?: string;
  currentRR?: number;
  peakRank?: string;
  peakRankImgUrl?: string;
  matchesPlayed: number;
  winRate: number;
  wins: number;
  losses: number;
  kdRatio: number;
  avgAcs: number;
  hsPct: number;
  topAgents?: Array<{ name: string; iconUrl?: string; matches: number; winRate: number }>;
  recentForm?: Array<'W' | 'L'>;
  customHeadline?: string;
}

export interface ExportTheme {
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

export const EXPORT_THEMES: ExportTheme[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Signature',
    badge: '🔥 VALTRACKER',
    accent: '#FA4454',
    accentShadow: 'rgba(250, 68, 84, 0.45)',
    border: 'rgba(250, 68, 84, 0.4)',
    bgGradStart: 'rgba(250, 68, 84, 0.18)',
    bgGradEnd: 'rgba(8, 8, 14, 0.98)',
    cardBg: '#050509',
    titleBgStart: 'rgba(250, 68, 84, 0.2)',
    titleColor: '#FA4454',
    titleBorder: 'rgba(250, 68, 84, 0.4)'
  },
  {
    id: 'champions',
    name: 'VCT Champions',
    badge: '🏆 CHAMPIONS',
    accent: '#FFD700',
    accentShadow: 'rgba(255, 215, 0, 0.4)',
    border: 'rgba(255, 215, 0, 0.45)',
    bgGradStart: 'rgba(255, 215, 0, 0.18)',
    bgGradEnd: 'rgba(18, 14, 4, 0.97)',
    cardBg: '#090805',
    titleBgStart: 'rgba(255, 215, 0, 0.25)',
    titleColor: '#FFD700',
    titleBorder: 'rgba(255, 215, 0, 0.5)'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: '⚡ CYBERPUNK',
    accent: '#00F3FF',
    accentShadow: 'rgba(0, 243, 255, 0.4)',
    border: 'rgba(0, 243, 255, 0.4)',
    bgGradStart: 'rgba(0, 243, 255, 0.16)',
    bgGradEnd: 'rgba(6, 12, 24, 0.97)',
    cardBg: '#040810',
    titleBgStart: 'rgba(0, 243, 255, 0.25)',
    titleColor: '#00F3FF',
    titleBorder: 'rgba(0, 243, 255, 0.5)'
  },
  {
    id: 'icebox',
    name: 'Icebox Frost',
    badge: '❄️ FROST',
    accent: '#38BDF8',
    accentShadow: 'rgba(56, 189, 248, 0.4)',
    border: 'rgba(56, 189, 248, 0.4)',
    bgGradStart: 'rgba(56, 189, 248, 0.18)',
    bgGradEnd: 'rgba(10, 20, 30, 0.96)',
    cardBg: '#060C14',
    titleBgStart: 'rgba(56, 189, 248, 0.25)',
    titleColor: '#38BDF8',
    titleBorder: 'rgba(56, 189, 248, 0.5)'
  },
  {
    id: 'sovereign',
    name: 'Sovereign Minimal',
    badge: '☯️ SOVEREIGN',
    accent: '#FFFFFF',
    accentShadow: 'rgba(255, 255, 255, 0.25)',
    border: 'rgba(255, 255, 255, 0.25)',
    bgGradStart: 'rgba(255, 255, 255, 0.08)',
    bgGradEnd: 'rgba(15, 15, 18, 0.98)',
    cardBg: '#09090B',
    titleBgStart: 'rgba(255, 255, 255, 0.12)',
    titleColor: '#FFFFFF',
    titleBorder: 'rgba(255, 255, 255, 0.3)'
  },
  {
    id: 'radiant',
    name: 'Radiant Spectrum',
    badge: '🔮 RADIANT',
    accent: '#BD37EC',
    accentShadow: 'rgba(189, 55, 236, 0.4)',
    border: 'rgba(189, 55, 236, 0.4)',
    bgGradStart: 'rgba(189, 55, 236, 0.18)',
    bgGradEnd: 'rgba(16, 6, 24, 0.97)',
    cardBg: '#08030C',
    titleBgStart: 'rgba(189, 55, 236, 0.25)',
    titleColor: '#BD37EC',
    titleBorder: 'rgba(189, 55, 236, 0.5)'
  }
];

const IMAGE_CACHE: Record<string, HTMLImageElement | null> = {};
const FAILED_IMAGE_SET: Set<string> = new Set();

function loadImage(src?: string, timeoutMs: number = 1200): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  if (FAILED_IMAGE_SET.has(src)) return Promise.resolve(null);
  if (src in IMAGE_CACHE) return Promise.resolve(IMAGE_CACHE[src]);

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        FAILED_IMAGE_SET.add(src);
        IMAGE_CACHE[src] = null;
        resolve(null);
      }
    }, timeoutMs);

    const img = new Image();
    if (/^https?:\/\//i.test(src) && typeof window !== 'undefined' && !src.startsWith(window.location.origin)) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        IMAGE_CACHE[src] = img;
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        FAILED_IMAGE_SET.add(src);
        IMAGE_CACHE[src] = null;
        resolve(null);
      }
    };

    img.src = src;
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | number[]
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = typeof radius === 'number' ? radius : radius[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }
  ctx.closePath();
}

/**
 * Draw Glassmorphism Card Container
 */
function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 16,
  borderColor: string = 'rgba(255, 255, 255, 0.12)',
  glowColor?: string
) {
  ctx.save();
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;
  }

  const cardGrad = ctx.createLinearGradient(x, y, x, y + h);
  cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  cardGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = cardGrad;
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.beginPath();
  const r = typeof radius === 'number' ? radius : radius;
  ctx.moveTo(x + r, y + 1);
  ctx.lineTo(x + w - r, y + 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function getRankColor(name?: string): string {
  if (!name) return '#FA4454';
  const lower = name.toLowerCase();
  if (lower.includes('radiant')) return '#FFED4A';
  if (lower.includes('immortal')) return '#F43F5E';
  if (lower.includes('ascendant')) return '#10B981';
  if (lower.includes('diamond')) return '#AB47BC';
  if (lower.includes('platinum')) return '#00BCD4';
  if (lower.includes('gold')) return '#EAB308';
  if (lower.includes('silver')) return '#B5C2C7';
  if (lower.includes('bronze')) return '#A57446';
  if (lower.includes('iron')) return '#8B969E';
  return '#FA4454';
}

function getRankRgb(name?: string): string {
  if (!name) return '250, 68, 84';
  const lower = name.toLowerCase();
  if (lower.includes('radiant')) return '255, 237, 74';
  if (lower.includes('immortal')) return '244, 63, 94';
  if (lower.includes('ascendant')) return '16, 185, 129';
  if (lower.includes('diamond')) return '171, 71, 188';
  if (lower.includes('platinum')) return '0, 188, 212';
  if (lower.includes('gold')) return '234, 179, 8';
  if (lower.includes('silver')) return '181, 194, 199';
  if (lower.includes('bronze')) return '165, 116, 70';
  if (lower.includes('iron')) return '139, 150, 158';
  return '250, 68, 84';
}

const AGENT_ROLES_MAP: Record<string, string> = {
  jett: 'duelist', reyna: 'duelist', raze: 'duelist', yoru: 'duelist', phoenix: 'duelist', neon: 'duelist', isobe: 'duelist', iso: 'duelist',
  omen: 'controller', viper: 'controller', brimstone: 'controller', astra: 'controller', harbor: 'controller', clove: 'controller',
  sova: 'initiator', fade: 'initiator', breach: 'initiator', skye: 'initiator', kayo: 'initiator', gekko: 'initiator', tejo: 'initiator',
  sage: 'sentinel', cypher: 'sentinel', killjoy: 'sentinel', chamber: 'sentinel', deadlock: 'sentinel', vyse: 'sentinel'
};

function getAgentRoleName(agentName?: string): string {
  if (!agentName) return 'duelist';
  const clean = agentName.toLowerCase().replace(/[^a-z]/g, '');
  return AGENT_ROLES_MAP[clean] || 'duelist';
}

function getRoleColor(roleName?: string): string {
  switch (roleName?.toLowerCase()) {
    case 'duelist': return '#FF4655';
    case 'controller': return '#A855F7';
    case 'initiator': return '#06B6D4';
    case 'sentinel': return '#10B981';
    default: return '#FF4655';
  }
}

function getWRColor(wr: number): string {
  if (wr >= 50) return '#22C55E';
  if (wr >= 40) return '#F59E0B'; // Soft amber for below average (Requirement 3)
  return '#EF4444'; // Alarm red reserved strictly for critical low (< 40%)
}

function getKDColor(kd: number): string {
  if (kd >= 1.05) return '#22C55E';
  if (kd >= 0.85) return '#F59E0B'; // Soft amber for below average
  return '#EF4444'; // Alarm red reserved strictly for critical low (< 0.85)
}

function drawTacticalMeshPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const gridSize = 45;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBottomRadialGlow(ctx: CanvasRenderingContext2D, width: number, height: number, colorRgb: string) {
  ctx.save();
  const glowGrad = ctx.createRadialGradient(
    width * 0.5,
    height + 50,
    50,
    width * 0.5,
    height + 50,
    700
  );
  glowGrad.addColorStop(0, `rgba(${colorRgb}, 0.22)`);
  glowGrad.addColorStop(0.4, `rgba(${colorRgb}, 0.06)`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Render Match Export Card to HTMLCanvasElement
 */
export async function renderMatchCardToCanvas(
  canvas: HTMLCanvasElement,
  data: MatchExportData,
  theme: ExportTheme,
  options: {
    format?: '16:9' | '1:1';
    showScoreboard?: boolean;
    showTimeline?: boolean;
    showFeats?: boolean;
  } = {}
): Promise<void> {
  const isSquare = options.format === '1:1';
  const logicalWidth = isSquare ? 1080 : 1920;
  const logicalHeight = 1080;
  const dpr = 1.5;

  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  const paddingX = isSquare ? 40 : 60;
  const contentWidth = logicalWidth - paddingX * 2;

  // Preload images
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
    loadImage(data.mapImgUrl),
    loadImage(data.agentPortraitUrl),
    loadImage(data.agentIconUrl),
    loadImage(data.userRankImgUrl),
    loadImage(data.lobbyRankImgUrl),
    loadImage(data.playerBannerUrl),
    ...(data.alliedPlayers || []).map(p => loadImage(p.iconUrl)),
    ...(data.enemyPlayers || []).map(p => loadImage(p.iconUrl))
  ]);

  // Base background
  drawRoundRect(ctx, 0, 0, logicalWidth, logicalHeight, 28);
  ctx.fillStyle = '#06070B';
  ctx.fill();

  // Tactical dot-grid background mesh (Requirement 1 & 7)
  drawTacticalMeshPattern(ctx, logicalWidth, logicalHeight);

  // Background Map Splash
  if (mapImg) {
    ctx.save();
    drawRoundRect(ctx, 0, 0, logicalWidth, logicalHeight, 28);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(mapImg, 0, 0, logicalWidth, logicalHeight);
    ctx.restore();
  }

  // Vignette overlay
  const bgGrad = ctx.createRadialGradient(
    logicalWidth * 0.5,
    logicalHeight * 0.35,
    100,
    logicalWidth * 0.5,
    logicalHeight * 0.5,
    1200
  );
  bgGrad.addColorStop(0, 'rgba(20, 16, 28, 0.85)');
  bgGrad.addColorStop(0.55, 'rgba(10, 10, 16, 0.95)');
  bgGrad.addColorStop(1, 'rgba(4, 4, 8, 0.99)');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Ambient bottom glow in rank/accent color (Requirement 7)
  const rankRgb = getRankRgb(data.userRank);
  drawBottomRadialGlow(ctx, logicalWidth, logicalHeight, rankRgb);

  // Thin Luminous Outer Border (Requirement 7)
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();

  // Left Accent Stripe
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 24;
  ctx.fillStyle = theme.accent;
  drawRoundRect(ctx, 20, 28, 8, logicalHeight - 56, 4);
  ctx.fill();
  ctx.restore();

  // Header Branding
  const brandX = paddingX;
  const brandY = 40;
  if (logoImg) {
    ctx.drawImage(logoImg, brandX, brandY, 40, 40);
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Orbitron", "Rajdhani", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('VALTRACKER.GG', brandX + (logoImg ? 50 : 0), brandY + 30);

  // Badge
  ctx.save();
  const badgeW = 210;
  const badgeH = 40;
  const badgeX = logicalWidth - paddingX - badgeW;
  drawGlassCard(ctx, badgeX, brandY, badgeW, badgeH, 20, theme.border);
  ctx.fillStyle = theme.accent;
  ctx.font = '800 13px "Orbitron", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.badge, badgeX + badgeW / 2, brandY + 25);
  ctx.restore();

  // Match Header (Result, Score, Map)
  const isWin = data.won;
  const resultColor = isWin ? '#22C55E' : '#EF4444';
  const resultText = isWin ? 'VICTORY' : 'DEFEAT';

  ctx.save();
  ctx.shadowColor = resultColor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = isWin ? 'rgba(34, 197, 94, 0.16)' : 'rgba(239, 68, 68, 0.16)';
  drawRoundRect(ctx, paddingX, 100, 150, 42, 10);
  ctx.fill();
  ctx.strokeStyle = resultColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = resultColor;
  ctx.font = '900 20px "Orbitron", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(resultText, paddingX + 75, 128);
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px "Teko", "Bebas Neue", "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.score || '13 - 0', paddingX + 170, 136);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '800 16px "Orbitron", "Rajdhani", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(`${(data.mapName || 'ASCENT').toUpperCase()}  •  ${data.gameDate || 'COMPETITIVE'}`, paddingX + 350, 133);

  // Headline
  const headline = data.customHeadline || data.coolTitle;
  let leftPanelY = 160;
  if (headline) {
    const hlY = 160;
    const hlW = isSquare ? contentWidth : 1100;
    drawGlassCard(ctx, paddingX, hlY, hlW, 48, 12, theme.titleBorder);

    ctx.fillStyle = theme.titleColor;
    ctx.font = '900 19px "Orbitron", "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(headline.toUpperCase(), paddingX + 20, hlY + 31);
    leftPanelY = 224;
  }

  // Right Agent Portrait (16:9 Landscape Mode)
  if (!isSquare && agentPortraitImg) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 45;
    const portraitW = 680;
    const portraitH = 820;
    const portraitX = logicalWidth - paddingX - portraitW + 40;
    ctx.drawImage(agentPortraitImg, portraitX, 160, portraitW, portraitH);
    ctx.restore();
  }

  // Left Player Banner (With Rank Tint Overlay - Requirement 1)
  const bannerW = isSquare ? contentWidth : 1100;
  const bannerH = 110;

  ctx.save();
  drawRoundRect(ctx, paddingX, leftPanelY, bannerW, bannerH, 16);
  ctx.clip();
  if (playerBannerImg) {
    ctx.drawImage(playerBannerImg, paddingX, leftPanelY, bannerW, bannerH);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
  }
  const bannerGrad = ctx.createLinearGradient(paddingX, leftPanelY, paddingX + bannerW, leftPanelY);
  bannerGrad.addColorStop(0, 'rgba(8, 8, 14, 0.96)');
  bannerGrad.addColorStop(0.5, 'rgba(8, 8, 14, 0.65)');
  bannerGrad.addColorStop(1, 'rgba(8, 8, 14, 0.95)');
  ctx.fillStyle = bannerGrad;
  ctx.fill();

  // Rank Fan-Out Overlay on Match Card Banner (Requirement 1)
  const userRankRgb = getRankRgb(data.userRank);
  const matchRankFan = ctx.createRadialGradient(
    paddingX + bannerW - 60, leftPanelY + bannerH / 2, 10,
    paddingX + bannerW - 60, leftPanelY + bannerH / 2, bannerW * 0.5
  );
  matchRankFan.addColorStop(0, `rgba(${userRankRgb}, 0.35)`);
  matchRankFan.addColorStop(1, 'transparent');
  ctx.fillStyle = matchRankFan;
  ctx.fill();

  ctx.restore();

  drawRoundRect(ctx, paddingX, leftPanelY, bannerW, bannerH, 16);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Circular Agent Avatar with Role Border Ring (Requirement 4)
  const agentRole = getAgentRoleName(data.agentName);
  const agentRoleColor = getRoleColor(agentRole);
  const agentIconSize = 80;

  if (agentIconImg) {
    ctx.save();
    ctx.shadowColor = agentRoleColor;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3;
    ctx.strokeStyle = agentRoleColor;

    const iconCx = paddingX + 16 + agentIconSize / 2;
    const iconCy = leftPanelY + 15 + agentIconSize / 2;

    ctx.beginPath();
    ctx.arc(iconCx, iconCy, agentIconSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(iconCx, iconCy, (agentIconSize / 2) - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(agentIconImg, paddingX + 16, leftPanelY + 15, agentIconSize, agentIconSize);
    ctx.restore();
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 38px "Orbitron", "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.playerName, paddingX + 112, leftPanelY + 52);

  ctx.fillStyle = theme.accent;
  ctx.font = '800 20px "Teko", "Rajdhani", "DM Mono", sans-serif';
  ctx.fillText(`#${data.playerTag}`, paddingX + 112, leftPanelY + 84);

  if (data.isMatchMVP || data.isTeamMVP) {
    ctx.save();
    const mvpText = data.isMatchMVP ? 'MATCH MVP' : 'TEAM MVP';
    ctx.fillStyle = data.isMatchMVP ? '#FFD700' : '#FA4454';
    ctx.shadowColor = data.isMatchMVP ? 'rgba(255, 215, 0, 0.4)' : 'rgba(250, 68, 84, 0.4)';
    ctx.shadowBlur = 10;
    drawRoundRect(ctx, bannerW - 140, leftPanelY + 20, 130, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 13px "Orbitron", "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mvpText, bannerW - 75, leftPanelY + 42);
    ctx.restore();
  }

  if (userRankImg) {
    ctx.save();
    ctx.shadowColor = getRankColor(data.userRank);
    ctx.shadowBlur = 20;
    ctx.drawImage(userRankImg, bannerW - 200, leftPanelY + 55, 48, 48);
    ctx.restore();
  }

  // Stat Grid (Requirements 2, 3, 6)
  const gridY = leftPanelY + 125;
  const cols = isSquare ? 3 : 3;
  const statBoxW = (bannerW - (cols - 1) * 20) / cols;
  const statBoxH = 115;

  const matchKdNum = parseFloat(data.kd) || 1.0;
  const statsList = [
    { label: 'K / D / A', val: `${data.kills} / ${data.deaths} / ${data.assists}`, color: '#FFFFFF', accentColor: '#38BDF8', pct: 85 },
    { label: 'K/D RATIO', val: data.kd, color: getKDColor(matchKdNum), accentColor: getKDColor(matchKdNum), pct: Math.min(100, Math.max(10, Math.round((matchKdNum / 2.0) * 100))) },
    { label: 'AVG ACS', val: `${data.acs}`, color: theme.accent, accentColor: theme.accent, pct: Math.min(100, Math.max(10, Math.round(((data.acs || 0) / 350) * 100))) },
    { label: 'HEADSHOT %', val: `${data.hsPct}%`, color: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#FFFFFF', accentColor: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#00F3FF', pct: Math.min(100, Math.max(10, Math.round((data.hsPct / 45) * 100))) },
    { label: 'ADR', val: `${data.adr}`, color: '#FFFFFF', accentColor: '#A855F7', pct: Math.min(100, Math.max(10, Math.round(((data.adr || 0) / 200) * 100))) },
    { label: 'PERF GRADE', val: data.perfGrade || 'S', color: theme.accent, accentColor: theme.accent, pct: 100 }
  ];

  statsList.forEach((st, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const sx = paddingX + col * (statBoxW + 20);
    const sy = gridY + row * (statBoxH + 20);

    const glowC = st.accentColor;
    drawGlassCard(ctx, sx, sy, statBoxW, statBoxH, 14, 'rgba(255, 255, 255, 0.14)', glowC);

    // Left Border Accent (Requirement 2)
    ctx.save();
    ctx.fillStyle = st.accentColor;
    ctx.shadowColor = st.accentColor;
    ctx.shadowBlur = 10;
    drawRoundRect(ctx, sx, sy + 10, 4, statBoxH - 20, 2);
    ctx.fill();
    ctx.restore();

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'center';
    ctx.fillText(st.label, sx + statBoxW / 2, sy + 28);

    // Value
    ctx.save();
    if (glowC) {
      ctx.shadowColor = glowC;
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = st.color;
    ctx.font = '900 40px "DM Mono", "Tungsten", sans-serif';
    ctx.fillText(st.val, sx + statBoxW / 2, sy + 74);
    ctx.restore();

    // Micro Progress Bar under stat (Requirement 2)
    if (st.pct) {
      const mBarX = sx + 20;
      const mBarY = sy + statBoxH - 18;
      const mBarW = statBoxW - 40;
      const mBarH = 4;

      ctx.save();
      drawRoundRect(ctx, mBarX, mBarY, mBarW, mBarH, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      const mFillW = Math.max(4, Math.round((mBarW * st.pct) / 100));
      drawRoundRect(ctx, mBarX, mBarY, mFillW, mBarH, 2);
      ctx.fillStyle = st.accentColor;
      ctx.shadowColor = st.accentColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  });

  // Timeline & Scoreboard
  let timelineY = gridY + 2 * (statBoxH + 20) + 15;
  if (options.showTimeline !== false && data.rounds && data.rounds.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '800 14px "Inter", sans-serif';
    ctx.letterSpacing = '1.2px';
    ctx.textAlign = 'left';
    ctx.fillText('ROUND TIMELINE', paddingX, timelineY);

    timelineY += 15;
    const dotW = 26;
    const dotH = 26;
    const maxDotsPerRow = isSquare ? 14 : 18;

    data.rounds.forEach((rd, i) => {
      const col = i % maxDotsPerRow;
      const row = Math.floor(i / maxDotsPerRow);
      const dx = paddingX + col * 32;
      const dy = timelineY + row * 34;

      const dotColor = rd.won ? '#22C55E' : '#EF4444';
      ctx.save();
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = dotColor;
      drawRoundRect(ctx, dx, dy, dotW, dotH, 6);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#000000';
      ctx.font = '800 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rd.isClutch ? '★' : `${i + 1}`, dx + dotW / 2, dy + 18);
    });

    timelineY += (Math.ceil(data.rounds.length / maxDotsPerRow) * 34) + 15;
  }

  // 9. FOOTER WATERMARK WITH LOGO ICON (Clean Dynamic Placement)
  const footerText = 'VALTRACKER.GG  •  TRACK YOUR VALORANT STATS';
  ctx.font = '600 13px "Inter", sans-serif';
  const textWidth = ctx.measureText(footerText).width;
  const iconSize = 18;
  const iconGap = 8;
  const totalFooterW = (logoImg ? iconSize + iconGap : 0) + textWidth;
  const footerStartX = logicalWidth - paddingX - totalFooterW;

  if (logoImg) {
    ctx.drawImage(logoImg, footerStartX, logicalHeight - 44, iconSize, iconSize);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '600 13px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(footerText, footerStartX + (logoImg ? iconSize + iconGap : 0), logicalHeight - 30);
}

/**
 * Render Profile / Act Stats Card to HTMLCanvasElement (Full-Width Geometry & High Contrast)
 */
export async function renderProfileCardToCanvas(
  canvas: HTMLCanvasElement,
  data: ProfileExportData,
  theme: ExportTheme,
  options: { format?: '16:9' | '1:1' } = {}
): Promise<void> {
  const isSquare = options.format === '1:1';
  const logicalWidth = isSquare ? 1080 : 1920;
  const logicalHeight = 1080;
  const dpr = 1.5;

  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Precise layout padding & full content width calculation
  const paddingX = isSquare ? 40 : 60;
  const contentWidth = logicalWidth - paddingX * 2; // 1800px on 16:9, 1000px on 1:1

  // Preload images
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';
  const [
    logoImg,
    currentRankImg,
    peakRankImg,
    playerBannerImg,
    ...agentIcons
  ] = await Promise.all([
    loadImage(logoUrl),
    loadImage(data.currentRankImgUrl),
    loadImage(data.peakRankImgUrl),
    loadImage(data.playerBannerUrl),
    ...(data.topAgents || []).map(a => loadImage(a.iconUrl))
  ]);

  // 1. BASE BACKGROUND, TACTICAL MESH & AMBIENT RADIAL GLOW
  drawRoundRect(ctx, 0, 0, logicalWidth, logicalHeight, 28);
  ctx.fillStyle = '#06070B';
  ctx.fill();

  // Tactical dot-grid background mesh (Requirement 1 & 7)
  drawTacticalMeshPattern(ctx, logicalWidth, logicalHeight);

  // Radial Vignette
  const bgGrad = ctx.createRadialGradient(
    logicalWidth * 0.5,
    logicalHeight * 0.35,
    100,
    logicalWidth * 0.5,
    logicalHeight * 0.5,
    1200
  );
  bgGrad.addColorStop(0, 'rgba(20, 16, 28, 0.85)');
  bgGrad.addColorStop(0.55, 'rgba(10, 10, 16, 0.95)');
  bgGrad.addColorStop(1, 'rgba(4, 4, 8, 0.99)');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Center-Bottom Ambient Glow emanating in rank/accent color (Requirement 7)
  const rankRgb = getRankRgb(data.currentRank);
  drawBottomRadialGlow(ctx, logicalWidth, logicalHeight, rankRgb);

  // Thin Luminous Outer Border (Requirement 7)
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();

  // Left Accent Stripe
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 24;
  ctx.fillStyle = theme.accent;
  drawRoundRect(ctx, 20, 28, 8, logicalHeight - 56, 4);
  ctx.fill();
  ctx.restore();

  // 2. HEADER BRANDING & BADGE
  const brandX = paddingX;
  const brandY = 40;
  if (logoImg) {
    ctx.drawImage(logoImg, brandX, brandY, 40, 40);
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Orbitron", "Rajdhani", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('VALTRACKER.GG', brandX + (logoImg ? 50 : 0), brandY + 30);

  // Badge (Right aligned)
  ctx.save();
  const badgeW = 210;
  const badgeH = 40;
  const badgeX = logicalWidth - paddingX - badgeW;
  drawGlassCard(ctx, badgeX, brandY, badgeW, badgeH, 20, theme.border);
  ctx.fillStyle = theme.accent;
  ctx.font = '800 13px "Orbitron", "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.badge, badgeX + badgeW / 2, brandY + 25);
  ctx.restore();

  // 3. PLAYER HERO BANNER (With Rank Color Fan Overlay - Requirement 1)
  const bannerY = 100;
  const bannerW = contentWidth;
  const bannerH = isSquare ? 135 : 150;

  ctx.save();
  drawRoundRect(ctx, paddingX, bannerY, bannerW, bannerH, 20);
  ctx.clip();

  if (playerBannerImg) {
    ctx.drawImage(playerBannerImg, paddingX, bannerY, bannerW, bannerH);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
  }

  // Dark linear base overlay
  const bannerGrad = ctx.createLinearGradient(paddingX, bannerY, paddingX + bannerW, bannerY);
  bannerGrad.addColorStop(0, 'rgba(8, 8, 14, 0.96)');
  bannerGrad.addColorStop(0.35, 'rgba(8, 8, 14, 0.65)');
  bannerGrad.addColorStop(0.7, 'rgba(8, 8, 14, 0.45)');
  bannerGrad.addColorStop(1, 'rgba(8, 8, 14, 0.95)');
  ctx.fillStyle = bannerGrad;
  ctx.fill();

  // Rank Color Fan-Out Radial Overlay (Requirement 1)
  const rankFanGrad = ctx.createRadialGradient(
    paddingX + bannerW - 100, bannerY + bannerH / 2, 20,
    paddingX + bannerW - 100, bannerY + bannerH / 2, bannerW * 0.65
  );
  rankFanGrad.addColorStop(0, `rgba(${rankRgb}, 0.38)`);
  rankFanGrad.addColorStop(0.5, `rgba(${rankRgb}, 0.12)`);
  rankFanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rankFanGrad;
  ctx.fill();

  ctx.restore();

  drawRoundRect(ctx, paddingX, bannerY, bannerW, bannerH, 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Current Rank Icon inside Hero Banner
  const rankIconSize = isSquare ? 90 : 105;
  if (currentRankImg) {
    ctx.save();
    ctx.shadowColor = getRankColor(data.currentRank);
    ctx.shadowBlur = 28;
    ctx.drawImage(currentRankImg, paddingX + 20, bannerY + (bannerH - rankIconSize) / 2, rankIconSize, rankIconSize);
    ctx.restore();
  }

  // Player Name & Tag
  const textX = paddingX + (currentRankImg ? rankIconSize + 35 : 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 38px "Orbitron", "Rajdhani", "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.playerName, textX, bannerY + (bannerH / 2) - 6);

  ctx.fillStyle = theme.accent;
  ctx.font = '800 20px "Teko", "Rajdhani", "DM Mono", sans-serif';
  ctx.fillText(`#${data.playerTag}`, textX, bannerY + (bannerH / 2) + 26);

  // Peak Rank Badge on Banner Right Edge (Requirement 8)
  if (peakRankImg || data.peakRank) {
    ctx.save();
    const prW = isSquare ? 210 : 250;
    const prH = isSquare ? 80 : 92;
    const prX = paddingX + bannerW - prW - 20;
    const prY = bannerY + (bannerH - prH) / 2;

    drawGlassCard(ctx, prX, prY, prW, prH, 16, 'rgba(255, 255, 255, 0.22)', '#FFD700');

    const pIconSize = isSquare ? 56 : 68;
    if (peakRankImg) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 22; // Prominent soft gold glow
      ctx.drawImage(peakRankImg, prX + 14, prY + (prH - pIconSize) / 2, pIconSize, pIconSize);
      ctx.restore();
    }

    const prTextX = prX + (peakRankImg ? pIconSize + 22 : 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '800 11px "Orbitron", "Rajdhani", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'left';
    ctx.fillText('PEAK RANK', prTextX, prY + (isSquare ? 32 : 36));

    ctx.fillStyle = '#FFD700';
    ctx.font = '900 17px "Orbitron", "Rajdhani", sans-serif';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText((data.peakRank || 'UNRANKED').toUpperCase(), prTextX, prY + (isSquare ? 56 : 64));
    ctx.restore();
  }

  // 4. BENTO BOX STATS SUMMARY CARDS (Requirements 2, 3, 5, 6)
  let contentY = bannerY + bannerH + 24;

  if (data.customHeadline) {
    ctx.save();
    drawGlassCard(ctx, paddingX, contentY, bannerW, 48, 12, theme.titleBorder);

    ctx.fillStyle = theme.titleColor;
    ctx.font = '900 19px "Orbitron", "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(data.customHeadline.toUpperCase(), paddingX + 20, contentY + 31);
    ctx.restore();

    contentY += 66;
  }

  const colsPerLine = isSquare ? 2 : 3;
  const cardGap = 20;
  const cardW = (contentWidth - (colsPerLine - 1) * cardGap) / colsPerLine;
  const cardH = isSquare ? 135 : 160;

  const kdNum = typeof data.kdRatio === 'number' ? data.kdRatio : parseFloat(data.kdRatio) || 1.0;
  const profileStats = [
    {
      label: 'MATCHES PLAYED',
      val: `${data.matchesPlayed}`,
      sub: `${data.wins}W - ${data.losses}L`,
      color: '#FFFFFF',
      accentColor: '#38BDF8',
      pct: Math.min(100, Math.max(12, Math.round((data.matchesPlayed / 50) * 100)))
    },
    {
      label: 'WIN RATE',
      val: `${data.winRate}%`,
      sub: data.winRate >= 50 ? 'POSITIVE' : data.winRate >= 40 ? 'BELOW AVG' : 'CRITICAL LOW',
      color: getWRColor(data.winRate), // Soft Amber for 40-49% (Requirement 3)
      accentColor: getWRColor(data.winRate),
      pct: Math.min(100, Math.max(12, data.winRate))
    },
    {
      label: 'K/D RATIO',
      val: typeof data.kdRatio === 'number' ? data.kdRatio.toFixed(2) : `${data.kdRatio}`,
      sub: kdNum >= 1.05 ? 'HIGH IMPACT' : kdNum >= 0.85 ? 'AVERAGE' : 'LOW',
      color: getKDColor(kdNum), // Soft Amber for 0.85-1.04 (Requirement 3)
      accentColor: getKDColor(kdNum),
      pct: Math.min(100, Math.max(12, Math.round((kdNum / 2.0) * 100)))
    },
    {
      label: 'AVG ACS',
      val: `${Math.round(data.avgAcs || 0)}`,
      sub: 'COMBAT SCORE',
      color: theme.accent,
      accentColor: theme.accent,
      pct: Math.min(100, Math.max(12, Math.round(((data.avgAcs || 0) / 350) * 100)))
    },
    {
      label: 'HEADSHOT %',
      val: `${data.hsPct}%`,
      sub: 'ACCURACY',
      color: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#FFFFFF',
      accentColor: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#00F3FF',
      pct: Math.min(100, Math.max(12, Math.round((data.hsPct / 45) * 100)))
    },
    {
      label: 'CURRENT RANK',
      val: data.currentRank,
      sub: data.currentRR != null ? `${data.currentRR} RR` : 'RATING',
      color: getRankColor(data.currentRank),
      accentColor: getRankColor(data.currentRank),
      isRank: true,
      pct: 100
    }
  ];

  profileStats.forEach((st, idx) => {
    const col = idx % colsPerLine;
    const row = Math.floor(idx / colsPerLine);
    const cx = paddingX + col * (cardW + cardGap);
    const cy = contentY + row * (cardH + cardGap);

    const glowC = st.accentColor;
    drawGlassCard(ctx, cx, cy, cardW, cardH, 16, 'rgba(255, 255, 255, 0.14)', glowC);

    // Colored Left-Border Accent (Requirement 2)
    ctx.save();
    ctx.fillStyle = st.accentColor;
    ctx.shadowColor = st.accentColor;
    ctx.shadowBlur = 12;
    drawRoundRect(ctx, cx, cy + 12, 4, cardH - 24, 2);
    ctx.fill();
    ctx.restore();

    // Label (tiny + uppercase + tracking - Requirement 2 & 6)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '800 11px "Orbitron", "Rajdhani", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'center';
    ctx.fillText(st.label, cx + cardW / 2, cy + 28);

    // Value (Massive + Glowing shadow - Requirement 2 & 6)
    ctx.save();
    if (glowC) {
      ctx.shadowColor = glowC;
      ctx.shadowBlur = 16;
    }

    if (st.isRank) {
      const rankStr = (st.val || 'UNRANKED').toUpperCase();
      const fontSize = rankStr.length > 10 ? 20 : 24;
      ctx.fillStyle = st.color;
      ctx.font = `900 ${fontSize}px "Orbitron", "Rajdhani", sans-serif`;
      ctx.fillText(rankStr, cx + cardW / 2, cy + (isSquare ? 68 : 78));
    } else {
      ctx.fillStyle = st.color;
      ctx.font = `900 ${isSquare ? 40 : 46}px "Teko", "Bebas Neue", "DM Mono", "Barlow Condensed", sans-serif`;
      ctx.fillText(st.val, cx + cardW / 2, cy + (isSquare ? 68 : 78));
    }
    ctx.restore();

    // Micro Progress Bar under stat value (Requirement 2)
    if (!st.isRank && st.pct) {
      const mBarX = cx + 24;
      const mBarY = cy + (isSquare ? 82 : 94);
      const mBarW = cardW - 48;
      const mBarH = 4;

      ctx.save();
      drawRoundRect(ctx, mBarX, mBarY, mBarW, mBarH, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      const mFillW = Math.max(4, Math.round((mBarW * st.pct) / 100));
      drawRoundRect(ctx, mBarX, mBarY, mFillW, mBarH, 2);
      ctx.fillStyle = st.accentColor;
      ctx.shadowColor = st.accentColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // Sub-label Pill Badge
    ctx.save();
    const pillW = Math.min(160, cardW - 40);
    const pillH = 24;
    const pillX = cx + (cardW - pillW) / 2;
    const pillY = cy + (isSquare ? 96 : 116);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawRoundRect(ctx, pillX, pillY, pillW, pillH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 11px "Orbitron", "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.sub, cx + cardW / 2, pillY + 16);
    ctx.restore();
  });

  const totalStatRows = Math.ceil(profileStats.length / colsPerLine);
  let nextSectionY = contentY + totalStatRows * (cardH + cardGap) + 15;

  // 5. MOST PLAYED AGENTS SECTION (Requirement 4)
  if (data.topAgents && data.topAgents.length > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '900 15px "Orbitron", "Rajdhani", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'left';
    ctx.fillText('MOST PLAYED AGENTS', paddingX, nextSectionY);

    nextSectionY += 22;
    const agentCols = 3;
    const agentGap = 20;
    const agentCardW = (contentWidth - (agentCols - 1) * agentGap) / agentCols;
    const agentCardH = isSquare ? 90 : 100;

    data.topAgents.slice(0, 3).forEach((ag, idx) => {
      const ax = paddingX + idx * (agentCardW + agentGap);
      const ay = nextSectionY;

      const wrColor = getWRColor(ag.winRate);
      const roleName = getAgentRoleName(ag.name);
      const roleColor = getRoleColor(roleName);

      drawGlassCard(ctx, ax, ay, agentCardW, agentCardH, 16, 'rgba(255, 255, 255, 0.12)', wrColor);

      // Circular Agent Avatar with Role Border Ring (Requirement 4)
      const icon = agentIcons[idx];
      const avatarSize = isSquare ? 56 : 64;
      const avatarX = ax + 14;
      const avatarY = ay + (agentCardH - avatarSize) / 2;

      if (icon) {
        ctx.save();
        // Role Ring Glow & Border
        ctx.shadowColor = roleColor;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = roleColor;

        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, (avatarSize / 2) - 1, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(icon, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      }

      // Agent Name & Matches
      const agentTextX = ax + avatarSize + 26;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${isSquare ? 16 : 18}px "Orbitron", "Rajdhani", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(ag.name.toUpperCase(), agentTextX, ay + (isSquare ? 30 : 34));

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText(`${ag.matches} Matches`, agentTextX, ay + (isSquare ? 48 : 54));

      // Win Rate Tag
      ctx.save();
      const wrTagW = isSquare ? 64 : 76;
      const wrTagH = 26;
      const wrTagX = ax + agentCardW - wrTagW - 14;
      const wrTagY = ay + 14;

      ctx.fillStyle = ag.winRate >= 50 ? 'rgba(34, 197, 94, 0.16)' : ag.winRate >= 40 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.16)';
      drawRoundRect(ctx, wrTagX, wrTagY, wrTagW, wrTagH, 8);
      ctx.fill();
      ctx.strokeStyle = wrColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = wrColor;
      ctx.font = '800 13px "Teko", "Orbitron", "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${ag.winRate}% WR`, wrTagX + wrTagW / 2, wrTagY + 17);
      ctx.restore();

      // Thick Glowing Win Rate Progress Bar (Requirement 4)
      const barX = agentTextX;
      const barY = ay + agentCardH - 16;
      const barW = agentCardW - (agentTextX - ax) - 14;
      const barH = 8; // Thicker progress bar

      ctx.save();
      drawRoundRect(ctx, barX, barY, barW, barH, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();

      const fillW = Math.max(6, Math.round((barW * Math.min(100, Math.max(0, ag.winRate))) / 100));
      drawRoundRect(ctx, barX, barY, fillW, barH, 4);
      ctx.fillStyle = wrColor;
      ctx.shadowColor = wrColor;
      ctx.shadowBlur = 10; // Glowing fill
      ctx.fill();
      ctx.restore();
    });
  }

  // 6. FOOTER WATERMARK WITH LOGO ICON (Clean Dynamic Placement)
  const footerText = 'VALTRACKER.GG  •  TRACK YOUR VALORANT STATS';
  ctx.font = '700 12px "Orbitron", "Rajdhani", sans-serif';
  const textWidth = ctx.measureText(footerText).width;
  const iconSize = 18;
  const iconGap = 8;
  const totalFooterW = (logoImg ? iconSize + iconGap : 0) + textWidth;
  const footerStartX = logicalWidth - paddingX - totalFooterW;

  if (logoImg) {
    ctx.drawImage(logoImg, footerStartX, logicalHeight - 44, iconSize, iconSize);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '700 12px "Orbitron", "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(footerText, footerStartX + (logoImg ? iconSize + iconGap : 0), logicalHeight - 30);
}

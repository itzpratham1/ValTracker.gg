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

// ─── Hex color → "r, g, b" string ───────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return '255, 255, 255';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Draw a premium stat card ─────────────────────────────────────────────────
function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, value: string, sub: string,
  color: string, pct: number,
  isRank = false
) {
  const rgb = hexToRgb(color);

  // Card background
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, 16);
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, `rgba(${rgb}, 0.09)`);
  bg.addColorStop(0.4, 'rgba(8, 8, 16, 0.96)');
  bg.addColorStop(1, 'rgba(4, 4, 10, 0.99)');
  ctx.fillStyle = bg;
  ctx.fill();

  // Outer border
  ctx.strokeStyle = `rgba(${rgb}, 0.22)`;
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, x, y, w, h, 16);
  ctx.stroke();

  // Top-edge highlight
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 1);
  ctx.lineTo(x + w - 16, y + 1);
  ctx.strokeStyle = `rgba(${rgb}, 0.35)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Inner left glow strip
  ctx.save();
  const innerGlow = ctx.createLinearGradient(x, y, x + w * 0.5, y);
  innerGlow.addColorStop(0, `rgba(${rgb}, 0.14)`);
  innerGlow.addColorStop(1, 'transparent');
  drawRoundRect(ctx, x, y, w * 0.5, h, [16, 0, 0, 16]);
  ctx.fillStyle = innerGlow;
  ctx.fill();
  ctx.restore();

  // Left accent bar (8 px, full glow)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  const barGrad = ctx.createLinearGradient(x, y, x, y + h);
  barGrad.addColorStop(0, color);
  barGrad.addColorStop(0.6, color);
  barGrad.addColorStop(1, `rgba(${rgb}, 0.3)`);
  drawRoundRect(ctx, x, y + 12, 7, h - 24, 3);
  ctx.fillStyle = barGrad;
  ctx.fill();
  ctx.restore();

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.font = `700 10px 'DM Mono', 'Courier New', monospace`;
  ctx.letterSpacing = '1.6px';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 26);
  ctx.letterSpacing = '0px';

  // Value (massive glowing number)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 28;
  ctx.fillStyle = color;
  if (isRank) {
    const fz = value.length > 11 ? 20 : value.length > 8 ? 24 : 28;
    ctx.font = `900 ${fz}px 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif`;
    ctx.fillText(value, x + w / 2, y + h * 0.57);
  } else {
    ctx.font = `900 62px 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif`;
    ctx.fillText(value, x + w / 2, y + h * 0.63);
  }
  ctx.restore();

  // Progress bar (skip for rank)
  if (!isRank && pct > 0) {
    const bx = x + 18, by = y + h - 28, bw = w - 36, bh = 6;
    drawRoundRect(ctx, bx, by, bw, bh, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fill();
    const fw = Math.max(6, Math.round(bw * pct / 100));
    ctx.save();
    const fg = ctx.createLinearGradient(bx, by, bx + fw, by);
    fg.addColorStop(0, `rgba(${rgb}, 0.55)`);
    fg.addColorStop(1, color);
    drawRoundRect(ctx, bx, by, fw, bh, 3);
    ctx.fillStyle = fg;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  // Sub-label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.font = `600 10px 'DM Mono', 'Courier New', monospace`;
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'center';
  ctx.fillText(sub, x + w / 2, y + h - 10);
  ctx.letterSpacing = '0px';
}

// ─── Draw an agent card ───────────────────────────────────────────────────────
function drawAgentCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  agent: { name: string; iconUrl?: string; matches: number; winRate: number },
  icon: HTMLImageElement | null
) {
  const wrColor = getWRColor(agent.winRate);
  const roleColor = getRoleColor(getAgentRoleName(agent.name));
  const rgb = hexToRgb(wrColor);

  // Card bg
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, 16);
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, `rgba(${rgb}, 0.1)`);
  bg.addColorStop(1, 'rgba(5, 5, 12, 0.97)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb}, 0.2)`;
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.restore();

  // Avatar
  const avR = h * 0.36;
  const avCX = x + 14 + avR;
  const avCY = y + h / 2;

  ctx.save();
  ctx.shadowColor = roleColor;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = roleColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
  ctx.clip();
  if (icon) {
    ctx.drawImage(icon, avCX - avR, avCY - avR, avR * 2, avR * 2);
  } else {
    ctx.fillStyle = `rgba(${hexToRgb(roleColor)}, 0.3)`;
    ctx.fill();
  }
  ctx.restore();

  // Agent name & matches
  const textX = x + 14 + avR * 2 + 14;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 16px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'left';
  ctx.fillText(agent.name.toUpperCase(), textX, y + h * 0.38);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.font = `600 11px 'DM Mono', 'Courier New', monospace`;
  ctx.fillText(`${agent.matches} MATCHES`, textX, y + h * 0.58);

  // WR badge
  const bW = 72, bH = 22;
  const bX = x + w - bW - 12, bY = y + 10;
  ctx.save();
  ctx.shadowColor = wrColor;
  ctx.shadowBlur = 8;
  drawRoundRect(ctx, bX, bY, bW, bH, 8);
  const wrBgColor = agent.winRate >= 50
    ? 'rgba(34,197,94,0.18)'
    : agent.winRate >= 40
      ? 'rgba(245,158,11,0.18)'
      : 'rgba(239,68,68,0.18)';
  ctx.fillStyle = wrBgColor;
  ctx.fill();
  ctx.strokeStyle = wrColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = wrColor;
  ctx.font = `800 11px 'DM Mono', 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`${agent.winRate}% WR`, bX + bW / 2, bY + 15);
  ctx.restore();

  // Progress bar
  const pX = textX, pY = y + h - 14;
  const pW = w - (textX - x) - 14;
  const pH = 7;
  drawRoundRect(ctx, pX, pY, pW, pH, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fill();
  const fw = Math.max(6, Math.round(pW * Math.min(100, agent.winRate) / 100));
  ctx.save();
  const pg = ctx.createLinearGradient(pX, pY, pX + fw, pY);
  pg.addColorStop(0, `rgba(${rgb}, 0.55)`);
  pg.addColorStop(1, wrColor);
  drawRoundRect(ctx, pX, pY, fw, pH, 3);
  ctx.fillStyle = pg;
  ctx.shadowColor = wrColor;
  ctx.shadowBlur = 9;
  ctx.fill();
  ctx.restore();
}

/**
 * Render Profile / Act Stats Card — Premium Redesign
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

  // Stat Grid — using premium drawStatCard helper
  const gridY = leftPanelY + 125;
  const cols = 3;
  const statBoxW = (bannerW - (cols - 1) * 16) / cols;
  const statBoxH = isSquare ? 118 : 125;

  const matchKdNum = parseFloat(data.kd) || 1.0;
  const statsList = [
    {
      label: 'K / D / A',
      val: `${data.kills}/${data.deaths}/${data.assists}`,
      sub: 'ELIMINATIONS',
      color: '#38BDF8',
      pct: 85
    },
    {
      label: 'K/D RATIO',
      val: data.kd,
      sub: matchKdNum >= 1.05 ? 'HIGH IMPACT' : matchKdNum >= 0.85 ? 'AVERAGE' : 'LOW',
      color: getKDColor(matchKdNum),
      pct: Math.min(100, Math.max(8, Math.round((matchKdNum / 2.0) * 100)))
    },
    {
      label: 'AVG ACS',
      val: `${data.acs}`,
      sub: 'COMBAT SCORE',
      color: theme.accent,
      pct: Math.min(100, Math.max(8, Math.round(((data.acs || 0) / 350) * 100)))
    },
    {
      label: 'HEADSHOT %',
      val: `${data.hsPct}%`,
      sub: 'ACCURACY',
      color: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#94A3B8',
      pct: Math.min(100, Math.max(8, Math.round((data.hsPct / 45) * 100)))
    },
    {
      label: 'ADR',
      val: `${data.adr}`,
      sub: 'DAMAGE / ROUND',
      color: '#A855F7',
      pct: Math.min(100, Math.max(8, Math.round(((data.adr || 0) / 200) * 100)))
    },
    {
      label: 'PERF GRADE',
      val: data.perfGrade || 'S',
      sub: 'RATING',
      color: theme.accent,
      pct: 100
    }
  ];

  statsList.forEach((st, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const sx = paddingX + col * (statBoxW + 16);
    const sy = gridY + row * (statBoxH + 16);
    drawStatCard(ctx, sx, sy, statBoxW, statBoxH, st.label, st.val, st.sub, st.color, st.pct);
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
 * Render Profile / Act Stats Card — Premium Redesign
 */
export async function renderProfileCardToCanvas(
  canvas: HTMLCanvasElement,
  data: ProfileExportData,
  theme: ExportTheme,
  options: { format?: '16:9' | '1:1' } = {}
): Promise<void> {
  const isSquare = options.format === '1:1';
  const W = isSquare ? 1080 : 1920;
  const H = 1080;
  const dpr = 1.5;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // ── Layout constants ──────────────────────────────────────────────────────
  const PAD = isSquare ? 44 : 60;
  const CW = W - PAD * 2;
  const GAP = 16;

  // ── Preload images ────────────────────────────────────────────────────────
  const logoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/logo.png`
    : '/logo.png';
  const [logoImg, curRankImg, peakRankImg, bannerImg, ...agentImgs] = await Promise.all([
    loadImage(logoUrl),
    loadImage(data.currentRankImgUrl),
    loadImage(data.peakRankImgUrl),
    loadImage(data.playerBannerUrl),
    ...(data.topAgents || []).map(a => loadImage(a.iconUrl))
  ]);

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  // Base fill
  ctx.fillStyle = '#040408';
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  drawTacticalMeshPattern(ctx, W, H);

  // Rank-color ambient bottom glow
  const rankRgb = getRankRgb(data.currentRank);
  {
    const glow = ctx.createRadialGradient(W / 2, H + 80, 60, W / 2, H + 80, isSquare ? 820 : 1100);
    glow.addColorStop(0, `rgba(${rankRgb}, 0.28)`);
    glow.addColorStop(0.45, `rgba(${rankRgb}, 0.07)`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // Theme-color top-left radial
  {
    const tGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, isSquare ? 500 : 700);
    tGlow.addColorStop(0, `rgba(${hexToRgb(theme.accent)}, 0.12)`);
    tGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = tGlow;
    ctx.fillRect(0, 0, W, H);
  }

  // Vignette
  {
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, Math.max(W, H) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // Left accent stripe
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 32;
  const stripeGrad = ctx.createLinearGradient(0, 0, 0, H);
  stripeGrad.addColorStop(0, theme.accent);
  stripeGrad.addColorStop(0.5, theme.accent);
  stripeGrad.addColorStop(1, `rgba(${hexToRgb(theme.accent)}, 0.3)`);
  ctx.fillStyle = stripeGrad;
  ctx.fillRect(0, 28, 6, H - 56);
  ctx.restore();

  // ── HEADER ────────────────────────────────────────────────────────────────
  const HY = 38;

  if (logoImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.25)';
    ctx.shadowBlur = 10;
    ctx.drawImage(logoImg, PAD, HY, 36, 36);
    ctx.restore();
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 20px 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif`;
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText('VALTRACKER.GG', PAD + (logoImg ? 46 : 0), HY + 26);
  ctx.letterSpacing = '0px';

  // Theme badge
  const bdW = isSquare ? 172 : 195;
  const bdH = 34;
  const bdX = W - PAD - bdW;
  const bdY = HY + 1;
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 18;
  drawRoundRect(ctx, bdX, bdY, bdW, bdH, 17);
  const bdGrad = ctx.createLinearGradient(bdX, bdY, bdX + bdW, bdY);
  bdGrad.addColorStop(0, `rgba(${hexToRgb(theme.accent)}, 0.22)`);
  bdGrad.addColorStop(1, `rgba(${hexToRgb(theme.accent)}, 0.06)`);
  ctx.fillStyle = bdGrad;
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = theme.accent;
  ctx.font = `800 11px 'DM Mono', 'Courier New', monospace`;
  ctx.letterSpacing = '1.2px';
  ctx.textAlign = 'center';
  ctx.fillText(theme.badge, bdX + bdW / 2, bdY + 22);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // ── HERO BANNER ───────────────────────────────────────────────────────────
  const bnrY = 90;
  const bnrH = isSquare ? 158 : 172;
  const bnrR = 20;

  // Clip + draw banner image
  ctx.save();
  drawRoundRect(ctx, PAD, bnrY, CW, bnrH, bnrR);
  ctx.clip();

  if (bannerImg) {
    const bAsp = bannerImg.width / bannerImg.height;
    const bDH = bnrH;
    const bDW = bDH * bAsp;
    ctx.globalAlpha = 0.55;
    ctx.drawImage(bannerImg, PAD + (CW - bDW) / 2, bnrY, bDW, bDH);
    ctx.globalAlpha = 1;
  }

  // Dark overlay gradient left-to-right
  const bnrOvl = ctx.createLinearGradient(PAD, bnrY, PAD + CW, bnrY);
  bnrOvl.addColorStop(0, 'rgba(3, 3, 8, 0.97)');
  bnrOvl.addColorStop(0.38, 'rgba(3, 3, 8, 0.78)');
  bnrOvl.addColorStop(0.68, 'rgba(3, 3, 8, 0.5)');
  bnrOvl.addColorStop(1, 'rgba(3, 3, 8, 0.96)');
  ctx.fillStyle = bnrOvl;
  ctx.fill();

  // Rank color fan from right edge
  const rkFan = ctx.createRadialGradient(
    PAD + CW - 60, bnrY + bnrH / 2, 10,
    PAD + CW - 60, bnrY + bnrH / 2, CW * 0.72
  );
  rkFan.addColorStop(0, `rgba(${rankRgb}, 0.38)`);
  rkFan.addColorStop(0.45, `rgba(${rankRgb}, 0.1)`);
  rkFan.addColorStop(1, 'transparent');
  ctx.fillStyle = rkFan;
  ctx.fill();
  ctx.restore();

  // Banner border
  drawRoundRect(ctx, PAD, bnrY, CW, bnrH, bnrR);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top highlight line on banner
  ctx.beginPath();
  ctx.moveTo(PAD + bnrR, bnrY + 1);
  ctx.lineTo(PAD + CW - bnrR, bnrY + 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Current rank icon
  const rkSz = isSquare ? 94 : 108;
  const rkX = PAD + 18;
  const rkY = bnrY + (bnrH - rkSz) / 2;

  if (curRankImg) {
    ctx.save();
    ctx.shadowColor = getRankColor(data.currentRank);
    ctx.shadowBlur = 28;
    ctx.drawImage(curRankImg, rkX, rkY, rkSz, rkSz);
    ctx.restore();
  }

  const nameX = PAD + (curRankImg ? rkSz + 26 : 18);
  const nameMidY = bnrY + bnrH / 2;

  // Player name
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.28)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${isSquare ? 50 : 58}px 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(data.playerName.toUpperCase(), nameX, nameMidY - 4);
  ctx.restore();

  // Tag
  ctx.fillStyle = theme.accent;
  ctx.font = `700 ${isSquare ? 20 : 23}px 'DM Mono', 'Courier New', monospace`;
  ctx.fillText(`#${data.playerTag.toUpperCase()}`, nameX, nameMidY + (isSquare ? 30 : 36));

  // Peak rank badge
  if (data.peakRank && data.peakRank.toLowerCase() !== 'unranked') {
    const prW = isSquare ? 206 : 246;
    const prH = isSquare ? 84 : 96;
    const prX = PAD + CW - prW - 16;
    const prY2 = bnrY + (bnrH - prH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(255,215,0,0.45)';
    ctx.shadowBlur = 22;
    drawRoundRect(ctx, prX, prY2, prW, prH, 16);
    const prBg = ctx.createLinearGradient(prX, prY2, prX, prY2 + prH);
    prBg.addColorStop(0, 'rgba(255,215,0,0.2)');
    prBg.addColorStop(1, 'rgba(255,215,0,0.06)');
    ctx.fillStyle = prBg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.52)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pIconSz = isSquare ? 58 : 68;
    if (peakRankImg) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 26;
      ctx.drawImage(peakRankImg, prX + 12, prY2 + (prH - pIconSz) / 2, pIconSz, pIconSz);
      ctx.restore();
    }

    const prTX = prX + (peakRankImg ? pIconSz + 18 : 14);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `700 10px 'DM Mono', 'Courier New', monospace`;
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'left';
    ctx.fillText('PEAK RANK', prTX, prY2 + (isSquare ? 30 : 34));
    ctx.letterSpacing = '0px';

    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255,215,0,0.7)';
    ctx.shadowBlur = 14;
    ctx.font = `900 ${isSquare ? 16 : 18}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
    ctx.fillText((data.peakRank || '').toUpperCase(), prTX, prY2 + (isSquare ? 54 : 62));
    ctx.restore();
  }

  // ── CUSTOM HEADLINE ───────────────────────────────────────────────────────
  let contentY = bnrY + bnrH + 22;

  if (data.customHeadline) {
    ctx.save();
    drawRoundRect(ctx, PAD, contentY, CW, 46, 12);
    const hlBg = ctx.createLinearGradient(PAD, contentY, PAD + CW, contentY);
    hlBg.addColorStop(0, `rgba(${hexToRgb(theme.accent)}, 0.22)`);
    hlBg.addColorStop(1, `rgba(${hexToRgb(theme.accent)}, 0.06)`);
    ctx.fillStyle = hlBg;
    ctx.fill();
    ctx.strokeStyle = theme.titleBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 14;
    ctx.fillStyle = theme.titleColor;
    ctx.font = `900 18px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'left';
    ctx.fillText(data.customHeadline.toUpperCase(), PAD + 18, contentY + 30);
    ctx.letterSpacing = '0px';
    ctx.restore();

    contentY += 62;
  }

  // ── STAT CARDS GRID ───────────────────────────────────────────────────────
  const cols = isSquare ? 2 : 3;
  const cardW = (CW - (cols - 1) * GAP) / cols;
  const cardH = isSquare ? 130 : 155;

  const kdNum = typeof data.kdRatio === 'number'
    ? data.kdRatio
    : parseFloat(String(data.kdRatio)) || 1.0;

  const profileStats = [
    {
      label: 'MATCHES PLAYED',
      val: `${data.matchesPlayed}`,
      sub: `${data.wins}W · ${data.losses}L`,
      color: '#38BDF8',
      pct: Math.min(100, Math.max(8, Math.round((data.matchesPlayed / 50) * 100)))
    },
    {
      label: 'WIN RATE',
      val: `${data.winRate}%`,
      sub: data.winRate >= 50 ? 'POSITIVE' : data.winRate >= 40 ? 'BELOW AVG' : 'CRITICAL',
      color: getWRColor(data.winRate),
      pct: Math.min(100, Math.max(8, data.winRate))
    },
    {
      label: 'K/D RATIO',
      val: typeof data.kdRatio === 'number' ? data.kdRatio.toFixed(2) : `${data.kdRatio}`,
      sub: kdNum >= 1.05 ? 'HIGH IMPACT' : kdNum >= 0.85 ? 'AVERAGE' : 'LOW',
      color: getKDColor(kdNum),
      pct: Math.min(100, Math.max(8, Math.round((kdNum / 2.0) * 100)))
    },
    {
      label: 'AVG ACS',
      val: `${Math.round(data.avgAcs || 0)}`,
      sub: 'COMBAT SCORE',
      color: theme.accent,
      pct: Math.min(100, Math.max(8, Math.round(((data.avgAcs || 0) / 350) * 100)))
    },
    {
      label: 'HEADSHOT %',
      val: `${data.hsPct}%`,
      sub: 'ACCURACY',
      color: data.hsPct >= 20 ? '#22C55E' : data.hsPct >= 15 ? '#F59E0B' : '#94A3B8',
      pct: Math.min(100, Math.max(8, Math.round((data.hsPct / 45) * 100)))
    },
    {
      label: 'CURRENT RANK',
      val: (data.currentRank || 'UNRANKED').toUpperCase(),
      sub: data.currentRR != null ? `${data.currentRR} RR` : 'RATING',
      color: getRankColor(data.currentRank),
      pct: 100,
      isRank: true
    }
  ];

  profileStats.forEach((st, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = PAD + col * (cardW + GAP);
    const cy = contentY + row * (cardH + GAP);
    drawStatCard(ctx, cx, cy, cardW, cardH, st.label, st.val, st.sub, st.color, st.pct, st.isRank);
  });

  const totalRows = Math.ceil(profileStats.length / cols);
  let nextY = contentY + totalRows * (cardH + GAP) - GAP + 22;

  // ── AGENTS SECTION ────────────────────────────────────────────────────────
  if (data.topAgents && data.topAgents.length > 0) {
    // Section header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = `900 12px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
    ctx.letterSpacing = '2.8px';
    ctx.textAlign = 'left';
    ctx.fillText('MOST PLAYED AGENTS', PAD, nextY + 13);
    ctx.letterSpacing = '0px';
    nextY += 24;

    const agCols = 3;
    const agGap = GAP;
    const agW = (CW - (agCols - 1) * agGap) / agCols;
    const agH = isSquare ? 96 : 108;

    data.topAgents.slice(0, 3).forEach((ag, idx) => {
      const ax = PAD + idx * (agW + agGap);
      drawAgentCard(ctx, ax, nextY, agW, agH, ag, agentImgs[idx] || null);
    });

    nextY += agH;
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footY = H - 34;
  if (logoImg) {
    ctx.globalAlpha = 0.5;
    ctx.drawImage(logoImg, PAD, footY - 14, 16, 16);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.font = `600 11px 'DM Mono', 'Courier New', monospace`;
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'left';
  ctx.fillText(
    'VALTRACKER.GG  ·  TRACK YOUR VALORANT STATS',
    PAD + (logoImg ? 24 : 0),
    footY
  );
  ctx.letterSpacing = '0px';
}

<script>
  import { tick } from 'svelte';
  import { createShareCard } from '../../lib/api';
  import { getAgentIconUrl, getMapImg } from '../../lib/assets';
  import { getRankImgUrl, getRankFromRR } from '../../lib/constants';
  import { formatMatchDate, getPlayerList } from '../../lib/utils';

  export let match = null;
  export let playerName = '';
  export let playerTag = '';
  export let allPlayers = [];
  export let rawMatch = null;
  export let playerBannerUrl = '';
  export let playerLevel = '';
  export let onClose = () => {};

  let loading = true;
  let loaded = false;
  let loadingTxt = 'GENERATING & UPLOADING REPORT...';
  let imgPreview = '';
  let templateText = '';
  let shareUrl = '';
  let shareId = '';
  let clipboardVisible = false;

  let outcome = 'DEFEAT';
  let kd = '0.00';
  let acs = 0;
  let hsPct = 0;
  let combatRating = 0;
  let ratingColor = '#ff4655';
  let perfGrade = 'B';
  let perfGradeColor = '#ff4655';
  let perfGradeBg = 'rgba(255, 70, 85, 0.15)';
  let perfGradeBorder = 'rgba(255, 70, 85, 0.4)';
  let perfGradeGlow = 'rgba(255, 70, 85, 0.2)';

  let isMatchMVP = false;
  let isTeamMVP = false;

  let coolTitle = '🏆 VICTORIOUS TACTICIAN';
  let titleColor = '#3ecf8e';
  let titleBg = 'linear-gradient(90deg, rgba(62, 207, 142, 0.2) 0%, rgba(62, 207, 142, 0.02) 100%)';
  let titleBorder = 'rgba(62, 207, 142, 0.4)';

  let accentColor = '#ff4655';
  let accentShadow = 'rgba(255, 70, 85, 0.35)';
  let themeName = 'OBSIDIAN';

  let mapImg = '';
  let agentIcon = '';
  let userRank = 'Unranked';
  let userRankImg = '';
  let rankName = 'Unknown';
  let rankImg = '';
  let playerLevelStr = '';

  let featsHtml = '';
  let roundDotsHtml = '';
  let alliedRowsHtml = '';
  let enemyRowsHtml = '';

  $: if (match) generateCard();

  const TIER_RR_MAP = {
    'Iron 1': 3, 'Iron 2': 4, 'Iron 3': 5,
    'Bronze 1': 6, 'Bronze 2': 7, 'Bronze 3': 8,
    'Silver 1': 9, 'Silver 2': 10, 'Silver 3': 11,
    'Gold 1': 12, 'Gold 2': 13, 'Gold 3': 14,
    'Platinum 1': 15, 'Platinum 2': 16, 'Platinum 3': 17,
    'Diamond 1': 18, 'Diamond 2': 19, 'Diamond 3': 20,
    'Ascendant 1': 21, 'Ascendant 2': 22, 'Ascendant 3': 23,
    'Immortal 1': 24, 'Immortal 2': 25, 'Immortal 3': 26,
    'Radiant': 27
  };

  function getTierRR(tierName) {
    const id = TIER_RR_MAP[tierName];
    return id != null ? (id - 3) * 100 : null;
  }

  function getLobbyRankInfo(players, myTeamId) {
    const withRank = players.filter(p =>
      p.currenttier_patched && p.currenttier_patched !== 'Unranked' && p.currenttier && p.currenttier > 0
    );
    if (!withRank.length) return null;
    const avgTierRR = (arr) => {
      if (!arr.length) return null;
      const total = arr.reduce((s, p) => {
        const rr = getTierRR(p.currenttier_patched) || ((p.currenttier || 3) - 3) * 100;
        return s + rr;
      }, 0);
      return Math.round(total / arr.length);
    };
    const allAvg = avgTierRR(withRank);
    return allAvg != null ? getRankFromRR(allAvg) : null;
  }

  async function generateCard() {
    if (!match) return;
    loading = true;
    loaded = false;
    loadingTxt = 'GENERATING & UPLOADING REPORT...';

    const m = match;
    const pl = allPlayers || [];
    const plist = rawMatch ? getPlayerList(rawMatch) : pl;

    const totalRoundsFromScore = String(m.rounds || '1-1').split('-').reduce((a, b) => Number(a) + Number(b), 0);
    acs = m.acs || Math.round((m.score || 0) / Math.max(1, totalRoundsFromScore));
    hsPct = m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
    kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);

    combatRating = Math.min(10, (parseFloat(kd) * 2.8 + acs / 75 + hsPct / 12).toFixed(1));
    ratingColor = combatRating >= 8.2 ? '#e8ff47' : combatRating >= 6.2 ? '#3ecf8e' : '#ff4655';

    perfGrade = 'B';
    perfGradeColor = '#ff4655';
    perfGradeBg = 'rgba(255, 70, 85, 0.15)';
    perfGradeBorder = 'rgba(255, 70, 85, 0.4)';
    perfGradeGlow = 'rgba(255, 70, 85, 0.2)';

    if (combatRating >= 9.0) {
      perfGrade = 'S+'; perfGradeColor = '#ffd700';
      perfGradeBg = 'rgba(255, 215, 0, 0.2)';
      perfGradeBorder = 'rgba(255, 215, 0, 0.6)';
      perfGradeGlow = 'rgba(255, 215, 0, 0.4)';
    } else if (combatRating >= 8.0) {
      perfGrade = 'S'; perfGradeColor = '#e8ff47';
      perfGradeBg = 'rgba(232, 255, 71, 0.2)';
      perfGradeBorder = 'rgba(232, 255, 71, 0.6)';
      perfGradeGlow = 'rgba(232, 255, 71, 0.3)';
    } else if (combatRating >= 6.8) {
      perfGrade = 'A'; perfGradeColor = '#3ecf8e';
      perfGradeBg = 'rgba(62, 207, 142, 0.15)';
      perfGradeBorder = 'rgba(62, 207, 142, 0.5)';
      perfGradeGlow = 'rgba(62, 207, 142, 0.25)';
    } else if (combatRating >= 5.0) {
      perfGrade = 'B'; perfGradeColor = '#ffb01f';
      perfGradeBg = 'rgba(255, 176, 31, 0.15)';
      perfGradeBorder = 'rgba(255, 176, 31, 0.5)';
      perfGradeGlow = 'rgba(255, 176, 31, 0.2)';
    } else {
      perfGrade = 'C'; perfGradeColor = '#ff4655';
      perfGradeBg = 'rgba(255, 70, 85, 0.15)';
      perfGradeBorder = 'rgba(255, 70, 85, 0.5)';
      perfGradeGlow = 'rgba(255, 70, 85, 0.2)';
    }

    outcome = m.won ? 'VICTORY' : 'DEFEAT';

    // MVP detection
    const totalRounds = (rawMatch?.rounds || []).length || 1;
    const getACS = p => Math.round((p.stats?.score || 0) / totalRounds);
    const matchMVPPlayer = plist.length ? plist.reduce((b, p) => getACS(p) > getACS(b) ? p : b, plist[0]) : null;
    const alliedPlayers = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
    const teamMVPPlayer = alliedPlayers.length ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0]) : null;

    isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();

    // Asset URLs
    agentIcon = getAgentIconUrl(m.agentName) || '';
    mapImg = getMapImg(m.map) || '';

    // Player rank
    const meC = plist.find(p => p.name?.toLowerCase() === playerName.toLowerCase() && p.tag?.toLowerCase() === playerTag.toLowerCase());
    userRank = meC?.currenttier_patched || meC?.tier || 'Unranked';
    userRankImg = getRankImgUrl(userRank) || '';

    // Lobby average rank
    const rankInfo = getLobbyRankInfo(plist, m.myTeamId);
    rankName = rankInfo?.name || 'Unknown';
    rankImg = getRankImgUrl(rankName) || '';

    playerLevelStr = playerLevel || '—';

    // --- FEATS EXTRACTION ---
    const rounds = rawMatch?.rounds || [];
    let doubleKills = 0, tripleKills = 0, quadKills = 0, aces = 0, clutchesCount = 0;

    const myPuuid = meC?.puuid || meC?.subject || meC?.id || '';
    const myPuuids = [meC?.puuid, meC?.subject, meC?.id, myPuuid].filter(Boolean);
    const teammatePuuids = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId && !myPuuids.includes(p.puuid)).map(p => p.puuid);

    rounds.forEach((r) => {
      const myWon = (r.winning_team || r.winningTeam || '').toLowerCase() === m.myTeamId;
      const playerStats = r.player_stats || [];
      const myPs = myPuuid ? playerStats.find(p => (p.player_puuid || p.subject || p.puuid || p.player_id) === myPuuid) : null;
      const killEvents = myPs?.kill_events || [];
      const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);

      if (myKills === 2) doubleKills++;
      else if (myKills === 3) tripleKills++;
      else if (myKills === 4) quadKills++;
      else if (myKills >= 5) aces++;

      let tmDeaths = 0, meDied = false;
      playerStats.forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          const victim = k.victim_puuid || k.victim;
          if (victim && myPuuids.includes(victim)) meDied = true;
          if (victim && teammatePuuids.includes(victim)) tmDeaths++;
        });
      });

      if (myWon && tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) {
        clutchesCount++;
      }
    });

    // --- DYNAMIC PERFORMANCE TITLES ---
    coolTitle = '🏆 VICTORIOUS TACTICIAN';
    titleColor = '#3ecf8e';
    titleBg = 'linear-gradient(90deg, rgba(62, 207, 142, 0.2) 0%, rgba(62, 207, 142, 0.02) 100%)';
    titleBorder = 'rgba(62, 207, 142, 0.4)';

    if (m.won) {
      if (aces > 0) {
        coolTitle = '👑 CHAMPION ACE'; titleColor = '#ffd700';
        titleBg = 'linear-gradient(90deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.02) 100%)';
        titleBorder = 'rgba(255, 215, 0, 0.5)';
      } else if (clutchesCount >= 2) {
        coolTitle = '⚡ CLUTCH LEGEND'; titleColor = '#ffd700';
        titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.25) 0%, rgba(232, 255, 71, 0.02) 100%)';
        titleBorder = 'rgba(232, 255, 71, 0.5)';
      } else if (kd >= 2.0) {
        coolTitle = '🔥 UNSTOPPABLE APEX'; titleColor = '#ff5c6a';
        titleBg = 'linear-gradient(90deg, rgba(255, 92, 106, 0.18) 0%, rgba(255, 92, 106, 0.02) 100%)';
        titleBorder = 'rgba(255, 92, 106, 0.5)';
      } else if (kd >= 1.5 && isMatchMVP) {
        coolTitle = '🧬 MATCH COLOSSUS'; titleColor = '#c084fc';
        titleBg = 'linear-gradient(90deg, rgba(192, 132, 252, 0.18) 0%, rgba(192, 132, 252, 0.02) 100%)';
        titleBorder = 'rgba(192, 132, 252, 0.5)';
      } else if (kd >= 1.25) {
        coolTitle = '💥 SQUAD CARRY'; titleColor = '#e8ff47';
        titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.22) 0%, rgba(232, 255, 71, 0.02) 100%)';
        titleBorder = 'rgba(232, 255, 71, 0.5)';
      } else if (isMatchMVP) {
        coolTitle = '👑 MATCH MVP'; titleColor = '#e8ff47';
        titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.2) 0%, rgba(232, 255, 71, 0.02) 100%)';
        titleBorder = 'rgba(232, 255, 71, 0.4)';
      } else if (isTeamMVP) {
        coolTitle = '⭐ TEAM MVP'; titleColor = '#ffb01f';
        titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.2) 0%, rgba(255, 176, 31, 0.02) 100%)';
        titleBorder = 'rgba(255, 176, 31, 0.4)';
      } else if (m.assists >= 8) {
        coolTitle = '🛡️ TACTICAL ANCHOR'; titleColor = '#38bdf8';
        titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.02) 100%)';
        titleBorder = 'rgba(56, 189, 248, 0.4)';
      }
    } else {
      if (aces > 0) {
        coolTitle = '👑 HEROIC ACE'; titleColor = '#ffd700';
        titleBg = 'linear-gradient(90deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 215, 0, 0.02) 100%)';
        titleBorder = 'rgba(255, 215, 0, 0.5)';
      } else if (clutchesCount >= 1) {
        coolTitle = '⚡ CLUTCH SENTINEL'; titleColor = '#ffd700';
        titleBg = 'linear-gradient(90deg, rgba(232, 255, 71, 0.25) 0%, rgba(232, 255, 71, 0.02) 100%)';
        titleBorder = 'rgba(232, 255, 71, 0.5)';
      } else if (kd >= 1.5) {
        coolTitle = '💔 VALIANT HERO'; titleColor = '#ff5c6a';
        titleBg = 'linear-gradient(90deg, rgba(255, 92, 106, 0.18) 0%, rgba(255, 92, 106, 0.02) 100%)';
        titleBorder = 'rgba(255, 92, 106, 0.5)';
      } else if (kd >= 1.1) {
        coolTitle = '⚔️ UNYIELDING DEFENDER'; titleColor = '#ffb01f';
        titleBg = 'linear-gradient(90deg, rgba(255, 176, 31, 0.15) 0%, rgba(255, 176, 31, 0.02) 100%)';
        titleBorder = 'rgba(255, 176, 31, 0.3)';
      } else if (m.assists >= 8) {
        coolTitle = '🛡️ SUPPORT PILLAR'; titleColor = '#38bdf8';
        titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.02) 100%)';
        titleBorder = 'rgba(56, 189, 248, 0.4)';
      } else {
        coolTitle = '📈 REBOUND WARRIOR'; titleColor = '#38bdf8';
        titleBg = 'linear-gradient(90deg, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.02) 100%)';
        titleBorder = 'rgba(56, 189, 248, 0.5)';
      }
    }

    // --- THEME ACCENT COLOR ---
    accentColor = '#ff4655';
    accentShadow = 'rgba(255, 70, 85, 0.35)';
    themeName = 'OBSIDIAN';

    if (isMatchMVP) {
      accentColor = '#ffd700'; accentShadow = 'rgba(255, 215, 0, 0.45)'; themeName = 'GOLD';
    } else if (isTeamMVP || perfGrade === 'S+' || perfGrade === 'S') {
      accentColor = '#e8ff47'; accentShadow = 'rgba(232, 255, 71, 0.45)'; themeName = 'NEON';
    } else if (m.won || perfGrade === 'A') {
      accentColor = '#3ecf8e'; accentShadow = 'rgba(62, 207, 142, 0.4)'; themeName = 'EMERALD';
    }

    // Post text
    const mapStr = m.map ? m.map.toUpperCase() : 'VALORANT';
    const agentStr = m.agentName ? m.agentName.toUpperCase() : 'Agent';

    if (m.won) {
      if (isMatchMVP) {
        templateText = `👑 UNSTOPPABLE MATCH MVP! Secured a huge ${m.rounds} VICTORY on ${mapStr} playing as ${agentStr} with a ${combatRating}/10 combat rating! Check my deep stats on ValTracker:`;
      } else if (isTeamMVP) {
        templateText = `⭐ Team MVP performance! Dominated ${m.rounds} on ${mapStr} as ${agentStr} (Combat Rating: ${combatRating}/10). Telemetry via @ValTracker:`;
      } else if (kd >= 1.5) {
        templateText = `🔥 Absolutely went off! Dropped a ${kd} KD in a ${m.rounds} win on ${mapStr} as ${agentStr}. Analyze my match on ValTracker:`;
      } else {
        templateText = `🏆 Secured the dub! Clean ${m.rounds} victory on ${mapStr} playing as ${agentStr}. My telemetry card from ValTracker:`;
      }
    } else {
      if (kd >= 1.3) {
        templateText = `💔 Heartbreak defeat, but I absolutely carried. Dropped a ${kd} KD and a ${combatRating}/10 rating as ${agentStr} on ${mapStr}. Check my ValTracker report:`;
      } else {
        templateText = `📈 Tough battle on ${mapStr} as ${agentStr}. We bounce back stronger. My match stats card on ValTracker:`;
      }
    }

    // --- IMPACT FEATS HTML ---
    featsHtml = '';
    if (aces > 0 || clutchesCount > 0 || quadKills > 0 || tripleKills > 0 || doubleKills > 0) {
      featsHtml = `<div style="z-index:3;position:relative;display:flex;flex-direction:column;gap:4px;">
        <div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;line-height:1;">IMPACT FEATS</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${aces > 0 ? `<span style="background:linear-gradient(135deg,rgba(255,215,0,0.15) 0%,rgba(218,165,32,0.05) 100%);border:1px solid #ffd700;color:#ffd700;padding:3px 8px;border-radius:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 8px rgba(255,215,0,0.25);display:inline-flex;align-items:center;gap:2px;text-shadow:0 0 2px rgba(255,215,0,0.4);line-height:1;">👑 ACE x${aces}</span>` : ''}
          ${clutchesCount > 0 ? `<span style="background:linear-gradient(135deg,rgba(232,255,71,0.15) 0%,rgba(50,205,50,0.05) 100%);border:1px solid #e8ff47;color:#e8ff47;padding:3px 8px;border-radius:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 8px rgba(232,255,71,0.25);display:inline-flex;align-items:center;gap:2px;text-shadow:0 0 2px rgba(232,255,71,0.4);line-height:1;">⚡ CLUTCH x${clutchesCount}</span>` : ''}
          ${quadKills > 0 ? `<span style="background:linear-gradient(135deg,rgba(255,70,85,0.15) 0%,rgba(249,115,22,0.05) 100%);border:1px solid #ff4655;color:#ff4655;padding:3px 8px;border-radius:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 8px rgba(255,70,85,0.25);display:inline-flex;align-items:center;gap:2px;text-shadow:0 0 2px rgba(255,70,85,0.4);line-height:1;">🔥 4-KILL x${quadKills}</span>` : ''}
          ${tripleKills > 0 ? `<span style="background:linear-gradient(135deg,rgba(168,85,247,0.15) 0%,rgba(236,72,153,0.05) 100%);border:1px solid #a855f7;color:#a855f7;padding:3px 8px;border-radius:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;display:inline-flex;align-items:center;gap:2px;line-height:1;">💀 3-KILL x${tripleKills}</span>` : ''}
          ${doubleKills > 0 ? `<span style="background:linear-gradient(135deg,rgba(59,130,246,0.15) 0%,rgba(6,182,212,0.05) 100%);border:1px solid #3b82f6;color:#3b82f6;padding:3px 8px;border-radius:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;display:inline-flex;align-items:center;gap:2px;line-height:1;">💥 2-KILL x${doubleKills}</span>` : ''}
        </div>
      </div>`;
    }

    // --- ROUND TIMELINE DOTS HTML ---
    roundDotsHtml = rounds.map((r, i) => {
      const myTeamWon = (r.winning_team || r.winningTeam || '').toLowerCase() === m.myTeamId;
      const bg = myTeamWon ? 'rgba(62,207,142,0.85)' : 'rgba(255,87,87,0.7)';
      const shadow = myTeamWon ? 'rgba(62,207,142,0.3)' : 'rgba(255,87,87,0.2)';
      const rPlayerStats = r.player_stats || [];
      let rMeDied = false, rTmDeaths = 0;
      rPlayerStats.forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          const victim = k.victim_puuid || k.victim;
          if (victim && myPuuids.includes(victim)) rMeDied = true;
          if (victim && teammatePuuids.includes(victim)) rTmDeaths++;
        });
      });
      const isClutch = myTeamWon && rTmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !rMeDied;
      const border = isClutch ? '1.5px solid #ffd700' : 'none';
      const boxS = isClutch ? '0 0 6px #ffd700' : `0 1px 2px ${shadow}`;
      return `<div style="width:13px;height:13px;border-radius:50%;background:${bg};border:${border};box-shadow:${boxS};display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:7px;font-weight:bold;color:#fff;flex-shrink:0;line-height:1;">${i+1}</div>`;
    }).join('');

    // --- SCOREBOARD ROWS HTML ---
    const totalRoundsPlayed = (rawMatch?.rounds || []).length || 1;
    const alliedSorted = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId).sort((a, b) => getACS(b) - getACS(a));
    const enemySorted = plist.filter(p => (p.team || '').toLowerCase() !== m.myTeamId).sort((a, b) => getACS(b) - getACS(a));

    alliedRowsHtml = alliedSorted.map((p) => {
      const isMe = p.name?.toLowerCase() === playerName.toLowerCase() && p.tag?.toLowerCase() === playerTag.toLowerCase();
      const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
      const pACS = Math.round((p.stats?.score || 0) / totalRoundsPlayed);
      const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
      const nameColor = isMe ? '#3ecf8e' : '#fff';
      const nameWeight = isMe ? 'bold' : 'normal';
      return `<tr style="background:${isMe ? 'rgba(62, 207, 142, 0.14)' : 'rgba(255, 255, 255, 0.015)'};font-size:9.5px;font-family:'DM Mono',monospace;height:21px;">
        <td style="padding:2px 8px;border-left:${isMe ? '3px solid #3ecf8e' : '3px solid transparent'};vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:5px;">
            <img src="${charIcon}" style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;" onerror="this.style.display='none'">
            <span style="color:${nameColor};font-weight:${nameWeight};white-space:nowrap;line-height:1;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px;color:rgba(255,255,255,0.7);text-align:center;vertical-align:middle;line-height:1;">${pKDA}</td>
        <td style="padding:2px 8px;color:#fff;font-weight:bold;text-align:right;vertical-align:middle;line-height:1;">${pACS}</td>
      </tr>`;
    }).join('');

    enemyRowsHtml = enemySorted.map((p) => {
      const charIcon = getAgentIconUrl(p.character || p.agent?.name || '') || '';
      const pACS = Math.round((p.stats?.score || 0) / totalRoundsPlayed);
      const pKDA = `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`;
      return `<tr style="background:rgba(255,255,255,0.005);font-size:9.5px;font-family:'DM Mono',monospace;height:21px;">
        <td style="padding:2px 8px;border-left:3px solid transparent;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:5px;">
            <img src="${charIcon}" style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;" onerror="this.style.display='none'">
            <span style="color:#fff;white-space:nowrap;line-height:1;">${p.name}</span>
          </div>
        </td>
        <td style="padding:2px 8px;color:rgba(255,255,255,0.7);text-align:center;vertical-align:middle;line-height:1;">${pKDA}</td>
        <td style="padding:2px 8px;color:#fff;font-weight:bold;text-align:right;vertical-align:middle;line-height:1;">${pACS}</td>
      </tr>`;
    }).join('');

    await tick();

    const captureTarget = document.getElementById('export-capture-target');
    if (!captureTarget) { loading = false; return; }

    try {
      if (typeof html2canvas === 'undefined') {
        loadingTxt = 'Loading image generator...';
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const canvas = await html2canvas(captureTarget, {
        backgroundColor: null,
        scale: 1.8,
        logging: false,
        useCORS: true
      });

      imgPreview = canvas.toDataURL('image/png');
      const uploadDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          clipboardVisible = true;
        }
      } catch {
        clipboardVisible = false;
      }

      try {
        const res = await createShareCard({
          image: uploadDataUrl,
          playerName,
          playerTag,
          agentName: m.agentName,
          mapName: m.map,
          won: m.won,
          score: m.rounds
        });
        if (res.status === 'ok') {
          shareUrl = res.share_url;
          shareId = res.share_id;
          templateText = templateText + ' ' + res.share_url;
        }
      } catch (e) {
        console.error('Share upload failed:', e);
      }

      loading = false;
      loaded = true;
    } catch (e) {
      console.error('[Capture Error]', e);
      loadingTxt = 'Failed to compile infographic.';
      setTimeout(onClose, 1500);
    }
  }

  function shareToPlatform(platform) {
    const text = templateText;
    const encodedText = encodeURIComponent(text);

    if (platform === 'download') {
      const a = document.createElement('a');
      a.href = imgPreview;
      a.download = `valtracker_flex_${match?.agentName || 'agent'}_${match?.map || 'map'}_${Date.now()}.png`;
      a.click();
    } else if (platform === 'twitter') {
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      let cleanText = text;
      if (shareUrl && cleanText.includes(shareUrl)) cleanText = cleanText.replace(shareUrl, '').trim();
      const url = shareUrl
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanText)}&url=${encodeURIComponent(urlWithBuster)}`
        : `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(url, '_blank');
    } else if (platform === 'reddit') {
      const title = match?.won
        ? `[ValTracker] Secured an epic ${match?.rounds} VICTORY on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'}!`
        : `[ValTracker] Match on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'} (${match?.rounds})`;
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      const url = shareUrl
        ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(urlWithBuster)}&title=${encodeURIComponent(title)}`
        : `https://www.reddit.com/r/VALORANT/submit?title=${encodeURIComponent(title)}`;
      window.open(url, '_blank');
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="share-modal-overlay" class:open={match} on:click|self={onClose}>
  {#if match}
    <div class="share-modal">
      <div class="share-modal-header">
        <div class="share-modal-title">✨ Share Your Performance Flex Card</div>
        <button class="share-modal-close" on:click={onClose}>&#10005;</button>
      </div>

      <div class="share-modal-body">
        {#if loading}
          <div class="share-loading">
            <div class="share-spinner"></div>
            <div class="share-loading-txt">{loadingTxt}</div>
          </div>
        {/if}

        {#if loaded}
          <div class="share-loaded">
            <div class="share-preview-wrap">
              <img class="share-preview-img" src={imgPreview} alt="Flex Card Preview" />
              <div class="share-preview-badge">Flex Card Preview</div>
            </div>

            {#if clipboardVisible}
              <div class="share-clipboard-status">Copied to clipboard</div>
            {/if}

            <div>
              <div class="share-label">Post Template Text</div>
              <textarea class="share-textarea" bind:value={templateText}></textarea>
            </div>

            <div class="share-buttons">
              <button class="share-btn share-btn-twitter" on:click={() => shareToPlatform('twitter')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </button>
              <button class="share-btn share-btn-reddit" on:click={() => shareToPlatform('reddit')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.23.73 4.29 1.97 5.95l-1.39 4.16c-.1.31.18.61.5.5l4.16-1.39C8.89 21.68 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.19 12.35c-.44.44-1.15.44-1.59 0L12 11.76l-2.6 2.6c-.44.44-1.15.44-1.59 0-.44-.44-.44-1.15 0-1.59l2.6-2.6-2.6-2.6c-.44-.44-.44-1.15 0-1.59.44-.44 1.15-.44 1.59 0l2.6 2.6 2.6-2.6c.44-.44 1.15-.44 1.59 0 .44.44.44 1.15 0 1.59l-2.6 2.6 2.6 2.6c.44.44.44 1.15 0 1.59z"/></svg>
                Post on Reddit
              </button>
              <button class="share-btn share-btn-download" on:click={() => shareToPlatform('download')}>
                Download PNG
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Hidden capture target for dom-to-image-more -->
    <div id="export-capture-target" style="position:absolute;left:-9999px;top:0;width:900px;min-height:535px;">
      <div style="width:900px;min-height:535px;background:#050508;border:1.5px solid {accentColor}40;border-radius:20px;color:#fff;font-family:'Barlow Condensed',sans-serif;box-sizing:border-box;position:relative;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.95),0 0 20px {accentColor}10;display:flex;flex-direction:column;padding:24px;">

        <!-- Diagonal Watermark -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2;overflow:hidden;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:140px;font-weight:900;color:rgba(255,255,255,0.035);letter-spacing:4px;text-transform:uppercase;transform:rotate(-15deg);white-space:nowrap;user-select:none;">
            VALTRACKER
          </div>
        </div>

        <!-- Map Background Splash -->
        {#if mapImg}
          <img src={mapImg} alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.18;filter:blur(2px);pointer-events:none;z-index:0;">
        {/if}

        <!-- Radial Gradient Overlay -->
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 20% 30%, {accentColor}12 0%, rgba(10,10,15,0.96) 70%, rgba(4,4,6,0.99) 100%);z-index:1;pointer-events:none;"></div>

        <!-- Left decorative accent border -->
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:{accentColor};box-shadow:1px 0 12px {accentShadow};border-radius:20px 0 0 20px;z-index:4;"></div>

        <!-- Header Row -->
        <div style="position:relative;z-index:3;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <!-- Logo -->
            <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:none;filter:drop-shadow(0 0 8px rgba(255,70,85,0.6));"><path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655"/><polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47"/></svg>
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;letter-spacing:1.5px;color:#fff;text-transform:uppercase;line-height:1;">ValTracker</span>
            <div style="background:rgba(62,207,142,0.1);border:1px solid rgba(62,207,142,0.3);color:#3ecf8e;border-radius:4px;padding:2px 6px;font-family:'DM Mono',monospace;font-size:7.5px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 6px rgba(62,207,142,0.15);margin-left:4px;line-height:1;">VERIFIED REPORT</div>
            <!-- Player Banner + Name Capsule -->
            <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);padding:3px 10px 3px 3px;border-radius:6px;backdrop-filter:blur(4px);">
              {#if playerBannerUrl}
                <div style="background-image:url('{playerBannerUrl}');background-size:cover;background-position:center;width:75px;height:26px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);"></div>
              {/if}
              <div style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:1px;">
                <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;color:#fff;letter-spacing:0.5px;text-transform:uppercase;line-height:1;">{playerName}#{playerTag}</span>
                <span style="font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,0.4);line-height:1;">LVL {playerLevelStr}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:{accentColor};text-shadow:0 0 12px {accentShadow};letter-spacing:1.5px;text-transform:uppercase;border:1px solid {accentColor}40;padding:2px 10px;border-radius:6px;background:{accentColor}10;line-height:1;">
              {outcome} {match?.rounds || ''}
            </div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;color:#ffb01f;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(255,176,31,0.25);padding:3px 8px;border-radius:4px;background:rgba(255,176,31,0.03);line-height:1;">
              Match Report Card
            </div>
          </div>
        </div>

        <!-- Main Body -->
        <div style="position:relative;z-index:3;flex-grow:1;display:flex;gap:24px;align-items:stretch;padding-bottom:10px;">

          <!-- Left Column: Player Performance -->
          <div style="width:390px;display:flex;flex-direction:column;gap:8px;justify-content:space-between;">
            <!-- Profile + Title -->
            <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:10px 12px;">
              <div style="width:40px;height:40px;border-radius:8px;background:#101014;border:2px solid {accentColor};overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 8px {accentColor}40;">
                {#if agentIcon}
                  <img src={agentIcon} alt="" style="width:100%;height:100%;object-fit:cover;">
                {/if}
              </div>
              <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;">
                <div style="display:inline-flex;align-items:center;background:{titleBg};border:1px solid {titleBorder};padding:3px 10px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;color:{titleColor};letter-spacing:1px;text-transform:uppercase;box-shadow:0 0 8px {titleBorder === 'rgba(255,255,255,0.15)' ? 'transparent' : titleColor}40;line-height:1;">
                  {coolTitle}
                </div>
                <div style="font-family:'DM Mono',monospace;font-size:9.5px;color:rgba(255,255,255,0.4);line-height:1;">
                  Agent: {(match?.agentName || '—').toUpperCase()} · Match Date: {formatMatchDate(match?.gameStart)}
                </div>
              </div>
            </div>

            <!-- Combat Rating + Grade + MVP -->
            <div style="background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(0,0,0,0.25);">
              <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;line-height:1;">Esports Combat Rating</div>
                <div style="display:flex;align-items:baseline;gap:3px;">
                  <span style="font-family:'Barlow Condensed',sans-serif;font-size:34px;font-weight:900;color:{ratingColor};text-shadow:0 0 12px {ratingColor === '#e8ff47' ? 'rgba(232,255,71,0.25)' : ratingColor === '#3ecf8e' ? 'rgba(62,207,142,0.2)' : 'rgba(255,70,85,0.2)'};line-height:1;">{combatRating}</span>
                  <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.25);line-height:1;">/ 10</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="background:{perfGradeBg};border:1px solid {perfGradeBorder};color:{perfGradeColor};border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;box-shadow:0 0 10px {perfGradeGlow};text-shadow:0 0 4px {perfGradeColor}80;line-height:1;">
                  {perfGrade}
                </div>
                {#if isMatchMVP}
                  <div style="background:linear-gradient(135deg,rgba(255,215,0,0.15) 0%,rgba(218,165,32,0.05) 100%);border:1px solid #ffd700;color:#ffd700;border-radius:6px;padding:6px 10px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 10px rgba(255,215,0,0.3);text-shadow:0 0 2px rgba(255,215,0,0.5);line-height:1;">
                    👑 MATCH MVP
                  </div>
                {:else if isTeamMVP}
                  <div style="background:linear-gradient(135deg,rgba(232,255,71,0.15) 0%,rgba(50,205,50,0.05) 100%);border:1px solid #e8ff47;color:#e8ff47;border-radius:6px;padding:6px 10px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 0 10px rgba(232,255,71,0.3);text-shadow:0 0 2px rgba(232,255,71,0.5);line-height:1;">
                    ⭐ TEAM MVP
                  </div>
                {/if}
              </div>
            </div>

            <!-- Ranks Row -->
            <div style="display:flex;gap:10px;width:100%;z-index:3;position:relative;">
              <div style="flex:1;background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;backdrop-filter:blur(10px);">
                {#if userRankImg}
                  <img src={userRankImg} alt="" style="width:24px;height:24px;object-fit:contain;">
                {/if}
                <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;">
                  <div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">Your Rank</div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:800;color:#fff;text-transform:uppercase;line-height:1;">{userRank}</div>
                </div>
              </div>
              <div style="flex:1;background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;backdrop-filter:blur(10px);">
                {#if rankImg}
                  <img src={rankImg} alt="" style="width:24px;height:24px;object-fit:contain;">
                {/if}
                <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;">
                  <div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">Lobby Avg</div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:800;color:#fff;text-transform:uppercase;line-height:1;">{rankName}</div>
                </div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;">
              <div style="background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">K / D / A</div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1;letter-spacing:0.5px;">{match?.kills}/{match?.deaths}/{match?.assists}</div>
              </div>
              <div style="background:rgba(15,15,22,0.65);border:1px solid {parseFloat(kd) >= 1 ? 'rgba(62,207,142,0.25)' : 'rgba(255,70,85,0.25)'};border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">K/D Ratio</div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:{parseFloat(kd) >= 1 ? '#3ecf8e' : '#ff4655'};line-height:1;letter-spacing:0.5px;">{kd}</div>
              </div>
              <div style="background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;">
                {#if mapImg}
                  <div style="background-image:url('{mapImg}');background-size:cover;background-position:center;width:28px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);flex-shrink:0;"></div>
                {/if}
                <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;align-items:flex-start;">
                  <div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">Map</div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:#fff;text-transform:uppercase;line-height:1;letter-spacing:0.5px;">{match?.map || 'Unknown'}</div>
                </div>
              </div>
              <div style="background:rgba(15,15,22,0.65);border:1px solid {acs >= 240 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'};border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">ACS</div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1;letter-spacing:0.5px;">{acs}</div>
              </div>
              <div style="background:rgba(15,15,22,0.65);border:1px solid {hsPct >= 22 ? 'rgba(62,207,142,0.25)' : hsPct >= 14 ? 'rgba(255,176,31,0.2)' : 'rgba(255,70,85,0.2)'};border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">HS %</div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:{hsPct >= 22 ? '#3ecf8e' : hsPct >= 14 ? '#ffb01f' : '#ff4655'};line-height:1;letter-spacing:0.5px;">{hsPct}%</div>
              </div>
              <div style="background:rgba(15,15,22,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">Rounds</div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1;letter-spacing:0.5px;">{(rawMatch?.rounds || []).length}</div>
              </div>
            </div>

            <!-- Round Timeline -->
            {#if roundDotsHtml}
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="font-family:'DM Mono',monospace;font-size:7px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.5px;line-height:1;">Round win/loss timeline</div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;max-width:390px;">
                  {@html roundDotsHtml}
                </div>
              </div>
            {/if}

            <!-- Impact Feats -->
            {#if featsHtml}
              {@html featsHtml}
            {/if}
          </div>

          <!-- Right Column: Scoreboard -->
          <div style="width:438px;background:rgba(15,15,22,0.88);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:16px;backdrop-filter:blur(12px);display:flex;flex-direction:column;gap:6px;box-sizing:border-box;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:4px;margin-bottom:4px;">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:900;letter-spacing:1px;color:rgba(255,255,255,0.5);line-height:1;">MATCH SCOREBOARD</span>
              <span style="font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,0.3);line-height:1;">ALLIED VS ENEMY ROSTER</span>
            </div>
            <table style="width:100%;border-collapse:separate;border-spacing:0 2.5px;">
              <thead>
                <tr style="font-family:'Barlow Condensed',sans-serif;font-size:9.5px;font-weight:900;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;height:18px;">
                  <th style="text-align:left;padding:0 8px;vertical-align:middle;line-height:1;">Player / Character</th>
                  <th style="text-align:center;padding:0 8px;vertical-align:middle;line-height:1;">K/D/A</th>
                  <th style="text-align:right;padding:0 8px;vertical-align:middle;line-height:1;">ACS</th>
                </tr>
              </thead>
              <tbody>
                <tr style="height:14px;font-family:'Barlow Condensed',sans-serif;font-size:8px;font-weight:900;letter-spacing:0.5px;color:#3ecf8e;">
                  <td colspan="3" style="padding:3px 8px;border-bottom:1px solid rgba(62,207,142,0.15);vertical-align:middle;line-height:1;">▲ YOUR TEAM</td>
                </tr>
                {@html alliedRowsHtml}
                <tr style="height:14px;font-family:'Barlow Condensed',sans-serif;font-size:8px;font-weight:900;letter-spacing:0.5px;color:#ff4655;">
                  <td colspan="3" style="padding:4px 8px;border-bottom:1px solid rgba(255,70,85,0.15);vertical-align:middle;line-height:1;">▼ ENEMY TEAM</td>
                </tr>
                {@html enemyRowsHtml}
              </tbody>
            </table>
          </div>

        </div>

        <!-- Footer -->
        <div style="position:relative;z-index:3;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:0.5px;margin-top:4px;">
          <div style="line-height:1;">Report compiled by ValTracker</div>
          <div style="color:#ff4655;font-weight:900;letter-spacing:1px;text-transform:uppercase;line-height:1;">TRACK. ANALYZE. CONQUER.</div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .share-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .share-modal-overlay.open { display: flex; }

  .share-modal {
    max-width: 600px;
    width: 95%;
    background: linear-gradient(180deg, var(--surface, #0b0b0e) 0%, rgba(20,20,20,0.98) 100%);
    border: 1px solid rgba(255, 70, 85, 0.4);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 70, 85, 0.2);
  }

  .share-modal-title {
    color: var(--accent, #fa4454);
    font-size: 20px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .share-modal-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .share-modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .share-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
  }

  .share-loading-txt {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--accent, #fa4454);
    letter-spacing: 1px;
  }

  .share-loaded {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .share-preview-wrap {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.3);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .share-preview-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .share-preview-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.7);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-clipboard-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
  }

  .share-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .share-textarea {
    width: 100%;
    height: 80px;
    background: var(--surface2, #18181c);
    border: 1px solid var(--border, rgba(255,255,255,0.05));
    border-radius: 8px;
    padding: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #fff;
    resize: none;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .share-textarea:focus { border-color: rgba(255,70,85,0.5); }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 8px;
  }

  .share-btn {
    border: none;
    border-radius: 8px;
    padding: 12px 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.2s;
  }
  .share-btn:hover { opacity: 0.9; }

  .share-btn-twitter { background: #1d9bf0; color: #fff; }
  .share-btn-reddit { background: #ff4500; color: #fff; }
  .share-btn-download {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
  }
  .share-btn-download:hover { background: rgba(255,255,255,0.15); }

  .share-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 70, 85, 0.2);
    border-top-color: var(--accent, #fa4454);
    border-radius: 50%;
    animation: share-spin 0.7s linear infinite;
  }
  @keyframes share-spin { to { transform: rotate(360deg); } }
</style>

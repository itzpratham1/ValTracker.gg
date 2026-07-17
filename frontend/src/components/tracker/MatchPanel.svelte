<script>
    import { onMount } from 'svelte';
  import MatchScoreboard from './MatchScoreboard.svelte';
  import MatchPerformance from './MatchPerformance.svelte';
  import MatchDuels from './MatchDuels.svelte';
  import RoundTimeline from './RoundTimeline.svelte';
  import { getAgentIconUrl, getRoleClass } from '../../lib/assets';
  import { getRankImgUrl, getRankColor, getRankFromRR } from '../../lib/constants';
  import { getGrade, getPlayerList, escapeHtml } from '../../lib/utils';
  import { loadAllMatches } from '../../lib/indexeddb';
  import { getLobbyRankInfo } from '../../lib/processMatches';

  const API_BASE = import.meta.env.PUBLIC_API_URL || '';

  export let match = {};
  export let idx = 0;
  export let rawMatch = null;
  export let playerName = '';
  export let playerTag = '';
  export let currentMode = 'competitive';
  export let mmrHistory = {};
  export let onShare = () => {};

  $: rrChange = mmrHistory ? mmrHistory[m.matchId] : null;
  $: allPlayers = rawMatch ? getPlayerList(rawMatch) : [];
  $: lobbyInfo = rawMatch ? getLobbyRankInfo(allPlayers, m.myTeamId) : null;
  $: lobbyRankName = lobbyInfo?.overall?.name || '';
  $: lobbyRankImg = lobbyRankName ? getRankImgUrl(lobbyRankName) : '';

  let activeTab = 'scoreboard';
  let detailData = null;
  let detailLoading = false;
  let detailError = null;
  let detailLoaded = false;

  $: m = match || {};
  $: totalRoundsFromScore = m.rounds ? String(m.rounds).split('-').reduce((a, b) => Number(a) + Number(b), 0) : 0;
  $: acs = m.acs != null ? m.acs : (m.score != null ? Math.round(m.score / Math.max(1, totalRoundsFromScore)) : 0);
  $: hsPct = m.hs && m.shots ? Math.round((m.hs / m.shots) * 100) : 0;
  $: grade = getGrade(m.kills || 0, m.deaths || 0, m.assists || 0, acs, m.won);
  $: kd = m.deaths ? ((m.kills || 0) / m.deaths).toFixed(2) : (m.kills || 0).toFixed(2);
  $: agentIcon = getAgentIconUrl(m.agentName);
  $: wl = m.won ? 'win' : 'loss';

  // AI Analysis state
  let aiLoading = false;
  let aiResults = '';
  let aiLoadingText = 'ANALYSING MATCH...';
  let aiCache = null;

  onMount(() => {
    if (!rawMatch) {
      loadFullDetail();
    }
  });

  function switchTab(tab) {
    activeTab = tab;
    if (tab !== 'scoreboard' && tab !== 'ai' && !detailLoaded) {
      loadFullDetail();
    }
    if (tab === 'ai') {
      runAnalysis();
    }
  }

  async function loadFullDetail() {
    if (detailLoaded || detailLoading) return;
    detailLoading = true;
    detailError = null;

    try {
      const res = await fetch(`${API_BASE}/api/v2/match/${m.matchId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          detailData = data.data;
          detailLoaded = true;
        } else {
          detailError = 'Match detail not available';
        }
      } else {
        detailError = `Fetch error ${res.status}`;
      }
    } catch (e) {
      detailError = 'Network error — click again to retry';
    } finally {
      detailLoading = false;
    }
  }

  function normalizePlayerName(str) {
    return (str || '').toLowerCase().replace(/\s+/g, '');
  }

  function findMe(matchData) {
    const all = getPlayerList(matchData);
    const tn = normalizePlayerName(playerName);
    const tt = normalizePlayerName(playerTag);
    return (Array.isArray(all) ? all : []).find(
      p => normalizePlayerName(p.name) === tn && normalizePlayerName(p.tag) === tt
    ) || null;
  }

  async function runAnalysis() {
    if (aiCache) {
      aiResults = aiCache;
      return;
    }

    aiLoading = true;
    aiResults = '';
    const msgs = ['ANALYSING MATCH...', 'READING COMBAT DATA...', 'BUILDING REPORT...'];
    let mi = 0;
    const iv = setInterval(() => { aiLoadingText = msgs[++mi % msgs.length]; }, 700);

    await new Promise(r => setTimeout(r, 600));

    try {
      let matchData = rawMatch;
      if (!matchData && m.matchId) {
        const res = await fetch(`${API_BASE}/api/v2/match/${m.matchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data) matchData = data.data;
        }
      }
      if (!matchData) throw new Error('Match data not available');

      const matchId = matchData.metadata?.matchid || matchData.metadata?.match_id;
      const meEarly = findMe(matchData);
      const hasDetails = matchData.rounds && matchData.rounds.length > 0 && matchData.rounds[0].player_stats && matchData.rounds[0].player_stats.length > 0 && matchData.rounds[0].bomb_planted != null && meEarly?.ability_casts != null;

      if (!hasDetails && matchId) {
        const res = await fetch(`${API_BASE}/api/v2/match/${matchId}`);
        if (res.ok) {
          const detailRes = await res.json();
          if (detailRes && detailRes.data) matchData = detailRes.data;
        }
      }

      let allStoredMatches = [];
      try {
        allStoredMatches = await loadAllMatches(playerName, playerTag, currentMode);
      } catch (e) {}

      const html = buildMatchAnalysis(matchData, allStoredMatches);
      aiCache = html;
      aiResults = html;
      if (window.showToast) window.showToast('Match analysis complete');
    } catch (e) {
      aiResults = `<div class="no-detail" style="color:var(--loss);padding:16px;">Analysis error: ${escapeHtml(e.message)}</div>`;
    } finally {
      clearInterval(iv);
      aiLoading = false;
    }
  }

  function buildMatchAnalysis(matchData, allMatches) {
    const allPlayers = getPlayerList(matchData);
    const rounds = matchData.rounds || [];
    const me = findMe(matchData);
    if (!me) return '<div class="no-detail">Player not found in match data</div>';

    let baselineKD = null, baselineHS = null, baselineACS = null;
    let dropOffStreak = 0;
    if (allMatches && allMatches.length > 0) {
      let sumK = 0, sumD = 0, sumACS = 0, sumHS = 0, sumShots = 0, count = 0;
      allMatches.forEach(md => {
        const p = findMe(md);
        if (p) {
          const s = p.stats || {};
          sumK += s.kills || 0;
          sumD += s.deaths || 0;
          const score = s.score || 0;
          const hs = s.headshots || 0;
          const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0);
          const rCount = Math.max(1, md.rounds?.length || 24);
          sumACS += Math.round(score / rCount);
          sumHS += hs;
          sumShots += shots;
          count++;
        }
      });
      if (count > 0) {
        baselineKD = sumD ? sumK / sumD : sumK;
        baselineACS = Math.round(sumACS / count);
        baselineHS = sumShots ? Math.round((sumHS / sumShots) * 100) : 0;
      }

      for (let i = 0; i < Math.min(allMatches.length, 5); i++) {
        const md = allMatches[i];
        const p = findMe(md);
        if (p && md.rounds) {
          const myPuuids = [p.puuid, p.subject, p.id].filter(Boolean);
          let firstH = 0, secondH = 0;
          md.rounds.forEach((r, ri) => {
            const ps = (r.player_stats || []).find(pl => myPuuids.includes(pl.player_puuid || pl.subject || pl.puuid || pl.player_id));
            const killEvents = ps?.kill_events || [];
            const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);
            if (rKills > 0) {
              if (ri < Math.floor(md.rounds.length / 2)) firstH += rKills;
              else secondH += rKills;
            }
          });
          if (firstH > 0 && secondH > 0 && (firstH / (firstH + secondH)) > 0.65) dropOffStreak++;
          else break;
        }
      }
    }

    const myTeamId = (me.team || '').toLowerCase();
    const s = me.stats || {};
    const kills = s.kills || 0;
    const deaths = s.deaths || 0;
    const assists = s.assists || 0;
    const score = s.score || 0;
    const hs = s.headshots || 0;
    const body_s = s.bodyshots || 0;
    const legs = s.legshots || 0;
    const totalShots = hs + body_s + legs;
    const hsPctVal = totalShots ? Math.round((hs / totalShots) * 100) : 0;
    const acsVal = Math.round(score / Math.max(1, totalRounds));
    const kdVal = deaths ? (kills / deaths) : kills;
    const myTeam = matchData.teams?.[myTeamId];
    const won = myTeam?.has_won || false;
    const agentName = me.character || 'Unknown';
    const role = getRoleClass(agentName);
    const mapName = matchData.metadata?.map || 'Unknown';
    const myRounds = myTeam?.rounds_won ?? 0;
    const oppId = myTeamId === 'red' ? 'blue' : 'red';
    const oppRounds = matchData.teams?.[oppId]?.rounds_won ?? 0;
    const totalRounds = myRounds + oppRounds;

    const dmgDealt = me.damage_made || 0;
    const dmgReceived = me.damage_received || 0;
    const dmgRatio = dmgReceived ? (dmgDealt / dmgReceived).toFixed(2) : dmgDealt;

    const ab = me.ability_casts || {};

    const myPuuid = me.puuid || me.subject || me.id || '';
    const myPuuids = [me.puuid, me.subject, me.id, myPuuid].filter(Boolean);
    const teammatePuuids = allPlayers
      .filter(p => (p.team || '').toLowerCase() === myTeamId && !myPuuids.includes(p.puuid || p.subject || p.id))
      .map(p => p.puuid || p.subject || p.id)
      .filter(Boolean);
    let clutchWins = 0, clutchAttempts = 0;
    let killsInWonRounds = 0, killsInLostRounds = 0;
    let firstHalfKills = 0, secondHalfKills = 0;
    let multiKillRounds = 0;
    let bestRoundNum = 1, maxRoundKills = 0, bestRoundWon = false;

    const modeName = (matchData.metadata?.mode || '').toLowerCase();
    let halfSize = 12;
    if (modeName.includes('swiftplay')) halfSize = 4;
    else if (modeName.includes('spike rush')) halfSize = 3;

    const roundSides = [];
    for (let i = 0; i < rounds.length; i++) {
      roundSides[i] = i < halfSize ? 'Attack' : 'Defense';
    }
    let firstHalfAttackTeam = null;
    for (let i = 0; i < Math.min(rounds.length, halfSize); i++) {
      const r = rounds[i];
      if (r.bomb_planted && r.plant_events?.planted_by?.team) {
        firstHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
        break;
      }
    }
    if (!firstHalfAttackTeam) {
      let secondHalfAttackTeam = null;
      for (let i = halfSize; i < Math.min(rounds.length, halfSize * 2); i++) {
        const r = rounds[i];
        if (r.bomb_planted && r.plant_events?.planted_by?.team) {
          secondHalfAttackTeam = r.plant_events.planted_by.team.toLowerCase();
          break;
        }
      }
      if (secondHalfAttackTeam) {
        firstHalfAttackTeam = secondHalfAttackTeam === 'red' ? 'blue' : 'red';
      }
    }
    if (firstHalfAttackTeam) {
      const myTeamLower = myTeamId.toLowerCase();
      const firstHalfSide = firstHalfAttackTeam === myTeamLower ? 'Attack' : 'Defense';
      const secondHalfSide = firstHalfSide === 'Attack' ? 'Defense' : 'Attack';
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        if (i < halfSize) roundSides[i] = firstHalfSide;
        else if (i < halfSize * 2) roundSides[i] = secondHalfSide;
        else {
          if (r.bomb_planted && r.plant_events?.planted_by?.team) {
            roundSides[i] = r.plant_events.planted_by.team.toLowerCase() === myTeamLower ? 'Attack' : 'Defense';
          } else {
            roundSides[i] = (i % 2 === 0) ? firstHalfSide : secondHalfSide;
          }
        }
      }
    }

    const retakeAttempts = { A: 0, B: 0, C: 0 };
    const retakeWins = { A: 0, B: 0, C: 0 };
    const postPlantAttempts = { A: 0, B: 0, C: 0 };
    const postPlantWins = { A: 0, B: 0, C: 0 };
    const firstDeathsBySite = { A: 0, B: 0, C: 0 };
    const firstBloodsBySite = { A: 0, B: 0, C: 0 };
    let defenseFirstDeaths = 0;
    let attackFirstDeaths = 0;
    let totalDefenseRounds = 0;
    let totalAttackRounds = 0;

    rounds.forEach((r, ri) => {
      const ps = (r.player_stats || []).find(p =>
        myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
      );
      const killEvents = ps?.kill_events || [];
      const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);

      const rWon = (r.winning_team || '').toLowerCase() === myTeamId;
      if (rKills > 0) {
        if (rWon) killsInWonRounds += rKills; else killsInLostRounds += rKills;
        if (ri < Math.floor(totalRounds / 2)) firstHalfKills += rKills;
        else secondHalfKills += rKills;
        if (rKills >= 3) multiKillRounds++;
      }
      let isClutch = false;
      if (rWon && r.player_stats && r.player_stats.length > 0) {
        let tmDeaths = 0, meDied = false;
        r.player_stats.forEach(ps => {
          const pStats = typeof ps === 'string' ? JSON.parse(ps) : ps;
          (pStats.kill_events || []).forEach(k => {
            const victim = k.victim_puuid || k.victim;
            if (victim && myPuuids.includes(victim)) meDied = true;
            if (victim && teammatePuuids.includes(victim)) tmDeaths++;
          });
        });
        if (tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) isClutch = true;
      }
      if (isClutch) {
        clutchAttempts++;
        if (rWon) clutchWins++;
      }

      if (rKills > maxRoundKills || (rKills === maxRoundKills && rWon && !bestRoundWon)) {
        maxRoundKills = rKills;
        bestRoundNum = ri + 1;
        bestRoundWon = rWon;
      }

      const side = roundSides[ri];
      if (side === 'Defense') totalDefenseRounds++;
      else if (side === 'Attack') totalAttackRounds++;

      const roundKills = [];
      (r.player_stats || []).forEach(playerStats => {
        (playerStats.kill_events || []).forEach(k => roundKills.push(k));
      });

      let isFD = false, isFB = false;
      if (roundKills.length > 0) {
        roundKills.sort((a, b) => (a.kill_time_in_round ?? a.time_in_round ?? 0) - (b.kill_time_in_round ?? b.time_in_round ?? 0));
        const firstKill = roundKills[0];
        const victimPuuid = firstKill.victim_puuid || firstKill.victim || '';
        const killerPuuid = firstKill.killer_puuid || firstKill.killer || '';
        if (myPuuids.includes(victimPuuid)) { isFD = true; if (side === 'Defense') defenseFirstDeaths++; else attackFirstDeaths++; }
        if (myPuuids.includes(killerPuuid)) { isFB = true; }
      }

      if (r.bomb_planted) {
        const site = (r.plant_events?.plant_site || 'A').toUpperCase();
        if (site === 'A' || site === 'B' || site === 'C') {
          if (side === 'Defense') { retakeAttempts[site]++; if (rWon) retakeWins[site]++; }
          else if (side === 'Attack') { postPlantAttempts[site]++; if (rWon) postPlantWins[site]++; }
          if (isFD) firstDeathsBySite[site]++;
          if (isFB) firstBloodsBySite[site]++;
        }
      }
    });

    const tacticalInsights = [];
    ['A', 'B', 'C'].forEach(site => {
      const attempts = retakeAttempts[site];
      const wins = retakeWins[site];
      if (attempts >= 1) {
        const wr = Math.round((wins / attempts) * 100);
        if (wr >= 70) tacticalInsights.push(`💪 You excelled at retakes on <strong>${site} site</strong>, converting ${wins}/${attempts} situations (${wr}% conversion rate).`);
        else if (wr <= 33) {
          let tip = `⚠️ Struggled with retakes on <strong>${site} site</strong> (only ${wins}/${attempts} converted). `;
          if (role === 'duelist') tip += `As a Duelist (<strong>${agentName}</strong>), avoid peeking the site first without entry utility. Wait for teammate scans before entering.`;
          else if (role === 'initiator') tip += `As an Initiator (<strong>${agentName}</strong>), save your scanning utility to clear angles for your team during the retake.`;
          else if (role === 'controller') tip += `As a Controller (<strong>${agentName}</strong>), smoke off key attacker sightlines to isolate fights before pushing.`;
          else if (role === 'sentinel') tip += `As a Sentinel (<strong>${agentName}</strong>), wait to coordinate utility with your team and watch the flank.`;
          else tip += `Avoid peeking the site early on retakes; wait for teammate utility before pushing.`;
          tacticalInsights.push(tip);
        }
      }
    });

    ['A', 'B', 'C'].forEach(site => {
      const attempts = postPlantAttempts[site];
      const wins = postPlantWins[site];
      if (attempts >= 1) {
        const wr = Math.round((wins / attempts) * 100);
        if (wr >= 70) tacticalInsights.push(`💪 Strong post-plant defense on <strong>${site} site</strong>, winning ${wins}/${attempts} rounds after spike plant.`);
        else if (wr <= 33) {
          let tip = `⚠️ Low post-plant conversion on <strong>${site} site</strong> (${wins}/${attempts} won). `;
          if (role === 'duelist') tip += `As a Duelist (<strong>${agentName}</strong>), avoid taking aggressive solo peeks after the plant. Hold crossfires with teammates.`;
          else if (role === 'initiator') tip += `As an Initiator (<strong>${agentName}</strong>), use scans/flashes to delay retaking defenders.`;
          else if (role === 'controller') tip += `As a Controller (<strong>${agentName}</strong>), use smokes to block key entrance paths or cover the spike.`;
          else if (role === 'sentinel') tip += `As a Sentinel (<strong>${agentName}</strong>), set up utility directly on the spike or main entry lanes.`;
          else tip += `Try playing defensive post-plant crossfires or utility lineups.`;
          tacticalInsights.push(tip);
        }
      }
    });

    ['A', 'B', 'C'].forEach(site => {
      const fdCount = firstDeathsBySite[site];
      if (fdCount >= 1) {
        const totalRoundsOnSite = (retakeAttempts[site] + postPlantAttempts[site]) || 1;
        const fdRate = Math.round((fdCount / totalRoundsOnSite) * 100);
        if (fdRate >= 20) {
          let tip = `⚠️ You had a ${fdRate}% first-death rate on <strong>${site} site</strong>. `;
          if (role === 'duelist') tip += `Peek with movement/entry utility or let an initiator scan first.`;
          else if (role === 'initiator') tip += `Use your recon/flashing abilities to clear the lane before peeking.`;
          else if (role === 'controller') tip += `Avoid early aggressive peeks and play safe behind your team.`;
          else if (role === 'sentinel') tip += `Play passive anchor positions and let your utility check the lane first.`;
          else tip += `Try peeking with utility next time or let an initiator scan first.`;
          tacticalInsights.push(tip);
        }
      }
    });

    if (defenseFirstDeaths >= 1 && totalDefenseRounds > 0) {
      const fdPct = Math.round((defenseFirstDeaths / totalDefenseRounds) * 100);
      if (fdPct >= 20) {
        let tip = `⚠️ First-death rate of ${fdPct}% on Defense (${defenseFirstDeaths} rounds). `;
        if (role === 'duelist') tip += `Ensure you have an escape mechanism ready or teammate trade support.`;
        else if (role === 'initiator') tip += `Use scouting utility to spot early pushes safely and fall back.`;
        else if (role === 'controller') tip += `Your life is crucial for late-round smoke setups. Do not dry-peek early.`;
        else if (role === 'sentinel') tip += `Play as a passive anchor behind your utility.`;
        else tip += `Peeking early as a defender compromises site holds. Play passive anchors.`;
        tacticalInsights.push(tip);
      }
    }

    let roundsHtml = '';
    rounds.forEach((r, ri) => {
      const rWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
      const roundNum = ri + 1;
      const side = roundSides[ri];
      const sideEmoji = side === 'Attack' ? '⚔️' : '🛡️';
      const ps = (r.player_stats || []).find(p =>
        myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)
      );
      const killEvents = ps?.kill_events || [];
      const rKills = typeof ps?.kills === 'number' ? ps.kills : (ps?.kills?.length || killEvents.length || 0);
      const dotBorder = rWon ? 'var(--win)' : 'var(--loss)';
      const dotColor = rWon ? 'rgba(62, 207, 142, 0.15)' : 'rgba(250, 68, 84, 0.15)';
      const title = `Round ${roundNum} (${side}): ${rWon ? 'Win' : 'Loss'}${rKills > 0 ? ` \u00B7 ${rKills} Kills` : ''}`;
      const killsBadge = rKills >= 5
        ? `<span style="position:absolute;bottom:-7px;background:#ffd700;color:#000;font-family:'DM Mono',monospace;font-size:7px;padding:0 3px;border-radius:3px;font-weight:900;line-height:1.2;box-shadow:0 0 4px #ffd700;border:0.5px solid #000;z-index:2;">ACE</span>`
        : rKills >= 2
        ? `<span style="position:absolute;bottom:-7px;background:var(--accent);color:#fff;font-family:'DM Mono',monospace;font-size:7px;padding:0 3px;border-radius:3px;font-weight:800;line-height:1.2;box-shadow:0 0 4px var(--accentdim);border:0.5px solid #000;z-index:2;">${rKills}K</span>`
        : '';
      roundsHtml += `<div title="${title}" style="position:relative;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;border:1px solid ${dotBorder};background:${dotColor};color:#fff;box-shadow:0 0 6px ${rWon ? 'rgba(62,207,142,0.1)' : 'rgba(250,68,84,0.1)'};">${roundNum}<span style="position:absolute;top:-4px;right:-4px;font-size:7px;">${sideEmoji}</span>${killsBadge}</div>`;
    });

    const lobbyInfo = getLobbyRankInfo(allPlayers, myTeamId);

    const allied = allPlayers.filter(p => (p.team || '').toLowerCase() === myTeamId);
    const teamAvgACS = allied.length
      ? Math.round(allied.reduce((s, p) => s + Math.round((p.stats?.score || 0) / Math.max(1, totalRounds)), 0) / allied.length)
      : 0;
    const myRankInTeam = [...allied]
      .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
      .findIndex(p => {
        const targetName = normalizePlayerName(playerName);
        const targetTag = normalizePlayerName(playerTag);
        return normalizePlayerName(p.name) === targetName && normalizePlayerName(p.tag) === targetTag;
      }) + 1;

    const strengths = [];
    const improvements = [];
    const tips = [];

    if (baselineKD !== null) {
      const kdDiff = kdVal - baselineKD;
      if (kdDiff >= 0.2) strengths.push(`Standout performance! Your match K/D (${kdVal.toFixed(2)}) is +${kdDiff.toFixed(2)} above your historical baseline average (${baselineKD.toFixed(2)}).`);
      else if (kdDiff <= -0.25) improvements.push(`Tough duels: Your K/D (${kdVal.toFixed(2)}) fell below your baseline average (${baselineKD.toFixed(2)}) by ${kdDiff.toFixed(2)}.`);
    }
    if (baselineHS !== null) {
      const hsDiff = hsPctVal - baselineHS;
      if (hsDiff >= 5) strengths.push(`Aim highlight: Your headshot rate (${hsPctVal}%) exceeded your baseline average (${baselineHS}%) by +${hsDiff}%.`);
      else if (hsDiff <= -6) improvements.push(`Aim decay: Your headshot rate (${hsPctVal}%) was ${Math.abs(hsDiff)}% below your personal average (${baselineHS}%).`);
    }
    if (baselineACS !== null) {
      const acsDiff = acsVal - baselineACS;
      if (acsDiff >= 35) strengths.push(`High impact! Your ACS (${acsVal}) was +${acsDiff} above your historical baseline average (${baselineACS}).`);
      else if (acsDiff <= -40) improvements.push(`Low impact: Your ACS (${acsVal}) fell short of your historical baseline (${baselineACS}) by ${Math.abs(acsDiff)} points.`);
    }

    if (dropOffStreak >= 2) improvements.push(`<strong>Fatigue Pattern:</strong> This is your ${dropOffStreak}nd consecutive match showing a drop-off in second-half kills. Take a break!`);

    if (kdVal >= 1.8) strengths.push(`Dominant K/D of ${kdVal.toFixed(2)} — you won almost every duel this game.`);
    else if (kdVal >= 1.2) strengths.push(`Positive K/D of ${kdVal.toFixed(2)} — you traded favourably and created value for your team.`);
    else if (kdVal < 0.8) improvements.push(`K/D of ${kdVal.toFixed(2)} is poor for this match — you died ${deaths} times, likely taking unfavourable duels or misreading angles.`);
    else improvements.push(`K/D of ${kdVal.toFixed(2)} is close to even — ${deaths} deaths limited your impact. Focus on only taking fights with clear angle or utility advantage.`);

    if (acsVal >= teamAvgACS + 30) strengths.push(`ACS of ${acsVal} was the highest (or near-highest) on your team (team avg: ${teamAvgACS}) — you led from the front.`);
    else if (acsVal >= teamAvgACS) strengths.push(`ACS of ${acsVal} was above your team average (${teamAvgACS}) — solid contribution.`);
    else improvements.push(`ACS of ${acsVal} was below your team average (${teamAvgACS}) — you were ranked #${myRankInTeam} on your team for combat score. Look for more proactive engagements.`);

    if (hsPctVal >= 30) strengths.push(`${hsPctVal}% headshot rate this match — exceptional aim precision, you punished enemies efficiently.`);
    else if (hsPctVal >= 20) strengths.push(`${hsPctVal}% headshot rate is solid — your crosshair placement was consistent.`);
    else if (hsPctVal < 12) improvements.push(`${hsPctVal}% headshot rate is very low — you relied heavily on body/leg shots. Work on head-level crosshair placement.`);
    else improvements.push(`${hsPctVal}% headshot rate has room to grow. You hit ${hs} headshots out of ${totalShots} total shots — aim for 20%+ by keeping crosshair at head height.`);

    if (dmgDealt > 0) {
      if (parseFloat(dmgRatio) >= 1.4) strengths.push(`Damage ratio of ${dmgRatio} (${dmgDealt} dealt vs ${dmgReceived} received) — you are hitting enemies more than they hit you.`);
      else if (parseFloat(dmgRatio) < 0.7) improvements.push(`Damage ratio of ${dmgRatio} (dealt ${dmgDealt} vs received ${dmgReceived}) — you took significantly more damage than you dealt.`);
    }

    if (assists >= 8) strengths.push(`${assists} assists shows strong utility usage and team support — your ${agentName} abilities opened up kills for teammates.`);
    else if (assists >= 5) strengths.push(`${assists} assists — decent utility contribution from your ${agentName}.`);
    else if (assists <= 2 && (role === 'initiator' || role === 'controller'))
      improvements.push(`Only ${assists} assists as a ${role} (${agentName}) — ${role === 'initiator' ? 'your flashes and recon should be generating more assist value' : 'your smokes and utility should be enabling more team plays'}.`);

    if (clutchAttempts > 0) {
      const clutchPct = Math.round((clutchWins / clutchAttempts) * 100);
      if (clutchWins >= 2) strengths.push(`Won ${clutchWins}/${clutchAttempts} clutch situations (${clutchPct}%) — you perform under pressure.`);
      else if (clutchAttempts >= 2 && clutchWins === 0) improvements.push(`0/${clutchAttempts} clutch situations converted — focus on isolating duels one at a time.`);
    }

    if (multiKillRounds >= 3) strengths.push(`${multiKillRounds} rounds with 3+ kills — you had multiple high-impact rounds that swung momentum.`);

    if (firstHalfKills > 0 && secondHalfKills > 0) {
      const ratio = firstHalfKills / (firstHalfKills + secondHalfKills);
      if (ratio > 0.65) improvements.push(`You got ${firstHalfKills} kills in the first half but only ${secondHalfKills} in the second — your impact dropped significantly.`);
      else if (ratio < 0.35) strengths.push(`You improved in the second half (${secondHalfKills} kills vs ${firstHalfKills} first half) — good adaptation mid-game.`);
    }

    if (role === 'duelist') {
      tips.push(`As ${agentName} (Duelist): your job is to OPEN sites, not follow teammates in. If your kills happen after teammates die, you are playing too reactive.`);
      if (kdVal < 1.0) tips.push(`Duelist with sub-1.0 K/D means you are not winning your expected duels. Use your mobility/flash to gain angle advantage BEFORE committing.`);
    } else if (role === 'initiator') {
      tips.push(`As ${agentName} (Initiator): use recon/flashes BEFORE your duelists push, not after. Your value is the information and opening, not kills.`);
      if (assists < 5) tips.push(`Low assists for an initiator — flash before every teammate push, even in default rounds.`);
    } else if (role === 'controller') {
      tips.push(`As ${agentName} (Controller): prioritise smoking default positions and chokepoints at round start. Early smokes prevent info and force enemies to reposition.`);
      if (assists < 4) tips.push(`Low assist count for a controller — your utility should be generating team kills constantly.`);
    } else if (role === 'sentinel') {
      tips.push(`As ${agentName} (Sentinel): flank-watching and anchor plays are your contribution. If you died to flanks repeatedly, your trip/cam placement needs adjusting.`);
    }

    tips.push(`On ${mapName}: identify 1-2 positions where you died most this game and approach them differently next time.`);

    if (deaths >= 18) tips.push(`${deaths} deaths is very high — have an exit/reposition route ready before engaging.`);
    else if (deaths >= 14) tips.push(`${deaths} deaths — review when you died: were you rotating late, holding a lonely site, or taking 50/50 duels?`);

    if (hsPctVal < 18) tips.push(`To raise HS% on ${agentName}: in deathmatch, only allow yourself to shoot if your crosshair is at head height first.`);

    const totalAbCasts = (ab.c_cast || 0) + (ab.q_cast || 0) + (ab.e_cast || 0) + (ab.x_cast || 0);
    if (totalAbCasts < totalRounds * 1.5 && totalRounds > 10) tips.push(`You cast ${totalAbCasts} abilities across ${totalRounds} rounds — that's less than 1.5 per round. Buy and use abilities every round.`);

    const outcome = won ? 'a win' : 'a loss';
    let verdict = `This was ${outcome} on ${mapName} with ${kills}/${deaths}/${assists} as ${agentName}. `;
    const biggestIssue = kdVal < 0.9 ? `reducing your death count (${deaths} this game)` : hsPctVal < 15 ? `improving your headshot rate (${hsPctVal}% this game)` : acsVal < teamAvgACS ? `increasing your ACS above the team average (yours: ${acsVal}, team: ${teamAvgACS})` : clutchAttempts > 1 && clutchWins === 0 ? 'converting clutch situations' : 'maintaining this performance consistently';
    verdict += `Your main focus for the next game should be <strong>${biggestIssue}</strong>. `;
    verdict += won ? 'Good result — analyse what worked this game and replicate it.' : 'Despite the loss, extract the positives and identify the 1-2 rounds that swung the game.';

    const kdClass = kdVal >= 1.2 ? 'good' : kdVal >= 0.9 ? 'warn' : 'bad';
    const hsClass = hsPctVal >= 22 ? 'good' : hsPctVal >= 14 ? 'warn' : 'bad';
    const acsClass = acsVal >= teamAvgACS + 20 ? 'good' : acsVal >= teamAvgACS - 10 ? 'warn' : 'bad';
    const perfLevel = kdVal >= 1.3 && acsVal >= teamAvgACS ? 'a <strong>strong individual performance</strong>' : kdVal >= 1.0 && acsVal >= teamAvgACS - 15 ? 'a <strong>solid performance</strong>' : 'a <strong>below-par performance</strong>';
    const summary = `${won ? '✅ Victory' : '❌ Defeat'} · ${escapeHtml(agentName)} on ${escapeHtml(mapName)} — ${perfLevel} with ${kills}/${deaths}/${assists} and ${acsVal} ACS${lobbyInfo?.overall ? ` in a <strong>${escapeHtml(lobbyInfo.overall.name)}</strong> avg lobby` : ''}.`;

    return `
      <div class="match-ai-tabs">
        <button class="match-ai-tab-btn active" onclick="document.getElementById('match-ai-analysis-${idx}').style.display='block';document.getElementById('match-ai-timeline-${idx}').style.display='none';this.classList.add('active');this.nextElementSibling.classList.remove('active')">📊 Match Analysis</button>
        <button class="match-ai-tab-btn" onclick="document.getElementById('match-ai-timeline-${idx}').style.display='block';document.getElementById('match-ai-analysis-${idx}').style.display='none';this.classList.add('active');this.previousElementSibling.classList.remove('active')">🎮 Timeline &amp; Stats</button>
      </div>

      <div id="match-ai-analysis-${idx}" style="display:block">
        <div class="match-ai-summary-v2">
          <div class="match-ai-summary-left">
            <div class="match-ai-outcome-badge ${won ? 'win' : 'loss'}">${won ? '✅ Victory' : '❌ Defeat'}</div>
            <div class="match-ai-summary-text">${summary}</div>
          </div>
          <div class="match-ai-summary-chips">
            <span class="match-ai-chip agent-chip">${escapeHtml(agentName)}</span>
            <span class="match-ai-chip map-chip">${escapeHtml(mapName)}</span>
            <span class="match-ai-chip role-chip">${role || 'unknown'}</span>
          </div>
        </div>

        <div class="match-ai-intel-banner">
          <div class="match-ai-intel-icon">🤖</div>
          <div>
            <div class="match-ai-intel-title">Match Intel AI Diagnostics</div>
            <div class="match-ai-intel-desc">Personalized match audit · compares to your <strong>historical baselines</strong>, detects <strong>fatigue patterns</strong>, and spotlights <strong>clutch &amp; impact plays</strong></div>
          </div>
          <div class="match-ai-intel-badge">AI</div>
        </div>

        <div class="match-ai-grid">
          <div class="match-ai-pill">
            <div class="match-ai-pill-label">K/D</div>
            <div class="match-ai-pill-val ${kdClass}">${kdVal.toFixed(2)}</div>
            <div class="match-ai-pill-sub">${kills}K / ${deaths}D</div>
            <div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${kdClass}" style="width:${Math.min(100, Math.round((kdVal / Math.max(kdVal, baselineKD != null ? baselineKD + 0.5 : 2)) * 100))}%"></div></div>
            ${baselineKD !== null ? `<div class="match-ai-pill-baseline">Baseline: ${baselineKD.toFixed(2)}</div>` : ''}
          </div>
          <div class="match-ai-pill">
            <div class="match-ai-pill-label">ACS</div>
            <div class="match-ai-pill-val ${acsClass}">${acsVal}</div>
            <div class="match-ai-pill-sub">Team avg: ${teamAvgACS}</div>
            <div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${acsClass}" style="width:${Math.min(100, Math.round((acsVal / Math.max(acsVal, baselineACS != null ? baselineACS + 50 : 350)) * 100))}%"></div></div>
            ${baselineACS !== null ? `<div class="match-ai-pill-baseline">Baseline: ${baselineACS}</div>` : ''}
          </div>
          <div class="match-ai-pill">
            <div class="match-ai-pill-label">HS Rate</div>
            <div class="match-ai-pill-val ${hsClass}">${hsPctVal}%</div>
            <div class="match-ai-pill-sub">${hs} headshots</div>
            <div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${hsClass}" style="width:${Math.min(100, hsPctVal * 3)}%"></div></div>
            ${baselineHS !== null ? `<div class="match-ai-pill-baseline">Baseline: ${baselineHS}%</div>` : ''}
          </div>
          ${dmgDealt ? `<div class="match-ai-pill"><div class="match-ai-pill-label">Dmg Ratio</div><div class="match-ai-pill-val ${parseFloat(dmgRatio)>=1.2?'good':parseFloat(dmgRatio)>=0.8?'warn':'bad'}">${dmgRatio}</div><div class="match-ai-pill-sub">${dmgDealt} dealt</div><div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${parseFloat(dmgRatio)>=1.2?'good':parseFloat(dmgRatio)>=0.8?'warn':'bad'}" style="width:${Math.min(100, Math.round(parseFloat(dmgRatio) * 50))}%"></div></div></div>` : ''}
          <div class="match-ai-pill">
            <div class="match-ai-pill-label">Clutches</div>
            <div class="match-ai-pill-val ${clutchWins>0?'good':'warn'}">${clutchWins}/${clutchAttempts||0}</div>
            <div class="match-ai-pill-sub">Converted</div>
            <div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${clutchWins>0?'good':'bad'}" style="width:${clutchAttempts > 0 ? Math.round((clutchWins/(clutchAttempts||1))*100) : 0}%"></div></div>
          </div>
          <div class="match-ai-pill">
            <div class="match-ai-pill-label">Multi-kills</div>
            <div class="match-ai-pill-val ${multiKillRounds>=2?'good':multiKillRounds>=1?'warn':'bad'}">${multiKillRounds}</div>
            <div class="match-ai-pill-sub">3K+ rounds</div>
            <div class="match-ai-pill-bar-wrap"><div class="match-ai-pill-bar ${multiKillRounds>=2?'good':multiKillRounds>=1?'warn':'bad'}" style="width:${Math.min(100, multiKillRounds * 16)}%"></div></div>
          </div>
        </div>

        <div class="match-ai-verdict-v2">
          <div class="match-ai-verdict-v2-label">⚡ Match Verdict</div>
          <div class="match-ai-verdict-v2-text">${verdict}</div>
        </div>

        <div class="match-ai-sections" style="margin-top:16px">
          ${strengths.length ? `<div class="match-ai-block strengths-block">
            <div class="match-ai-block-header"><span class="match-ai-block-icon good-icon">💪</span><span class="match-ai-block-title good">What You Did Well</span><span class="match-ai-block-count good">${strengths.length}</span></div>
            <div class="match-ai-items">${strengths.map(i => `<div class="match-ai-item"><div class="match-ai-item-icon good-item-icon">✓</div><div>${i}</div></div>`).join('')}</div>
          </div>` : ''}
          ${improvements.length ? `<div class="match-ai-block improvements-block">
            <div class="match-ai-block-header"><span class="match-ai-block-icon warn-icon">⚠️</span><span class="match-ai-block-title warn">Needs Improvement</span><span class="match-ai-block-count warn">${improvements.length}</span></div>
            <div class="match-ai-items">${improvements.map(i => `<div class="match-ai-item"><div class="match-ai-item-icon warn-item-icon">!</div><div>${i}</div></div>`).join('')}</div>
          </div>` : ''}
          ${tips.length ? `<div class="match-ai-block tips-block">
            <div class="match-ai-block-header"><span class="match-ai-block-icon tip-icon">⚡</span><span class="match-ai-block-title tip">Action Tips For Next Game</span><span class="match-ai-block-count tip">${tips.length}</span></div>
            <div class="match-ai-items">${tips.map(i => `<div class="match-ai-item"><div class="match-ai-item-icon tip-item-icon">→</div><div>${i}</div></div>`).join('')}</div>
          </div>` : ''}
        </div>

        ${tacticalInsights.length ? `
        <div class="match-ai-site-diagnostics">
          <div class="match-ai-site-diag-header"><span>🎯</span><span>Positional &amp; Site Diagnostics</span></div>
          <div class="match-ai-site-diag-grid">${tacticalInsights.map(ins => `<div class="match-ai-diagnostic-card">${ins}</div>`).join('')}</div>
        </div>` : ''}
      </div>

      <div id="match-ai-timeline-${idx}" style="display:none">
        <div class="match-ai-timeline-section">
          <div class="match-ai-timeline-header"><span>🎮</span><span>Round-by-Round Timeline</span></div>
          <div class="match-ai-timeline-legend">
            <span class="match-ai-legend-item"><span class="match-ai-legend-dot win-dot"></span>Win</span>
            <span class="match-ai-legend-item"><span class="match-ai-legend-dot loss-dot"></span>Loss</span>
            <span class="match-ai-legend-item"><span style="font-size:8px">⚔️</span>Attack</span>
            <span class="match-ai-legend-item"><span style="font-size:8px">🛡️</span>Defense</span>
          </div>
          <div class="match-ai-timeline-wrap">${roundsHtml}</div>
          <div class="match-ai-stats-grid">
            <div class="match-ai-stat-card">
              <div class="match-ai-stat-card-header">⚔️ Combat Consistency</div>
              <div class="match-ai-stat-row"><span>First Half Kills</span><strong>${firstHalfKills}</strong></div>
              <div class="match-ai-stat-row"><span>Second Half Kills</span><strong>${secondHalfKills}</strong></div>
              <div class="match-ai-stat-row"><span>Multi-Kill Rounds (3K+)</span><strong style="color:var(--win);">${multiKillRounds}</strong></div>
              <div class="match-ai-half-bar-wrap">
                <div class="match-ai-half-bar">
                  <div class="match-ai-half-bar-fill-a" style="width:${firstHalfKills + secondHalfKills > 0 ? Math.round((firstHalfKills / (firstHalfKills + secondHalfKills)) * 100) : 50}%"></div>
                  <div class="match-ai-half-bar-fill-b" style="width:${firstHalfKills + secondHalfKills > 0 ? Math.round((secondHalfKills / (firstHalfKills + secondHalfKills)) * 100) : 50}%"></div>
                </div>
                <div class="match-ai-half-bar-labels"><span style="color:var(--accent);font-size:9px;">1st Half</span><span style="color:var(--muted);font-size:9px;">2nd Half</span></div>
              </div>
            </div>
            <div class="match-ai-stat-card">
              <div class="match-ai-stat-card-header">🎯 Accuracy Breakdown</div>
              <div class="match-ai-accuracy-bars">
                <div class="match-ai-acc-row">
                  <span class="match-ai-acc-label">Head</span>
                  <div class="match-ai-acc-bar-wrap"><div class="match-ai-acc-bar hs-bar" style="width:${totalShots ? Math.round((hs/totalShots)*100) : 0}%"></div></div>
                  <span class="match-ai-acc-pct" style="color:var(--win);">${totalShots ? Math.round((hs/totalShots)*100) : 0}%</span>
                </div>
                <div class="match-ai-acc-row">
                  <span class="match-ai-acc-label">Body</span>
                  <div class="match-ai-acc-bar-wrap"><div class="match-ai-acc-bar body-bar" style="width:${totalShots ? Math.round((body_s/totalShots)*100) : 0}%"></div></div>
                  <span class="match-ai-acc-pct">${totalShots ? Math.round((body_s/totalShots)*100) : 0}%</span>
                </div>
                <div class="match-ai-acc-row">
                  <span class="match-ai-acc-label">Leg</span>
                  <div class="match-ai-acc-bar-wrap"><div class="match-ai-acc-bar leg-bar" style="width:${totalShots ? Math.round((legs/totalShots)*100) : 0}%"></div></div>
                  <span class="match-ai-acc-pct" style="color:var(--loss);">${totalShots ? Math.round((legs/totalShots)*100) : 0}%</span>
                </div>
              </div>
            </div>
            <div class="match-ai-stat-card">
              <div class="match-ai-stat-card-header">⭐ Best Round</div>
              <div style="text-align:center;padding:8px 0 4px;">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:42px;font-weight:900;line-height:1;color:#fff;">${bestRoundNum}</div>
                <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;margin-top:2px;">ROUND NUMBER</div>
              </div>
              <div class="match-ai-stat-row"><span>Kills in Round</span><strong style="color:var(--accent);font-size:15px;">${maxRoundKills}</strong></div>
              <div class="match-ai-stat-row"><span>Round Outcome</span><strong style="color:${bestRoundWon ? 'var(--win)' : 'var(--loss)'};">${bestRoundWon ? '✅ Won' : '❌ Lost'}</strong></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function getMvpInfo() {
    if (!rawMatch) return { isMatchMVP: false, isTeamMVP: false };
    const allPlayers = getPlayerList(rawMatch);
    const totalRounds = (rawMatch.rounds || []).length || Math.max(1,
      Object.values(rawMatch.teams || {}).reduce((s, t) => s + (t.rounds_won || 0), 0)
    );
    const getACS = p => Math.round((p.stats?.score || 0) / totalRounds);
    const matchMVPPlayer = allPlayers.length
      ? allPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, allPlayers[0])
      : null;
    const alliedPlayers = allPlayers.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
    const teamMVPPlayer = alliedPlayers.length
      ? alliedPlayers.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayers[0])
      : null;
    const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    return { isMatchMVP, isTeamMVP };
  }

  $: mvpInfo = getMvpInfo();
  $: mvpBadge = mvpInfo.isMatchMVP
    ? '👑 Match MVP'
    : mvpInfo.isTeamMVP
    ? '⭐ Team MVP'
    : '';
</script>

<div class="panel-body">
  <div class="panel-header-row">
    <div class="panel-grade-badge {grade}">{grade}</div>
    <div class="panel-match-meta">
      <div class="panel-meta-left">
        <div class="panel-match-title">
          {#if agentIcon}
            <img src={agentIcon} alt={m.agentName} style="width:28px;height:28px;object-fit:contain;" on:error={(e) => e.target.style.display='none'}>
          {/if}
          {(m.agentName || '—').toUpperCase()} · {(m.map || '—').toUpperCase()}
        </div>
        <div class="panel-match-sub">{m.won ? 'VICTORY' : 'DEFEAT'} · {m.rounds} rounds</div>
        {#if mvpBadge}
          <div class="mvp-header-badge {mvpInfo.isMatchMVP ? 'match-mvp' : 'team-mvp'}">
            {mvpBadge}
          </div>
        {/if}
        <div style="margin: 8px 0 10px; display: flex; gap: 8px; align-items: center;">
          <button class="share-flex-btn" on:click|stopPropagation={onShare}>
            <span>✨ Share Flex Card</span>
          </button>
        </div>
      </div>
      <div class="panel-stat-row">
        <div class="ps-item">
          <div class="psv">{m.kills}/{m.deaths}/{m.assists}</div>
          <div class="psl">K / D / A</div>
        </div>
        <div class="ps-item">
          <div class="psv">{kd}</div>
          <div class="psl">K/D</div>
        </div>
        <div class="ps-item">
          <div class="psv">{acs}</div>
          <div class="psl">ACS</div>
        </div>
        <div class="ps-item">
          <div class="psv">{hsPct}%</div>
          <div class="psl">HS Rate</div>
        </div>
        {#if rrChange !== null && rrChange !== undefined}
          {@const col = rrChange > 0 ? 'var(--win)' : rrChange < 0 ? 'var(--loss)' : 'var(--muted)'}
          <div class="ps-item">
            <div class="psv" style="color:{col}">{rrChange > 0 ? '+' : ''}{rrChange}</div>
            <div class="psl">RR Change</div>
          </div>
        {/if}
        {#if lobbyRankName}
          <div class="ps-item">
            <div class="psv" style="display:flex;align-items:center;gap:6px;font-size:18px;">
              {#if lobbyRankImg}
                <img src={lobbyRankImg} alt={lobbyRankName} style="width:22px;height:22px;object-fit:contain;" on:error={(e) => e.target.style.display='none'}>
              {/if}
              {lobbyRankName}
            </div>
            <div class="psl">Lobby Avg Rank</div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="panel-tabs">
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'scoreboard'}
      on:click={() => switchTab('scoreboard')}
    >
      Scoreboard
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'performance'}
      on:click={() => switchTab('performance')}
    >
      Performance
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'duels'}
      on:click={() => switchTab('duels')}
    >
      Fights
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'timeline'}
      on:click={() => switchTab('timeline')}
    >
      Rounds
    </button>
    <button
      class="panel-tab-btn"
      class:active={activeTab === 'ai'}
      on:click={() => switchTab('ai')}
    >
      AI Analysis
    </button>
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'scoreboard'}>
    {#if rawMatch || detailData}
      <MatchScoreboard match={rawMatch || detailData} myTeamId={m.myTeamId} {playerName} />
    {:else}
      <div style="padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
        <span class="detail-loading" style="font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted);">{detailLoading ? 'Loading scoreboard details...' : 'Scoreboard data not loaded'}</span>
        {#if !detailLoading}
          <button class="filter-btn" style="padding: 6px 16px; font-size: 11px;" on:click={loadFullDetail}>Load Scoreboard</button>
        {/if}
      </div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'performance'}>
    {#if detailLoading}
      <div class="detail-loading">Loading performance data...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <MatchPerformance match={detailData} {playerName} {playerTag} />
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'duels'}>
    {#if detailLoading}
      <div class="detail-loading">Loading fight duels...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <MatchDuels match={detailData} {playerName} {playerTag} />
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'timeline'}>
    {#if detailLoading}
      <div class="detail-loading">Loading round timelines...</div>
    {:else if detailError}
      <div class="no-detail">{detailError}</div>
    {:else if detailData}
      <RoundTimeline match={detailData} {playerName} {playerTag} />
    {:else}
      <div class="detail-loading">Click to load full details...</div>
    {/if}
  </div>

  <div class="panel-tab-content" class:active={activeTab === 'ai'}>
    <div class="match-ai-wrap" style="margin-top:0;">
      <div class="match-ai-header">
        <div class="match-ai-title">ValBot Match Analysis</div>
      </div>
      {#if aiLoading}
        <div class="match-ai-loading active">
          <div class="match-ai-spinner"></div>
          <span class="match-ai-loading-txt">{aiLoadingText}</span>
        </div>
      {/if}
      {#if aiResults && !aiLoading}
        <div class="match-ai-body active">{@html aiResults}</div>
      {/if}
    </div>
  </div>
</div>

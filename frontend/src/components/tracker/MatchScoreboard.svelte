<script>
  import { getAgentIconUrl } from '../../lib/assets';
  import { getRankImgUrl, getRankColor, RANKS } from '../../lib/constants';
  import { getPlayerList } from '../../lib/utils';
  import { escapeHtml } from '../../lib/utils';

  export let match = {};
  export let myTeamId = '';
  export let playerName = '';

  function getTierRR(tierName) {
    const tierMap = {
      'Iron 1':3,'Iron 2':4,'Iron 3':5,'Bronze 1':6,'Bronze 2':7,'Bronze 3':8,
      'Silver 1':9,'Silver 2':10,'Silver 3':11,'Gold 1':12,'Gold 2':13,'Gold 3':14,
      'Platinum 1':15,'Platinum 2':16,'Platinum 3':17,'Diamond 1':18,'Diamond 2':19,
      'Diamond 3':20,'Ascendant 1':21,'Ascendant 2':22,'Ascendant 3':23,
      'Immortal 1':24,'Immortal 2':25,'Immortal 3':26,'Radiant':27
    };
    const id = tierMap[tierName];
    if (!id) return null;
    return (id - 3) * 100;
  }

  function getRankFromRR(v) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (v >= RANKS[i].rr) return RANKS[i];
    }
    return RANKS[0];
  }

  function getLobbyRankInfo(allPlayers, teamId) {
    const withRank = allPlayers.filter(p => p.currenttier_patched && p.currenttier_patched !== 'Unranked' && p.currenttier && p.currenttier > 0);
    if (!withRank.length) return null;
    const allied = withRank.filter(p => (p.team || '').toLowerCase() === teamId);
    const enemy = withRank.filter(p => (p.team || '').toLowerCase() !== teamId);
    const avgTierRR = (arr) => {
      if (!arr.length) return null;
      const total = arr.reduce((s, p) => {
        const rr = getTierRR(p.currenttier_patched) || ((p.currenttier || 3) - 3) * 100;
        return s + rr;
      }, 0);
      return Math.round(total / arr.length);
    };
    const allAvg = avgTierRR(withRank);
    const allyAvg = avgTierRR(allied);
    const enemyAvg = avgTierRR(enemy);
    return {
      overall: allAvg != null ? getRankFromRR(allAvg) : null,
      ally: allyAvg != null ? getRankFromRR(allyAvg) : null,
      enemy: enemyAvg != null ? getRankFromRR(enemyAvg) : null,
    };
  }

  function getMVPs(matchData, teamId) {
    const all = getPlayerList(matchData);
    if (!all.length) return { matchMVP: null, teamMVP: null };
    const getACS = p => Math.round((p.stats?.score || 0) / 100);
    const matchMVP = all.reduce((best, p) => getACS(p) > getACS(best) ? p : best, all[0]);
    const allied = all.filter(p => (p.team || '').toLowerCase() === teamId);
    const teamMVP = allied.length ? allied.reduce((best, p) => getACS(p) > getACS(best) ? p : best, allied[0]) : null;
    return { matchMVP, teamMVP };
  }

  function getParties(players) {
    const partiesMap = {};
    if (!Array.isArray(players)) return {};
    
    players.forEach(p => {
      if (p.party_id) {
        if (!partiesMap[p.party_id]) {
          partiesMap[p.party_id] = [];
        }
        partiesMap[p.party_id].push(p);
      }
    });

    const multiPlayerParties = {};
    let partyIndex = 0;
    const colors = [
      '#FF4655', // Red
      '#00F0B5', // Teal/Cyan
      '#FFB000', // Gold/Yellow
      '#8C52FF', // Purple
      '#FF57B2', // Pink
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B'  // Amber
    ];

    Object.keys(partiesMap).forEach(partyId => {
      if (partiesMap[partyId].length >= 2) {
        multiPlayerParties[partyId] = {
          players: partiesMap[partyId],
          letter: String.fromCharCode(65 + partyIndex), // A, B, C...
          color: colors[partyIndex % colors.length]
        };
        partyIndex++;
      }
    });

    return multiPlayerParties;
  }

  $: allPlayers = getPlayerList(match);
  $: parties = getParties(allPlayers);
  $: allied = allPlayers
    .filter(p => (p.team || '').toLowerCase() === myTeamId)
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));
  $: enemy = allPlayers
    .filter(p => (p.team || '').toLowerCase() !== myTeamId)
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));
  $: mvpInfo = getMVPs(match, myTeamId);
  $: lobbyInfo = getLobbyRankInfo(allPlayers, myTeamId);
  $: totalRounds = match?.rounds?.length || match?.metadata?.rounds_played || 24;

  function computeAdvancedStats(matchData, roundsCount) {
    const statsMap = {};
    if (!matchData) return statsMap;
    
    const players = getPlayerList(matchData);
    
    // Initialize stats for each player
    players.forEach(p => {
      const pId = p.puuid || p.name || '';
      statsMap[pId] = {
        kdDiff: (p.stats?.kills || 0) - (p.stats?.deaths || 0),
        adr: roundsCount ? Math.round((p.damage_made || 0) / roundsCount) : 0,
        dd: roundsCount ? Math.round(((p.damage_made || 0) - (p.damage_received || 0)) / roundsCount) : 0,
        kastRounds: 0,
        kast: 0,
        firstKills: 0,
        firstDeaths: 0,
        multi3k: 0,
        multi4k: 0,
        multi5k: 0
      };
    });
    
    const rounds = matchData.rounds || [];
    rounds.forEach((r, ri) => {
      let allRoundKills = [];
      let playerStats = r.player_stats || r.playerStats || [];
      if (typeof playerStats === 'string') {
        try { playerStats = JSON.parse(playerStats); } catch (e) { playerStats = []; }
      }
      if (!Array.isArray(playerStats)) playerStats = Object.values(playerStats);
      
      playerStats.forEach(ps => {
        const killEvents = ps.kill_events || ps.killEvents || [];
        killEvents.forEach(k => {
          allRoundKills.push({
            time: k.kill_time_in_round ?? k.time_in_round ?? 0,
            killerPuuid: k.killer_puuid || k.killer,
            killerName: k.killer_display_name || '',
            victimPuuid: k.victim_puuid || k.victim,
            victimName: k.victim_display_name || '',
            assistants: k.assistants || []
          });
        });
      });
      
      // Sort kills by time to identify First Blood and First Death
      allRoundKills.sort((a, b) => a.time - b.time);
      
      let fbKillerPuuid = null;
      let fbKillerName = null;
      let fbVictimPuuid = null;
      let fbVictimName = null;
      if (allRoundKills.length > 0) {
        const firstKill = allRoundKills[0];
        fbKillerPuuid = firstKill.killerPuuid;
        fbKillerName = firstKill.killerName;
        fbVictimPuuid = firstKill.victimPuuid;
        fbVictimName = firstKill.victimName;
        
        const killerPlayer = players.find(p => {
          const pNameTag = (p.name && p.tag) ? `${p.name}#${p.tag}` : p.name || '';
          return (p.puuid && fbKillerPuuid && p.puuid === fbKillerPuuid) || 
                 (pNameTag && fbKillerName && pNameTag.toLowerCase() === fbKillerName.toLowerCase());
        });
        const victimPlayer = players.find(p => {
          const pNameTag = (p.name && p.tag) ? `${p.name}#${p.tag}` : p.name || '';
          return (p.puuid && fbVictimPuuid && p.puuid === fbVictimPuuid) || 
                 (pNameTag && fbVictimName && pNameTag.toLowerCase() === fbVictimName.toLowerCase());
        });
        
        if (killerPlayer) {
          const kId = killerPlayer.puuid || killerPlayer.name || '';
          if (statsMap[kId]) statsMap[kId].firstKills++;
        }
        if (victimPlayer) {
          const vId = victimPlayer.puuid || victimPlayer.name || '';
          if (statsMap[vId]) statsMap[vId].firstDeaths++;
        }
      }
      
      // Compute KAST and Multi-kills per player for this round
      playerStats.forEach(ps => {
        const puuid = ps.player_puuid || ps.subject || ps.puuid || ps.player_id;
        const playerObj = players.find(p => p.puuid === puuid || p.name === puuid);
        if (!playerObj) return;
        const pId = playerObj.puuid || playerObj.name || '';
        
        const pStats = statsMap[pId];
        if (!pStats) return;
        
        const rKills = typeof ps.kills === 'number' ? ps.kills : (ps.kills?.length || ps.kill_events?.length || 0);
        
        // Multi-kills
        if (rKills === 3) pStats.multi3k++;
        else if (rKills === 4) pStats.multi4k++;
        else if (rKills >= 5) pStats.multi5k++;
        
        const nameTag = (playerObj.name && playerObj.tag) ? `${playerObj.name}#${playerObj.tag}` : playerObj.name || '';
        const pPuuid = playerObj.puuid || '';

        // KAST conditions
        // K: Kill
        const gotKill = rKills > 0 || allRoundKills.some(k => 
          (pPuuid && k.killerPuuid === pPuuid) || 
          (nameTag && k.killerName && k.killerName.toLowerCase() === nameTag.toLowerCase())
        );

        // A: Assist
        const gotAssist = allRoundKills.some(k => 
          k.assistants && k.assistants.some(ast => 
            (pPuuid && ast.assistant_puuid === pPuuid) || 
            (nameTag && ast.assistant_display_name && ast.assistant_display_name.toLowerCase() === nameTag.toLowerCase())
          )
        );

        // S: Survive
        const playerDied = allRoundKills.some(k => 
          (pPuuid && k.victimPuuid === pPuuid) || 
          (nameTag && k.victimName && k.victimName.toLowerCase() === nameTag.toLowerCase())
        );
        const survived = !playerDied;
        
        // T: Traded
        let traded = false;
        if (playerDied) {
          const myDeath = allRoundKills.find(k => 
            (pPuuid && k.victimPuuid === pPuuid) || 
            (nameTag && k.victimName && k.victimName.toLowerCase() === nameTag.toLowerCase())
          );
          if (myDeath) {
            const killerPuuid = myDeath.killerPuuid;
            const killerName = myDeath.killerName;
            const myDeathTime = myDeath.time;
            const isMs = allRoundKills.some(k => k.time > 300);
            const threshold = isMs ? 4000 : 4;
            
            const teammateKill = allRoundKills.find(k => 
              ((killerPuuid && k.victimPuuid === killerPuuid) || 
               (killerName && k.victimName && k.victimName.toLowerCase() === killerName.toLowerCase())) &&
              k.time > myDeathTime && 
              (k.time - myDeathTime) <= threshold
            );
            if (teammateKill) {
              const traderPuuid = teammateKill.killerPuuid;
              const traderName = teammateKill.killerName;
              if ((pPuuid && traderPuuid !== pPuuid) || (nameTag && traderName && traderName.toLowerCase() !== nameTag.toLowerCase())) {
                traded = true;
              }
            }
          }
        }
        
        if (gotKill || gotAssist || survived || traded) {
          pStats.kastRounds++;
        }
      });
    });
    
    // Calculate final KAST percentage
    players.forEach(p => {
      const pId = p.puuid || p.name || '';
      const pStats = statsMap[pId];
      if (pStats && roundsCount) {
        pStats.kast = Math.round((pStats.kastRounds / roundsCount) * 100);
      }
    });
    
    return statsMap;
  }

  $: advancedStats = computeAdvancedStats(match, totalRounds);

  function isMe(player) {
    return player.name?.toLowerCase() === playerName.toLowerCase();
  }
</script>

{#if allPlayers.length === 0}
  <div class="no-detail">Player data unavailable</div>
{:else}
  <div class="scoreboard-wrap">
    {#if lobbyInfo && lobbyInfo.overall}
      <div class="lobby-rank-bar">
        <span class="lobby-rank-label">Lobby Avg</span>
        <div class="lobby-avg-rank">
          {#if getRankImgUrl(lobbyInfo.overall.name)}
            <img src={getRankImgUrl(lobbyInfo.overall.name)} alt={lobbyInfo.overall.name}>
          {/if}
          <span class="lobby-avg-rank-name" style="color:{getRankColor(lobbyInfo.overall.name)}">{lobbyInfo.overall.name}</span>
        </div>
        <div class="lobby-rank-divider"></div>
        <div class="lobby-team-ranks">
          <div class="lobby-team-block">
            <span class="lobby-team-label ally">YOUR TEAM</span>
            {#if lobbyInfo.ally && getRankImgUrl(lobbyInfo.ally.name)}
              <img src={getRankImgUrl(lobbyInfo.ally.name)} alt={lobbyInfo.ally.name} style="width:18px;height:18px;object-fit:contain;">
            {/if}
            <span class="lobby-team-avg-name ally">{lobbyInfo.ally?.name || '—'}</span>
          </div>
          <div class="lobby-rank-divider"></div>
          <div class="lobby-team-block">
            <span class="lobby-team-label enemy">ENEMY TEAM</span>
            {#if lobbyInfo.enemy && getRankImgUrl(lobbyInfo.enemy.name)}
              <img src={getRankImgUrl(lobbyInfo.enemy.name)} alt={lobbyInfo.enemy.name} style="width:18px;height:18px;object-fit:contain;">
            {/if}
            <span class="lobby-team-avg-name enemy">{lobbyInfo.enemy?.name || '—'}</span>
          </div>
        </div>
      </div>
    {/if}

    <table class="scoreboard" style="min-width: 800px;">
      <thead>
        <tr>
          <th>PLAYER</th>
          <th>RANK</th>
          <th>ACS</th>
          <th>K/D</th>
          <th>K</th>
          <th>D</th>
          <th>A</th>
          <th title="Kill Difference (Kills - Deaths)">+/-</th>
          <th title="Average Damage per Round">ADR</th>
          <th title="Average Damage Delta per Round">DD</th>
          <th title="Killed/Assisted/Survived/Traded %">KAST</th>
          <th>HS%</th>
          <th title="First Kills">FK</th>
          <th title="First Deaths">FD</th>
          <th title="Multi-Kill Rounds (3K / 4K / 5K)">MK</th>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="15" class="team-label allied">YOUR TEAM</td></tr>
        {#each allied as p}
          {@const s = p.stats || {}}
          {@const k = s.kills || 0}
          {@const d = s.deaths || 0}
          {@const a = s.assists || 0}
          {@const sc = s.score || 0}
          {@const hs = s.headshots || 0}
          {@const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0)}
          {@const hsPct = shots ? Math.round((hs / shots) * 100) : 0}
          {@const playerKd = d ? (k / d).toFixed(2) : k.toFixed(2)}
          {@const kdPct = Math.min(parseFloat(playerKd) / 3 * 100, 100)}
          {@const playerAcs = totalRounds ? Math.round(sc / totalRounds) : Math.round(sc / 100)}
          {@const isMatchMVP = mvpInfo.matchMVP && p.name === mvpInfo.matchMVP.name && p.tag === mvpInfo.matchMVP.tag}
          {@const isTeamMVP = mvpInfo.teamMVP && p.name === mvpInfo.teamMVP.name && p.tag === mvpInfo.teamMVP.tag && !isMatchMVP}
          {@const agentIcon = getAgentIconUrl(p.character || p.agent?.name || '')}
          {@const rankName = p.currenttier_patched || ''}
          {@const rankImg = rankName && rankName !== 'Unranked' ? getRankImgUrl(rankName) : ''}
          {@const rankColor = rankName ? getRankColor(rankName) : 'var(--muted)'}
          {@const pId = p.puuid || p.name || ''}
          {@const adv = advancedStats[pId] || {}}
          {@const kdDiff = adv.kdDiff ?? (k - d)}
          {@const adr = adv.adr ?? 0}
          {@const dd = adv.dd ?? 0}
          {@const kast = adv.kast ?? 0}
          {@const fk = adv.firstKills ?? 0}
          {@const fd = adv.firstDeaths ?? 0}
          {@const mk = `${adv.multi3k || 0}/${adv.multi4k || 0}/${adv.multi5k || 0}`}
          <tr class:me={isMe(p)} class:match-mvp-row={isMatchMVP} class:team-mvp-row={isTeamMVP}>
            <td>
              {#if p.party_id && parties[p.party_id]}
                <div class="sb-party-line" style="--party-color: {parties[p.party_id].color}" title="Queued together in party"></div>
              {/if}
              <div style="display:flex;align-items:center;gap:7px;">
                {#if agentIcon}
                  <img src={agentIcon} alt={p.character} style="width:26px;height:26px;object-fit:contain;border-radius:3px;background:var(--surface2);" on:error={(e) => e.target.style.display='none'}>
                {/if}
                <div>
                  <div class="sb-name">
                    {escapeHtml(p.name || '—')}
                    {#if isMatchMVP}
                      <span class="mvp-badge match-mvp">Match MVP</span>
                    {:else if isTeamMVP}
                      <span class="mvp-badge team-mvp">Team MVP</span>
                    {/if}
                  </div>
                  <div class="sb-agent">{escapeHtml((p.character || '—').toUpperCase())}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="sb-rank">
                {#if rankImg}
                  <img class="sb-rank-img" src={rankImg} alt={rankName} on:error={(e) => e.target.style.display='none'}>
                {/if}
                <span class="sb-rank-txt" style="color:{rankColor}">{escapeHtml(rankName || '—')}</span>
              </div>
            </td>
            <td>{playerAcs}</td>
            <td>
              <div>{playerKd}</div>
              <div class="sb-kd-bar"><div class="sb-kd-fill" style="width:{kdPct}%"></div></div>
            </td>
            <td><b>{k}</b></td>
            <td>{d}</td>
            <td>{a}</td>
            <td style="color:{kdDiff > 0 ? 'var(--win)' : kdDiff < 0 ? 'var(--loss)' : 'var(--muted)'}; font-weight:bold;">
              {kdDiff > 0 ? '+' : ''}{kdDiff}
            </td>
            <td>{adr}</td>
            <td style="color:{dd > 0 ? 'var(--win)' : dd < 0 ? 'var(--loss)' : 'var(--muted)'};">
              {dd > 0 ? '+' : ''}{dd}
            </td>
            <td>{kast}%</td>
            <td>{hsPct}%</td>
            <td style="color:var(--win); font-weight:bold;">{fk}</td>
            <td style="color:var(--loss);">{fd}</td>
            <td style="font-size:11px; font-family:'DM Mono',monospace; color:var(--muted);">{mk}</td>
          </tr>
        {/each}

        <tr><td colspan="15" class="team-label enemy">ENEMY TEAM</td></tr>
        {#each enemy as p}
          {@const s = p.stats || {}}
          {@const k = s.kills || 0}
          {@const d = s.deaths || 0}
          {@const a = s.assists || 0}
          {@const sc = s.score || 0}
          {@const hs = s.headshots || 0}
          {@const shots = (s.headshots || 0) + (s.bodyshots || 0) + (s.legshots || 0)}
          {@const hsPct = shots ? Math.round((hs / shots) * 100) : 0}
          {@const playerKd = d ? (k / d).toFixed(2) : k.toFixed(2)}
          {@const kdPct = Math.min(parseFloat(playerKd) / 3 * 100, 100)}
          {@const playerAcs = totalRounds ? Math.round(sc / totalRounds) : Math.round(sc / 100)}
          {@const agentIcon = getAgentIconUrl(p.character || p.agent?.name || '')}
          {@const rankName = p.currenttier_patched || ''}
          {@const rankImg = rankName && rankName !== 'Unranked' ? getRankImgUrl(rankName) : ''}
          {@const rankColor = rankName ? getRankColor(rankName) : 'var(--muted)'}
          {@const pId = p.puuid || p.name || ''}
          {@const adv = advancedStats[pId] || {}}
          {@const kdDiff = adv.kdDiff ?? (k - d)}
          {@const adr = adv.adr ?? 0}
          {@const dd = adv.dd ?? 0}
          {@const kast = adv.kast ?? 0}
          {@const fk = adv.firstKills ?? 0}
          {@const fd = adv.firstDeaths ?? 0}
          {@const mk = `${adv.multi3k || 0}/${adv.multi4k || 0}/${adv.multi5k || 0}`}
          <tr>
            <td>
              {#if p.party_id && parties[p.party_id]}
                <div class="sb-party-line" style="--party-color: {parties[p.party_id].color}" title="Queued together in party"></div>
              {/if}
              <div style="display:flex;align-items:center;gap:7px;">
                {#if agentIcon}
                  <img src={agentIcon} alt={p.character} style="width:26px;height:26px;object-fit:contain;border-radius:3px;background:var(--surface2);" on:error={(e) => e.target.style.display='none'}>
                {/if}
                <div>
                  <div class="sb-name">
                    {escapeHtml(p.name || '—')}
                  </div>
                  <div class="sb-agent">{escapeHtml((p.character || '—').toUpperCase())}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="sb-rank">
                {#if rankImg}
                  <img class="sb-rank-img" src={rankImg} alt={rankName} on:error={(e) => e.target.style.display='none'}>
                {/if}
                <span class="sb-rank-txt" style="color:{rankColor}">{escapeHtml(rankName || '—')}</span>
              </div>
            </td>
            <td>{playerAcs}</td>
            <td>
              <div>{playerKd}</div>
              <div class="sb-kd-bar"><div class="sb-kd-fill" style="width:{kdPct}%"></div></div>
            </td>
            <td><b>{k}</b></td>
            <td>{d}</td>
            <td>{a}</td>
            <td style="color:{kdDiff > 0 ? 'var(--win)' : kdDiff < 0 ? 'var(--loss)' : 'var(--muted)'}; font-weight:bold;">
              {kdDiff > 0 ? '+' : ''}{kdDiff}
            </td>
            <td>{adr}</td>
            <td style="color:{dd > 0 ? 'var(--win)' : dd < 0 ? 'var(--loss)' : 'var(--muted)'};">
              {dd > 0 ? '+' : ''}{dd}
            </td>
            <td>{kast}%</td>
            <td>{hsPct}%</td>
            <td style="color:var(--win); font-weight:bold;">{fk}</td>
            <td style="color:var(--loss);">{fd}</td>
            <td style="font-size:11px; font-family:'DM Mono',monospace; color:var(--muted);">{mk}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

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

  $: allPlayers = getPlayerList(match);
  $: allied = allPlayers
    .filter(p => (p.team || '').toLowerCase() === myTeamId)
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));
  $: enemy = allPlayers
    .filter(p => (p.team || '').toLowerCase() !== myTeamId)
    .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));
  $: mvpInfo = getMVPs(match, myTeamId);
  $: lobbyInfo = getLobbyRankInfo(allPlayers, myTeamId);
  $: totalRounds = match?.rounds?.length || match?.metadata?.rounds_played || 24;

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

    <table class="scoreboard">
      <thead>
        <tr>
          <th>PLAYER</th>
          <th>RANK</th>
          <th>K</th>
          <th>D</th>
          <th>A</th>
          <th>K/D</th>
          <th>ACS</th>
          <th>HS%</th>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="8" class="team-label allied">YOUR TEAM</td></tr>
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
          <tr class:me={isMe(p)} class:match-mvp-row={isMatchMVP} class:team-mvp-row={isTeamMVP}>
            <td>
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
            <td><b>{k}</b></td>
            <td>{d}</td>
            <td>{a}</td>
            <td>
              <div>{playerKd}</div>
              <div class="sb-kd-bar"><div class="sb-kd-fill" style="width:{kdPct}%"></div></div>
            </td>
            <td>{playerAcs}</td>
            <td>{hsPct}%</td>
          </tr>
        {/each}

        <tr><td colspan="8" class="team-label enemy">ENEMY TEAM</td></tr>
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
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:7px;">
                {#if agentIcon}
                  <img src={agentIcon} alt={p.character} style="width:26px;height:26px;object-fit:contain;border-radius:3px;background:var(--surface2);" on:error={(e) => e.target.style.display='none'}>
                {/if}
                <div>
                  <div class="sb-name">{escapeHtml(p.name || '—')}</div>
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
            <td><b>{k}</b></td>
            <td>{d}</td>
            <td>{a}</td>
            <td>
              <div>{playerKd}</div>
              <div class="sb-kd-bar"><div class="sb-kd-fill" style="width:{kdPct}%"></div></div>
            </td>
            <td>{playerAcs}</td>
            <td>{hsPct}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

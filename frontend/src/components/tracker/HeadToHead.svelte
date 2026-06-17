<script>
  import { apiFetch } from '../../lib/api';

  export let open = false;
  export let playerName = '';
  export let playerTag = '';
  export let region = 'ap';
  export let recentPlayers = [];
  export let onClose = () => {};

  let p1Name = '';
  let p1Tag = '';
  let p2Name = '';
  let p2Tag = '';
  let loading = false;
  let error = '';
  let result = null;

  $: if (open) {
    p1Name = playerName;
    p1Tag = playerTag;
    p2Name = '';
    p2Tag = '';
    result = null;
    error = '';
  }

  function getPlayerList(match) {
    if (!match?.players?.all_players) return [];
    return match.players.all_players;
  }

  function getRankImgUrl(rankName) {
    const rankMap = {
      'iron 1': 1, 'iron 2': 2, 'iron 3': 3,
      'bronze 1': 4, 'bronze 2': 5, 'bronze 3': 6,
      'silver 1': 7, 'silver 2': 8, 'silver 3': 9,
      'gold 1': 10, 'gold 2': 11, 'gold 3': 12,
      'platinum 1': 13, 'platinum 2': 14, 'platinum 3': 15,
      'diamond 1': 16, 'diamond 2': 17, 'diamond 3': 18,
      'ascendant 1': 19, 'ascendant 2': 20, 'ascendant 3': 21,
      'immortal 1': 22, 'immortal 2': 23, 'immortal 3': 24,
      'radiant': 25
    };
    const id = rankMap[rankName?.toLowerCase()] || 0;
    return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${id}/smallicon.png`;
  }

  function compilePlayerStats(matchData, pname, ptag) {
    if (!matchData || !Array.isArray(matchData.data)) return null;
    const matches = matchData.data;
    if (matches.length === 0) return null;

    let wins = 0, totalKills = 0, totalDeaths = 0, totalAssists = 0;
    let totalScore = 0, totalRounds = 0, totalHS = 0, totalShots = 0;
    let streakForm = [];

    matches.forEach(m => {
      const playersList = getPlayerList(m);
      const me = playersList.find(x => x.name?.toLowerCase() === pname.toLowerCase() && x.tag?.toLowerCase() === ptag.toLowerCase());
      if (!me) return;

      const myTeamId = (me.team || '').toLowerCase();
      const myTeam = m.teams?.[myTeamId];
      const oppTeamId = myTeamId === 'red' ? 'blue' : 'red';
      const oppTeam = m.teams?.[oppTeamId];

      let won = false;
      if (myTeam?.has_won != null) won = myTeam.has_won;
      else if (myTeam?.rounds_won != null && oppTeam?.rounds_won != null) won = myTeam.rounds_won > oppTeam.rounds_won;

      if (won) wins++;
      streakForm.push(won ? 'W' : 'L');

      totalKills += me.stats?.kills || 0;
      totalDeaths += me.stats?.deaths || 0;
      totalAssists += me.stats?.assists || 0;
      totalScore += me.stats?.score || 0;

      const gameRounds = m.rounds?.length || (myTeam?.rounds_won != null && oppTeam?.rounds_won != null ? (myTeam.rounds_won + oppTeam.rounds_won) : 1);
      totalRounds += gameRounds;

      if (me.stats?.headshots != null && me.stats?.bodyshots != null && me.stats?.legshots != null) {
        totalHS += me.stats.headshots;
        totalShots += (me.stats.headshots + me.stats.bodyshots + me.stats.legshots);
      }
    });

    const totalMatches = streakForm.length || 1;
    return {
      matchesCount: totalMatches,
      winRate: Math.round((wins / totalMatches) * 100),
      kd: totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills,
      acs: totalRounds > 0 ? Math.round(totalScore / totalRounds) : 0,
      hsRate: totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0,
      avgKills: totalKills / totalMatches,
      avgDeaths: totalDeaths / totalMatches,
      avgAssists: totalAssists / totalMatches,
      streakForm: streakForm.slice(0, 5)
    };
  }

  async function fetchH2H() {
    if (!p1Name || !p1Tag || !p2Name || !p2Tag) {
      error = 'Please fill all fields for both players';
      return;
    }

    loading = true;
    error = '';
    result = null;

    try {
      const enc1 = encodeURIComponent(p1Name);
      const enc1t = encodeURIComponent(p1Tag);
      const enc2 = encodeURIComponent(p2Name);
      const enc2t = encodeURIComponent(p2Tag);

      const [p1MatchRes, p2MatchRes, p1MmrRes, p2MmrRes, p1AccRes, p2AccRes] = await Promise.all([
        apiFetch(`/v3/matches/${region}/${enc1}/${enc1t}?mode=competitive&size=20`),
        apiFetch(`/v3/matches/${region}/${enc2}/${enc2t}?mode=competitive&size=20`),
        apiFetch(`/v3/mmr/${region}/pc/${enc1}/${enc1t}`).catch(() => null),
        apiFetch(`/v3/mmr/${region}/pc/${enc2}/${enc2t}`).catch(() => null),
        apiFetch(`/v1/account/${enc1}/${enc1t}`).catch(() => null),
        apiFetch(`/v1/account/${enc2}/${enc2t}`).catch(() => null)
      ]);

      const s1 = compilePlayerStats(p1MatchRes, p1Name, p1Tag);
      const s2 = compilePlayerStats(p2MatchRes, p2Name, p2Tag);

      if (!s1 || !s2) {
        error = 'Insufficient competitive match history. Run at least 1 match to generate telemetry.';
        loading = false;
        return;
      }

      const p1CardUrl = p1AccRes?.data?.card?.wide || p1AccRes?.data?.card?.large || '';
      const p2CardUrl = p2AccRes?.data?.card?.wide || p2AccRes?.data?.card?.large || '';
      const p1AvatarUrl = p1AccRes?.data?.card?.small || '';
      const p2AvatarUrl = p2AccRes?.data?.card?.small || '';
      const p1Level = p1AccRes?.data?.account_level || '\u2014';
      const p2Level = p2AccRes?.data?.account_level || '\u2014';
      const p1RankName = p1MmrRes?.data?.current?.tier?.name || 'Unranked';
      const p2RankName = p2MmrRes?.data?.current?.tier?.name || 'Unranked';
      const p1RankIcon = getRankImgUrl(p1RankName);
      const p2RankIcon = getRankImgUrl(p2RankName);
      const p1RR = p1MmrRes?.data?.current?.rr != null ? `${p1MmrRes.data.current.rr} RR` : '';
      const p2RR = p2MmrRes?.data?.current?.rr != null ? `${p2MmrRes.data.current.rr} RR` : '';

      const maxKD = Math.max(s1.kd, s2.kd, 0.1);
      const p1KdPct = Math.round((s1.kd / maxKD) * 100);
      const p2KdPct = Math.round((s2.kd / maxKD) * 100);
      const maxACS = Math.max(s1.acs, s2.acs, 1);
      const p1AcsPct = Math.round((s1.acs / maxACS) * 100);
      const p2AcsPct = Math.round((s2.acs / maxACS) * 100);
      const maxWR = Math.max(s1.winRate, s2.winRate, 1);
      const p1WrPct = Math.round((s1.winRate / maxWR) * 100);
      const p2WrPct = Math.round((s2.winRate / maxWR) * 100);

      let p1Wins = 0, p2Wins = 0;
      const dims = [];

      if (s1.hsRate > s2.hsRate + 2) { p1Wins++; dims.push({ icon: '\u{1F3AF}', text: `Aim Precision: ${p1Name} dominates (+${s1.hsRate - s2.hsRate}% HS)` }); }
      else if (s2.hsRate > s1.hsRate + 2) { p2Wins++; dims.push({ icon: '\u{1F3AF}', text: `Aim Precision: ${p2Name} dominates (+${s2.hsRate - s1.hsRate}% HS)` }); }
      else { dims.push({ icon: '\u{1F3AF}', text: `Aim Precision: Evenly matched (${s1.hsRate}% vs ${s2.hsRate}%)` }); }

      if (s1.acs > s2.acs + 20) { p1Wins++; dims.push({ icon: '\u{2694}\u{FE0F}', text: `Combat Volume: ${p1Name} is more impactful (+${s1.acs - s2.acs} ACS)` }); }
      else if (s2.acs > s1.acs + 20) { p2Wins++; dims.push({ icon: '\u{2694}\u{FE0F}', text: `Combat Volume: ${p2Name} is more impactful (+${s2.acs - s1.acs} ACS)` }); }
      else { dims.push({ icon: '\u{2694}\u{FE0F}', text: 'Combat Volume: Comparable pressure' }); }

      if (s1.kd > s2.kd + 0.08) { p1Wins++; dims.push({ icon: '\u{1F6E1}\u{FE0F}', text: `Survivability: ${p1Name} is more surgical (+${(s1.kd - s2.kd).toFixed(2)} K/D)` }); }
      else if (s2.kd > s1.kd + 0.08) { p2Wins++; dims.push({ icon: '\u{1F6E1}\u{FE0F}', text: `Survivability: ${p2Name} is more surgical (+${(s2.kd - s1.kd).toFixed(2)} K/D)` }); }
      else { dims.push({ icon: '\u{1F6E1}\u{FE0F}', text: 'Survivability: Equivalent trade ratios' }); }

      if (s1.winRate > s2.winRate + 5) { p1Wins++; dims.push({ icon: '\u{1F451}', text: `Match Impact: ${p1Name} has higher round control (+${s1.winRate - s2.winRate}% WR)` }); }
      else if (s2.winRate > s1.winRate + 5) { p2Wins++; dims.push({ icon: '\u{1F451}', text: `Match Impact: ${p2Name} has higher round control (+${s2.winRate - s1.winRate}% WR)` }); }
      else { dims.push({ icon: '\u{1F451}', text: 'Match Impact: Matched win efficiency' }); }

      let combatGrade = 'B';
      let verdictText = '';
      if (p1Wins === 4) { combatGrade = 'S'; verdictText = `Absolute Mechanical Domination! ${p1Name} outperforms ${p2Name} across every performance pillar.`; }
      else if (p2Wins === 4) { combatGrade = 'D'; verdictText = `Severe Disadvantage. ${p2Name} dominates every major category. ${p1Name} must adopt a reactive strategy.`; }
      else if (p1Wins === 3) { combatGrade = 'A'; verdictText = `Clear Mechanical Advantage. ${p1Name} holds significant leverage in firefights and map influence.`; }
      else if (p2Wins === 3) { combatGrade = 'C'; verdictText = `Uphill Encounter. ${p2Name} wins 3 of 4 categories. Play defensively and avoid dry duels.`; }
      else { combatGrade = 'B'; verdictText = 'Balanced Dogfight. Both competitors demonstrate comparable aim, positioning, and round impact.'; }

      result = {
        s1, s2, p1CardUrl, p2CardUrl, p1AvatarUrl, p2AvatarUrl,
        p1Level, p2Level, p1RankName, p2RankName, p1RankIcon, p2RankIcon,
        p1RR, p2RR, p1KdPct, p2KdPct, p1AcsPct, p2AcsPct, p1WrPct, p2WrPct,
        dims, combatGrade, verdictText, p1Name, p1Tag, p2Name, p2Tag
      };
    } catch (e) {
      error = e.message || 'Failed to fetch player data';
    }

    loading = false;
  }

  function handleQuickChip(name, tag) {
    p2Name = name;
    p2Tag = tag;
    fetchH2H();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="h2h-overlay" on:click|self={onClose}>
    <div class="h2h-modal-card">
      <div class="h2h-header">
        <div class="h2h-title">HEAD-TO-HEAD BATTLEGROUND</div>
        <button class="h2h-close" on:click={onClose}>&#10005;</button>
      </div>

      {#if recentPlayers.length > 0}
        <div class="h2h-quick-section">
          <div class="h2h-quick-title">Quick Comparisons</div>
          <div class="h2h-quick-scroll">
            {#each recentPlayers.slice(0, 15) as rp}
              <button class="h2h-quick-chip" on:click={() => handleQuickChip(rp.name, rp.tag)}>
                {rp.name}#{rp.tag}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="h2h-inputs">
        <div class="h2h-input-block">
          <div class="h2h-input-label"><span class="h2h-dot blue"></span> PLAYER 1 (YOU)</div>
          <div class="h2h-input-row">
            <input class="h2h-input" bind:value={p1Name} placeholder="Name" />
            <span class="h2h-hash">#</span>
            <input class="h2h-input h2h-input-tag" bind:value={p1Tag} placeholder="TAG" />
          </div>
        </div>
        <div class="h2h-input-block">
          <div class="h2h-input-label"><span class="h2h-dot purple"></span> PLAYER 2 (OPPONENT)</div>
          <div class="h2h-input-row">
            <input class="h2h-input" bind:value={p2Name} placeholder="Riot ID Name" />
            <span class="h2h-hash">#</span>
            <input class="h2h-input h2h-input-tag" bind:value={p2Tag} placeholder="TAG" />
          </div>
        </div>
      </div>

      <button class="h2h-fetch-btn" on:click={fetchH2H} disabled={loading}>
        {loading ? 'RETRIEVING DUEL DATA...' : 'RETRIEVE DUAL PERFORMANCE SUMMARY'}
      </button>

      {#if error}
        <div class="h2h-error">{error}</div>
      {/if}

      {#if result}
        <div class="h2h-results">
          <!-- Duel Banners -->
          <div class="h2h-duel-header">
            <div class="h2h-player-banner" style="background-image: url('{result.p1CardUrl}')">
              <div class="h2h-banner-content">
                <div class="h2h-banner-avatar">
                  {#if result.p1AvatarUrl}
                    <img src={result.p1AvatarUrl} alt={result.p1Name} />
                  {:else}
                    <div class="h2h-avatar-placeholder">👤</div>
                  {/if}
                </div>
                <div class="h2h-banner-info">
                  <div class="h2h-banner-name">{result.p1Name}</div>
                  <div class="h2h-banner-tag">#{result.p1Tag} · LVL {result.p1Level}</div>
                </div>
                <div class="h2h-banner-rank">
                  <img class="h2h-banner-rank-icon" src={result.p1RankIcon} alt={result.p1RankName} />
                  <div class="h2h-banner-rank-text">{result.p1RankName} {result.p1RR}</div>
                </div>
              </div>
            </div>

            <div class="h2h-vs-divider">
              <div class="h2h-vs-circle">VS</div>
            </div>

            <div class="h2h-player-banner right" style="background-image: url('{result.p2CardUrl}')">
              <div class="h2h-banner-content right">
                <div class="h2h-banner-avatar">
                  {#if result.p2AvatarUrl}
                    <img src={result.p2AvatarUrl} alt={result.p2Name} />
                  {:else}
                    <div class="h2h-avatar-placeholder">👤</div>
                  {/if}
                </div>
                <div class="h2h-banner-info">
                  <div class="h2h-banner-name">{result.p2Name}</div>
                  <div class="h2h-banner-tag">#{result.p2Tag} · LVL {result.p2Level}</div>
                </div>
                <div class="h2h-banner-rank">
                  <img class="h2h-banner-rank-icon" src={result.p2RankIcon} alt={result.p2RankName} />
                  <div class="h2h-banner-rank-text">{result.p2RankName} {result.p2RR}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento Grid -->
          <div class="h2h-bento-grid">
            <!-- ACS -->
            <div class="h2h-stat-card">
              <div class="h2h-stat-label">AVERAGE COMBAT SCORE (ACS)</div>
              <div class="h2h-comparison-row">
                <div class="h2h-stat-value left" style="color:{result.s1.acs >= result.s2.acs ? 'var(--win)' : 'var(--muted)'}">{result.s1.acs}</div>
                <div class="h2h-bars-wrap">
                  <div class="h2h-bar-container"><div class="h2h-bar-fill left {result.s1.acs >= result.s2.acs ? 'winner' : ''}" style="width:{result.p1AcsPct}%"></div></div>
                  <div class="h2h-bar-container"><div class="h2h-bar-fill right {result.s2.acs >= result.s1.acs ? 'winner' : ''}" style="width:{result.p2AcsPct}%"></div></div>
                </div>
                <div class="h2h-stat-value right" style="color:{result.s2.acs >= result.s1.acs ? 'var(--win)' : 'var(--muted)'}">{result.s2.acs}</div>
              </div>
            </div>

            <!-- K/D -->
            <div class="h2h-stat-card">
              <div class="h2h-stat-label">KILL/DEATH RATIO (K/D)</div>
              <div class="h2h-comparison-row">
                <div class="h2h-stat-value left" style="color:{result.s1.kd >= result.s2.kd ? 'var(--win)' : 'var(--muted)'}">{result.s1.kd.toFixed(2)}</div>
                <div class="h2h-bars-wrap">
                  <div class="h2h-bar-container"><div class="h2h-bar-fill left {result.s1.kd >= result.s2.kd ? 'winner' : ''}" style="width:{result.p1KdPct}%"></div></div>
                  <div class="h2h-bar-container"><div class="h2h-bar-fill right {result.s2.kd >= result.s1.kd ? 'winner' : ''}" style="width:{result.p2KdPct}%"></div></div>
                </div>
                <div class="h2h-stat-value right" style="color:{result.s2.kd >= result.s1.kd ? 'var(--win)' : 'var(--muted)'}">{result.s2.kd.toFixed(2)}</div>
              </div>
            </div>

            <!-- Win Rate -->
            <div class="h2h-stat-card">
              <div class="h2h-stat-label">WIN RATE %</div>
              <div class="h2h-comparison-row">
                <div class="h2h-stat-value left" style="color:{result.s1.winRate >= result.s2.winRate ? 'var(--win)' : 'var(--muted)'}">{result.s1.winRate}%</div>
                <div class="h2h-bars-wrap">
                  <div class="h2h-bar-container"><div class="h2h-bar-fill left {result.s1.winRate >= result.s2.winRate ? 'winner' : ''}" style="width:{result.p1WrPct}%"></div></div>
                  <div class="h2h-bar-container"><div class="h2h-bar-fill right {result.s2.winRate >= result.s1.winRate ? 'winner' : ''}" style="width:{result.p2WrPct}%"></div></div>
                </div>
                <div class="h2h-stat-value right" style="color:{result.s2.winRate >= result.s1.winRate ? 'var(--win)' : 'var(--muted)'}">{result.s2.winRate}%</div>
              </div>
            </div>

            <!-- Form -->
            <div class="h2h-stat-card">
              <div class="h2h-stat-label">RECENT FORM (LAST 5)</div>
              <div class="h2h-comparison-row" style="padding:4px 0">
                <div class="h2h-streak-wrap left">
                  {#each [...result.s1.streakForm].reverse() as wl}
                    <div class="h2h-streak-box {wl === 'W' ? 'w' : 'l'}">{wl}</div>
                  {/each}
                </div>
                <div class="h2h-form-label">FORM</div>
                <div class="h2h-streak-wrap right">
                  {#each result.s2.streakForm as wl}
                    <div class="h2h-streak-box {wl === 'W' ? 'w' : 'l'}">{wl}</div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Aim Precision -->
            <div class="h2h-stat-card span-2">
              <div class="h2h-stat-label">AIM PRECISION (HEADSHOT RATIO)</div>
              <div class="h2h-circle-row">
                <div class="h2h-dial-wrap">
                  <div class="h2h-dial-circle">
                    <svg width="90" height="90">
                      <circle class="h2h-dial-bg" cx="45" cy="45" r="38"></circle>
                      <circle class="h2h-dial-bar {result.s1.hsRate >= result.s2.hsRate ? 'winner' : 'left'}" cx="45" cy="45" r="38"
                        stroke-dasharray={2 * Math.PI * 38}
                        stroke-dashoffset={2 * Math.PI * 38 - (result.s1.hsRate / 100) * 2 * Math.PI * 38}></circle>
                    </svg>
                    <div class="h2h-dial-text">{result.s1.hsRate}%</div>
                  </div>
                  <div class="h2h-dial-name">{result.p1Name}</div>
                </div>
                <div class="h2h-aim-gap">
                  <div class="h2h-aim-gap-title">AIM GAP: {Math.abs(result.s1.hsRate - result.s2.hsRate)}%</div>
                  <div class="h2h-aim-gap-desc">
                    {#if result.s1.hsRate > result.s2.hsRate + 2}
                      <strong>{result.p1Name}</strong> exhibits higher first-bullet precision.
                    {:else if result.s2.hsRate > result.s1.hsRate + 2}
                      <strong>{result.p2Name}</strong> exhibits exceptional click-timing precision.
                    {:else}
                      Precision indexes are aligned. Winner determined by movement and positioning.
                    {/if}
                  </div>
                </div>
                <div class="h2h-dial-wrap">
                  <div class="h2h-dial-circle">
                    <svg width="90" height="90">
                      <circle class="h2h-dial-bg" cx="45" cy="45" r="38"></circle>
                      <circle class="h2h-dial-bar {result.s2.hsRate >= result.s1.hsRate ? 'winner' : 'right'}" cx="45" cy="45" r="38"
                        stroke-dasharray={2 * Math.PI * 38}
                        stroke-dashoffset={2 * Math.PI * 38 - (result.s2.hsRate / 100) * 2 * Math.PI * 38}></circle>
                    </svg>
                    <div class="h2h-dial-text">{result.s2.hsRate}%</div>
                  </div>
                  <div class="h2h-dial-name">{result.p2Name}</div>
                </div>
              </div>
            </div>

            <!-- KDA Details -->
            <div class="h2h-stat-card span-2">
              <div class="h2h-stat-label">KDA PERFORMANCE AVERAGES</div>
              <div class="h2h-kda-row">
                <div class="h2h-kda-block">
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Kills</span>{result.s1.avgKills.toFixed(1)}</div>
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Deaths</span>{result.s1.avgDeaths.toFixed(1)}</div>
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Assists</span>{result.s1.avgAssists.toFixed(1)}</div>
                </div>
                <div class="h2h-kda-mid">K / D / A</div>
                <div class="h2h-kda-block">
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Kills</span>{result.s2.avgKills.toFixed(1)}</div>
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Deaths</span>{result.s2.avgDeaths.toFixed(1)}</div>
                  <div class="h2h-kda-val"><span class="h2h-kda-lbl">Assists</span>{result.s2.avgAssists.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Verdict -->
          <div class="h2h-verdict-card">
            <div class="h2h-verdict-left">
              <div class="h2h-grade-title">COMBAT GRADE</div>
              <div class="h2h-grade-badge {result.combatGrade.toLowerCase()}">{result.combatGrade}</div>
            </div>
            <div class="h2h-verdict-right">
              <div class="h2h-verdict-summary">VERDICT: {result.verdictText}</div>
              <div class="h2h-verdict-dims">
                {#each result.dims as d}
                  <div class="h2h-verdict-item"><span class="h2h-verdict-bullet">{d.icon}</span> {d.text}</div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .h2h-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    background: rgba(6,6,8,0.8);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .h2h-modal-card {
    width: 900px;
    max-width: 96vw;
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(180deg, rgba(15,15,18,0.95) 0%, rgba(10,10,12,0.98) 100%);
    border: 1px solid rgba(179,102,255,0.25);
    border-radius: 16px;
    padding: 24px;
    box-sizing: border-box;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }

  .h2h-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 12px;
  }

  .h2h-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 26px;
    color: #b366ff;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .h2h-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .h2h-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .h2h-quick-section { margin-bottom: 16px; }
  .h2h-quick-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .h2h-quick-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .h2h-quick-scroll::-webkit-scrollbar { height: 3px; }
  .h2h-quick-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  .h2h-quick-chip {
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(179,102,255,0.08);
    border: 1px solid rgba(179,102,255,0.2);
    color: #b366ff;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .h2h-quick-chip:hover {
    background: rgba(179,102,255,0.18);
    border-color: rgba(179,102,255,0.4);
  }

  .h2h-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .h2h-input-block { width: 100%; }
  .h2h-input-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 12px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .h2h-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .h2h-dot.blue { background: #3b82f6; }
  .h2h-dot.purple { background: #b366ff; }

  .h2h-input-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .h2h-input {
    flex: 1;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 12px;
    color: #fff;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    outline: none;
    transition: border-color 0.2s;
  }
  .h2h-input:focus { border-color: rgba(179,102,255,0.5); }
  .h2h-input::placeholder { color: rgba(255,255,255,0.2); }
  .h2h-input-tag { width: 100px; flex: none; }
  .h2h-hash { color: rgba(255,255,255,0.2); font-weight: 700; }

  .h2h-fetch-btn {
    width: 100%;
    background: linear-gradient(90deg, #b366ff 0%, #8c26ff 100%);
    color: #fff;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 16px;
    letter-spacing: 1px;
    border: none;
    padding: 12px 0;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(179,102,255,0.3);
    transition: all 0.3s ease;
    margin-bottom: 25px;
  }
  .h2h-fetch-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  .h2h-fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .h2h-error {
    text-align: center;
    color: var(--loss, #f43f5e);
    padding: 20px;
    border: 1px dashed rgba(244,63,94,0.3);
    border-radius: 8px;
    background: rgba(244,63,94,0.03);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
  }

  .h2h-results { display: flex; flex-direction: column; gap: 16px; }

  .h2h-duel-header {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .h2h-player-banner {
    flex: 1;
    background-size: cover;
    background-position: center;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    min-height: 100px;
  }
  .h2h-player-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(15,15,18,0.85) 0%, rgba(15,15,18,0.4) 100%);
  }
  .h2h-player-banner.right::after {
    background: linear-gradient(225deg, rgba(15,15,18,0.85) 0%, rgba(15,15,18,0.4) 100%);
  }

  .h2h-banner-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }
  .h2h-banner-content.right { flex-direction: row-reverse; text-align: right; }

  .h2h-banner-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(179,102,255,0.4);
    flex-shrink: 0;
  }
  .h2h-banner-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .h2h-avatar-placeholder { font-size: 28px; display: flex; align-items: center; justify-content: center; height: 100%; }

  .h2h-banner-info { flex: 1; min-width: 0; }
  .h2h-banner-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    text-transform: uppercase;
  }
  .h2h-banner-tag {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.5);
  }

  .h2h-banner-rank { text-align: right; flex-shrink: 0; }
  .h2h-banner-rank-icon { width: 36px; height: 36px; object-fit: contain; }
  .h2h-banner-rank-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    margin-top: 2px;
  }

  .h2h-vs-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .h2h-vs-circle {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 900;
    color: #b366ff;
    background: rgba(179,102,255,0.1);
    border: 2px solid rgba(179,102,255,0.3);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: vs-pulse 2s infinite alternate;
  }
  @keyframes vs-pulse {
    0% { box-shadow: 0 0 4px rgba(179,102,255,0.15); }
    100% { box-shadow: 0 0 16px rgba(179,102,255,0.45); }
  }

  .h2h-bento-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .h2h-stat-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 14px 16px;
  }
  .h2h-stat-card.span-2 { grid-column: span 2; }

  .h2h-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .h2h-comparison-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .h2h-stat-value {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px;
    font-weight: 900;
    color: #fff;
    min-width: 50px;
  }
  .h2h-stat-value.left { text-align: right; }
  .h2h-stat-value.right { text-align: left; }

  .h2h-bars-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .h2h-bar-container {
    height: 8px;
    background: rgba(255,255,255,0.04);
    border-radius: 4px;
    overflow: hidden;
  }
  .h2h-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .h2h-bar-fill.left { background: #3b82f6; margin-left: auto; }
  .h2h-bar-fill.right { background: #b366ff; }
  .h2h-bar-fill.winner { box-shadow: 0 0 8px currentColor; }

  .h2h-streak-wrap {
    flex: 1;
    display: flex;
    gap: 4px;
  }
  .h2h-streak-wrap.left { justify-content: flex-end; }
  .h2h-streak-wrap.right { justify-content: flex-start; }
  .h2h-form-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    color: var(--muted2, #5b5b66);
    font-weight: 700;
    letter-spacing: 1px;
    width: 60px;
    text-align: center;
  }
  .h2h-streak-box {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }
  .h2h-streak-box.w { background: rgba(16,185,129,0.3); border: 1px solid rgba(16,185,129,0.5); }
  .h2h-streak-box.l { background: rgba(244,63,94,0.3); border: 1px solid rgba(244,63,94,0.5); }

  .h2h-circle-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }
  .h2h-dial-wrap { text-align: center; }
  .h2h-dial-circle { position: relative; width: 90px; height: 90px; }
  .h2h-dial-circle svg { transform: rotate(-90deg); }
  .h2h-dial-bg { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 5; }
  .h2h-dial-bar {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .h2h-dial-bar.left { stroke: #3b82f6; }
  .h2h-dial-bar.right { stroke: #b366ff; }
  .h2h-dial-bar.winner { stroke: var(--win, #10b981); filter: drop-shadow(0 0 6px rgba(16,185,129,0.4)); }
  .h2h-dial-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 900;
    color: #fff;
  }
  .h2h-dial-name {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #a0a0ab);
    margin-top: 4px;
  }

  .h2h-aim-gap { text-align: center; max-width: 240px; }
  .h2h-aim-gap-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 900;
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .h2h-aim-gap-desc {
    font-size: 12px;
    color: var(--muted, #a0a0ab);
    line-height: 1.3;
  }

  .h2h-kda-row {
    display: grid;
    grid-template-columns: 1fr 80px 1fr;
    align-items: center;
    gap: 16px;
    font-family: 'DM Mono', monospace;
    font-size: 16px;
    color: #fff;
    text-align: center;
  }
  .h2h-kda-block {
    display: flex;
    justify-content: space-around;
    background: rgba(0,0,0,0.15);
    padding: 8px 0;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.02);
  }
  .h2h-kda-val { display: flex; flex-direction: column; }
  .h2h-kda-lbl { font-size: 11px; color: var(--muted, #a0a0ab); }
  .h2h-kda-mid {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    color: var(--muted2, #5b5b66);
    font-weight: 700;
    letter-spacing: 1px;
  }

  .h2h-verdict-card {
    display: flex;
    gap: 24px;
    background: rgba(179,102,255,0.04);
    border: 1px solid rgba(179,102,255,0.15);
    border-radius: 12px;
    padding: 20px;
  }
  .h2h-verdict-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .h2h-grade-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted, #a0a0ab);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .h2h-grade-badge {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 36px;
    font-weight: 900;
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid;
  }
  .h2h-grade-badge.s { color: #ffd700; border-color: #ffd700; background: rgba(255,215,0,0.1); box-shadow: 0 0 16px rgba(255,215,0,0.2); }
  .h2h-grade-badge.a { color: #e8ff47; border-color: #e8ff47; background: rgba(232,255,71,0.1); }
  .h2h-grade-badge.b { color: #3b82f6; border-color: #3b82f6; background: rgba(59,130,246,0.1); }
  .h2h-grade-badge.c { color: #a0a0ab; border-color: #a0a0ab; background: rgba(160,160,171,0.1); }
  .h2h-grade-badge.d { color: #f43f5e; border-color: #f43f5e; background: rgba(244,63,94,0.1); }

  .h2h-verdict-right { flex: 1; }
  .h2h-verdict-summary {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    line-height: 1.4;
    margin-bottom: 12px;
  }
  .h2h-verdict-dims { display: flex; flex-direction: column; gap: 6px; }
  .h2h-verdict-item {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .h2h-verdict-bullet { flex-shrink: 0; }

  @media (max-width: 768px) {
    .h2h-inputs { grid-template-columns: 1fr; gap: 12px; }
    .h2h-duel-header { flex-direction: column; gap: 0; }
    .h2h-vs-divider { padding: 8px 0; }
    .h2h-bento-grid { grid-template-columns: 1fr; }
    .h2h-stat-card.span-2 { grid-column: span 1; }
    .h2h-verdict-card { flex-direction: column; }
    .h2h-circle-row { flex-direction: column; gap: 16px; }
    .h2h-kda-row { grid-template-columns: 1fr; gap: 8px; }
  }
</style>

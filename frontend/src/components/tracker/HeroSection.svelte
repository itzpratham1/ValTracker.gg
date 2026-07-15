<script>
  import { player } from '../../lib/appStore';
  import { getRankImgUrl, getRankFromRR, ACTS_TIMELINE } from '../../lib/constants';
  import { escapeHtml } from '../../lib/utils';

  export let mmrData = null;
  export let accountData = null;
  export let matches = [];
  export let stats = null;

  $: rankName = mmrData?.current?.tier?.name || 'UNRANKED';
  $: rankImg = getRankImgUrl(rankName);
  $: currentRR = mmrData?.current?.rr ?? 0;
  $: peakName = mmrData?.peak?.tier?.name || '—';
  $: peakImg = getRankImgUrl(peakName);
  $: tierId = mmrData?.current?.tier?.id ?? 0;
  $: playerName = $player.name || '—';
  $: playerTag = $player.tag || '';
  $: modeLabel = { competitive:'Competitive', unrated:'Unrated', deathmatch:'Deathmatch', teamdeathmatch:'Team Deathmatch', swiftplay:'Swiftplay', spikerush:'Spike Rush' }[$player.mode] || $player.mode;

  $: accountLevel = accountData?.account_level || '—';
  $: cardId = (typeof accountData?.card === 'string') ? accountData.card : (accountData?.card?.id || null);
  $: cardUrl = accountData?.card?.wide || accountData?.card?.large || (cardId ? `https://media.valorant-api.com/playercards/${cardId}/wideart.png` : null);
  $: smallCardUrl = accountData?.card?.small || (cardId ? `https://media.valorant-api.com/playercards/${cardId}/smallart.png` : null);

  $: isRanked = $player.mode === 'competitive';

  $: streak = computeStreak(matches);
  $: rankPrediction = computeRankPrediction(matches, currentRR);

  function computeStreak(allMatches) {
    if (!allMatches || !allMatches.length) return { count: 0, type: null };
    const first = allMatches[0];
    const me0 = first.players?.all_players?.find(p =>
      p.name?.toLowerCase() === $player.name?.toLowerCase() &&
      p.tag?.toLowerCase() === $player.tag?.toLowerCase()
    ) || first.players?.[0];
    if (!me0) return { count: 0, type: null };
    const firstWon = first.teams?.[me0.team?.toLowerCase()]?.has_won || false;
    let count = 1;
    for (let i = 1; i < allMatches.length; i++) {
      const me = allMatches[i].players?.all_players?.find(p =>
        p.name?.toLowerCase() === $player.name?.toLowerCase() &&
        p.tag?.toLowerCase() === $player.tag?.toLowerCase()
      ) || allMatches[i].players?.[0];
      if (!me) break;
      const won = allMatches[i].teams?.[me.team?.toLowerCase()]?.has_won || false;
      if (won === firstWon) count++;
      else break;
    }
    return { count, type: firstWon ? 'win' : 'loss' };
  }

  $: splitName = splitPlayerName(playerName);

  function splitPlayerName(name) {
    if (!name || name === '—') return { base: '—', suffix: '' };
    const match = name.match(/^([A-Za-z0-9_\-]+)(.*)$/);
    return {
      base: match ? match[1] : name,
      suffix: match ? match[2] : ''
    };
  }

  function computeRankPrediction(allMatches, rr) {
    if (!allMatches || allMatches.length === 0 || rr === undefined || rr === null) return null;

    let rrGains = 0, rrLosses = 0;
    let gainCount = 0, lossCount = 0;

    allMatches.slice(0, 10).forEach(m => {
      const p = m.players?.all_players?.find(pl =>
        pl.name?.toLowerCase() === $player.name?.toLowerCase() &&
        pl.tag?.toLowerCase() === $player.tag?.toLowerCase()
      ) || m.players?.[0];
      if (!p) return;
      const myTeam = (p.team || '').toLowerCase();
      const won = m.teams?.[myTeam]?.has_won || false;
      const myRounds = m.teams?.[myTeam]?.rounds_won || 0;
      const otherTeam = myTeam === 'red' ? 'blue' : 'red';
      const otherRounds = m.teams?.[otherTeam]?.rounds_won || 0;
      const scoreDiff = myRounds - otherRounds;

      if (won) {
        const gain = scoreDiff >= 13 ? 25 : scoreDiff >= 10 ? 22 : scoreDiff >= 7 ? 20 : 18;
        rrGains += gain;
        gainCount++;
      } else {
        const loss = Math.abs(scoreDiff) >= 13 ? 20 : Math.abs(scoreDiff) >= 10 ? 18 : Math.abs(scoreDiff) >= 7 ? 16 : 14;
        rrLosses += loss;
        lossCount++;
      }
    });

    const avgGain = gainCount > 0 ? rrGains / gainCount : 18;
    const avgLoss = lossCount > 0 ? rrLosses / lossCount : 15;

    const totalWins = allMatches.filter(m => {
      const me = m.players?.all_players?.find(pl =>
        pl.name?.toLowerCase() === $player.name?.toLowerCase() &&
        pl.tag?.toLowerCase() === $player.tag?.toLowerCase()
      ) || m.players?.[0];
      if (!me) return false;
      const myTeam = (me.team || '').toLowerCase();
      return m.teams?.[myTeam]?.has_won || false;
    }).length;

    const wr = allMatches.length > 5 ? (totalWins / allMatches.length) : 0.5;
    const netGainPerMatch = (wr * avgGain) - ((1 - wr) * avgLoss);

    if (netGainPerMatch > 2.5) {
      const rrNeeded = 100 - (rr % 100);
      const matchesNeeded = Math.ceil(rrNeeded / netGainPerMatch);
      return { type: 'positive', text: `At your current pace, you'll hit the Next Rank in ~${matchesNeeded} games.` };
    } else if (netGainPerMatch > 0) {
      return { type: 'slow', text: 'You are climbing very slowly. Improve your win rate to rank up faster!' };
    } else {
      return { type: 'negative', text: 'Trend is negative. Focus on improvement to rank up!' };
    }
  }

  function getWinsPercentile(wins) {
    const topPct = Math.max(1.0, Math.min(99.0, 100 * Math.exp(-0.065 * wins)));
    return `Top ${topPct.toFixed(1)}%`;
  }

  function getKastPercentile(kast) {
    const diff = kast - 71.5;
    if (diff >= 0) {
      const topPct = Math.max(1.0, Math.min(49.9, 50 - diff * 3.5));
      return `Top ${topPct.toFixed(1)}%`;
    } else {
      const botPct = Math.max(1.0, Math.min(49.9, 50 + diff * 6.5));
      return `Bottom ${botPct.toFixed(1)}%`;
    }
  }

  function getDdPercentile(dd) {
    if (dd >= 0) {
      const topPct = Math.max(1.0, Math.min(49.9, 50 - dd * 0.8));
      return `Top ${topPct.toFixed(1)}%`;
    } else {
      const botPct = Math.max(1.0, Math.min(49.9, 50 + dd * 1.9));
      return `Bottom ${botPct.toFixed(1)}%`;
    }
  }

  function getKillsPercentile(kills) {
    const topPct = Math.max(1.0, Math.min(99.0, 100 * Math.exp(-0.00195 * kills)));
    return `Top ${topPct.toFixed(1)}%`;
  }

  function getAcsPercentile(acs) {
    const diff = acs - 215;
    if (diff >= 0) {
      const topPct = Math.max(1.0, Math.min(49.9, 50 - diff * 0.6));
      return `Top ${topPct.toFixed(1)}%`;
    } else {
      const botPct = Math.max(1.0, Math.min(49.9, 50 + diff * 1.25));
      return `Bottom ${botPct.toFixed(1)}%`;
    }
  }
</script>

<div class="hero">
  <div id="player-card-bg" style="background-image: url('{cardUrl || ''}'); opacity: {cardUrl ? 0.26 : 0};"></div>
  <div class="hero-content" style="flex-direction: column; align-items: stretch; gap: 24px;">
    <div class="hero-main-row">
      <div class="hero-left">
        <div class="hero-avatar-wrap">
          {#if smallCardUrl}
            <img class="player-avatar-img" src={smallCardUrl} alt={playerName}>
          {:else}
            <div class="hero-avatar-fallback">👤</div>
          {/if}
        </div>
        <div class="hero-player-details">
          <div class="hero-eyebrow" id="hero-eyebrow">{modeLabel} Tracker</div>
          <div class="hero-title" id="hero-title">
            {escapeHtml(splitName.base)}{#if splitName.suffix}<span class="dim">{escapeHtml(splitName.suffix)}</span>{/if}
          </div>
          <div class="hero-sub" id="hero-sub">
            <span class="hero-tag" id="player-tag-display">#{escapeHtml(playerTag)}</span>
            <span class="hero-level-badge-new" id="player-level">LVL {accountLevel}</span>
          </div>
        </div>
      </div>

      <div class="hero-right">
        {#if isRanked}
          <div class="hero-rank-block">
            <div id="rank-icon">
              {#if rankImg}
                <img class="hero-rank-img" src={rankImg} alt={rankName}>
              {:else}
                <div style="width:56px;height:56px;background:var(--surface2);border-radius:8px;"></div>
              {/if}
            </div>
            <div class="hero-rank-info">
              <div class="hero-rank-name" id="rank-display">{rankName}</div>
              <div class="hero-rank-rr">
                <span id="peak-icon">
                  {#if peakImg}
                    <img style="width:16px;height:16px;object-fit:contain;" src={peakImg} alt={peakName}>
                  {/if}
                </span>
                <span id="rank-rr-txt">{currentRR} RR · Peak: {peakName}</span>
              </div>
              {#if rankPrediction && isRanked}
                <div class="hero-rank-prediction" id="rank-prediction">
                  {@html rankPrediction.text}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if streak.count >= 2}
          <div class="hero-streak-block" id="streak-block">
            <div class="streak-icon" id="streak-icon">
              {#if streak.type === 'win'}
                {streak.count >= 5 ? '🔥' : '✅'}
              {:else}
                {streak.count >= 5 ? '💀' : '❌'}
              {/if}
            </div>
            <div class="streak-info">
              <div class="streak-label">Current Streak</div>
              <div class="streak-val" id="streak-val">
                {streak.count}{streak.type === 'win' ? 'W' : 'L'} Streak
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if stats}
      <div class="hero-stats-container">
        <!-- Row 1 -->
        <div class="hero-stat-card has-border">
          <div class="hero-stat-label">Wins</div>
          <div class="hero-stat-val">{stats.wins}</div>
          <div class="hero-stat-pct top">{getWinsPercentile(stats.wins)}</div>
        </div>
        <div class="hero-stat-card has-border">
          <div class="hero-stat-label">KAST</div>
          <div class="hero-stat-val">{stats.kast}%</div>
          <div class="hero-stat-pct {stats.kast >= 71.5 ? 'top' : 'bottom'}">
            {getKastPercentile(stats.kast)}
          </div>
        </div>
        <div class="hero-stat-card has-border">
          <div class="hero-stat-label">DDΔ/Round</div>
          <div class="hero-stat-val">{stats.damageDeltaPerRound > 0 ? '+' : ''}{stats.damageDeltaPerRound}</div>
          <div class="hero-stat-pct {stats.damageDeltaPerRound >= 0 ? 'top' : 'bottom'}">
            {getDdPercentile(stats.damageDeltaPerRound)}
          </div>
        </div>
        <div class="hero-stat-card has-border">
          <div class="hero-stat-label">Kills</div>
          <div class="hero-stat-val">{stats.totalKills}</div>
          <div class="hero-stat-pct top">{getKillsPercentile(stats.totalKills)}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">Deaths</div>
          <div class="hero-stat-val">{stats.totalDeaths}</div>
          <div class="hero-stat-pct" style="visibility:hidden;">-</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">Assists</div>
          <div class="hero-stat-val">{stats.totalAssists}</div>
          <div class="hero-stat-pct" style="visibility:hidden;">-</div>
        </div>

        <!-- Row 2 -->
        <div class="hero-stat-card has-border">
          <div class="hero-stat-label">ACS</div>
          <div class="hero-stat-val">{stats.avgACS}</div>
          <div class="hero-stat-pct {stats.avgACS >= 215 ? 'top' : 'bottom'}">
            {getAcsPercentile(stats.avgACS)}
          </div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">KAD Ratio</div>
          <div class="hero-stat-val">{stats.kadRatio}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">Kills/Round</div>
          <div class="hero-stat-val">{stats.killsPerRound}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">First Bloods</div>
          <div class="hero-stat-val">{stats.firstBloods}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">Flawless Rounds</div>
          <div class="hero-stat-val">{stats.flawlessRounds}</div>
        </div>
        <div class="hero-stat-card">
          <div class="hero-stat-label">Aces</div>
          <div class="hero-stat-val">{stats.aces}</div>
        </div>
      </div>
    {/if}
  </div>
</div>

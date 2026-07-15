<script>
  import { AGENT_ROLES } from '../../lib/constants';

  export let matches = [];
  export let playerName = '';
  export let playerTag = '';

  const HEALER_AGENTS = ['sage', 'skye', 'clove', 'harbor'];

  const ARCHETYPES = [
    {
      key: 'entry',
      name: 'Entry Fragger',
      emoji: '🔫',
      color: '#fa4454',
      glowColor: 'rgba(250,68,84,0.35)',
      borderColor: 'rgba(250,68,84,0.5)',
      tagline: 'First into the site, last to back down.',
      description: 'You live for the first contact. High kills, high pressure, and a playstyle that forces the enemy to react to you.'
    },
    {
      key: 'clutch',
      name: 'Clutch King',
      emoji: '🧲',
      color: '#e8ff47',
      glowColor: 'rgba(232,255,71,0.3)',
      borderColor: 'rgba(232,255,71,0.45)',
      tagline: 'Coolest head when the stakes are highest.',
      description: 'You thrive in 1vX situations. Your late-round decision making and multi-kill rounds set you apart from the average player.'
    },
    {
      key: 'igl',
      name: 'Supportive IGL',
      emoji: '🧠',
      color: '#4da6ff',
      glowColor: 'rgba(77,166,255,0.3)',
      borderColor: 'rgba(77,166,255,0.45)',
      tagline: 'The brain behind every winning round.',
      description: 'You win through utility and setup, not raw fragging. Your assists and consistent win rate show smart, disciplined play.'
    },
    {
      key: 'anchor',
      name: 'Site Anchor',
      emoji: '🌪️',
      color: '#b06aff',
      glowColor: 'rgba(176,106,255,0.3)',
      borderColor: 'rgba(176,106,255,0.45)',
      tagline: 'Unmovable. The wall they can\'t break.',
      description: 'You hold angles and trade efficiently. Sentinels and CT-heavy maps are your domain — you make sites feel impenetrable.'
    },
    {
      key: 'healer',
      name: 'Healer Core',
      emoji: '💊',
      color: '#3ecf8e',
      glowColor: 'rgba(62,207,142,0.3)',
      borderColor: 'rgba(62,207,142,0.45)',
      tagline: 'The glue that holds the team together.',
      description: 'You play for the team. High assists and a strong win rate show that your support utility creates more value than raw kills.'
    }
  ];

  function computeArchetypes(rawMatches, pName, pTag) {
    if (!rawMatches || !rawMatches.length || !pName) {
      return null;
    }

    const last30 = rawMatches.slice(0, 30);
    let totalKills = 0, totalDeaths = 0, totalAssists = 0, matchCount = 0;
    let duelist = 0, sentinel = 0, initiator = 0, controller = 0, healer = 0;

    // Per-match stats for clutch (multi-kill rounds proxy)
    let multiKillRounds = 0; // rounds where kills >= 3 as proxy
    let highAssistMatches = 0;

    last30.forEach(match => {
      const rawPlayers = match.players?.all_players || match.players || [];
      const players = Array.isArray(rawPlayers) ? rawPlayers : [];
      const me = players.find(p =>
        p.name?.toLowerCase() === pName?.toLowerCase() &&
        p.tag?.toLowerCase() === pTag?.toLowerCase()
      );
      if (!me) return;

      matchCount++;
      const k = me.stats?.kills || 0;
      const d = me.stats?.deaths || 0;
      const a = me.stats?.assists || 0;
      totalKills += k;
      totalDeaths += d;
      totalAssists += a;

      const agentKey = (me.character || me.agent?.name || '').toLowerCase();

      // Role counting
      const role = AGENT_ROLES[agentKey];
      if (HEALER_AGENTS.includes(agentKey)) {
        healer++;
      } else if (role === 'duelist') {
        duelist++;
      } else if (role === 'sentinel') {
        sentinel++;
      } else if (role === 'initiator') {
        initiator++;
      } else if (role === 'controller') {
        controller++;
      } else {
        initiator++; // fallback
      }

      // Clutch proxy: if kills >= 3 in a match AND score is high
      if (k >= 3 && (me.stats?.score || 0) > 2000) multiKillRounds++;
      // High assist match (assists >= 5)
      if (a >= 5) highAssistMatches++;
    });

    if (matchCount === 0) return null;

    const avgKDA = totalDeaths > 0 ? ((totalKills + totalAssists * 0.5) / totalDeaths).toFixed(2) : (totalKills + totalAssists * 0.5).toFixed(2);
    const avgKills = (totalKills / matchCount).toFixed(1);
    const avgAssists = (totalAssists / matchCount).toFixed(1);
    const duelistPct = Math.round((duelist / matchCount) * 100);
    const sentinelPct = Math.round((sentinel / matchCount) * 100);
    const initiatorPct = Math.round((initiator / matchCount) * 100);
    const controllerPct = Math.round((controller / matchCount) * 100);
    const healerPct = Math.round((healer / matchCount) * 100);

    const kda = parseFloat(avgKDA);
    const kills = parseFloat(avgKills);
    const assists = parseFloat(avgAssists);

    // Scoring each archetype 0-100
    const scores = {};

    // Entry Fragger: high kills, high KDA, duelist pick rate
    scores.entry = Math.min(100, Math.round(
      (Math.min(kills / 22, 1) * 35) +
      (Math.min(kda / 2.5, 1) * 30) +
      (duelistPct * 0.35)
    ));

    // Clutch King: multi-kill rounds, KDA balanced
    scores.clutch = Math.min(100, Math.round(
      (Math.min(multiKillRounds / matchCount / 0.6, 1) * 50) +
      (Math.min(kda / 2.0, 1) * 30) +
      (kills >= 15 ? 20 : kills / 15 * 20)
    ));

    // Supportive IGL: high assists, controller/initiator pick, lower kills
    const utilityPct = (controllerPct + initiatorPct + (healerPct * 0.5));
    scores.igl = Math.min(100, Math.round(
      (Math.min(assists / 7, 1) * 40) +
      (Math.min(highAssistMatches / matchCount / 0.5, 1) * 30) +
      (utilityPct * 0.3)
    ));

    // Site Anchor: sentinel pick rate, moderate KDA, balanced
    scores.anchor = Math.min(100, Math.round(
      (sentinelPct * 0.5) +
      (Math.min(kda / 1.8, 1) * 30) +
      (Math.min(kills / 18, 1) * 20)
    ));

    // Healer Core: healer agent pick rate, high assists, strong WR
    scores.healer = Math.min(100, Math.round(
      (healerPct * 0.6) +
      (Math.min(assists / 8, 1) * 40)
    ));

    // Sort by score
    const ranked = Object.entries(scores)
      .map(([key, score]) => ({ key, score }))
      .sort((a, b) => b.score - a.score);

    const primaryKey = ranked[0].key;
    const secondaryKey = ranked[1].key;
    const worstKey = ranked[ranked.length - 1].key;

    const getArchetype = key => ARCHETYPES.find(a => a.key === key);

    return {
      primary: { ...getArchetype(primaryKey), score: ranked[0].score },
      secondary: { ...getArchetype(secondaryKey), score: ranked[1].score },
      worst: { ...getArchetype(worstKey), score: ranked[ranked.length - 1].score },
      stats: {
        avgKDA: parseFloat(avgKDA),
        avgKills: parseFloat(avgKills),
        avgAssists: parseFloat(avgAssists),
        duelist: duelistPct,
        sentinel: sentinelPct,
        initiator: initiatorPct,
        controller: controllerPct,
        healer: healerPct,
        matchCount
      }
    };
  }

  $: result = computeArchetypes(matches, playerName, playerTag);

  // Role bars data
  $: roleBars = result ? [
    { label: 'Duelist', pct: result.stats.duelist, color: '#fa4454' },
    { label: 'Initiator', pct: result.stats.initiator, color: '#4da6ff' },
    { label: 'Controller', pct: result.stats.controller, color: '#b06aff' },
    { label: 'Sentinel', pct: result.stats.sentinel, color: '#3ecf8e' },
    { label: 'Healer', pct: result.stats.healer, color: '#e8ff47' }
  ].filter(r => r.pct > 0) : [];

  // Best role (highest pct)
  $: bestRole = roleBars.length ? roleBars.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  // Worst role (lowest pct among played)
  $: worstRole = roleBars.length > 1 ? roleBars.reduce((a, b) => a.pct < b.pct ? a : b) : null;
</script>

{#if result}
<div
  class="card role-identity-card visible"
  style="--ric-color:{result.primary.color};--ric-glow:{result.primary.glowColor};--ric-border:{result.primary.borderColor};"
>
  <div class="card-accent-line" style="background: var(--accent) !important;"></div>

  <div class="ric-inner">
    <!-- LEFT: Archetype Identity -->
    <div class="ric-left">
      <div class="ric-emoji" style="filter:drop-shadow(0 0 24px {result.primary.glowColor});">
        {result.primary.emoji}
      </div>
      <div class="ric-identity">
        <div class="ric-label">Your Playstyle Archetype</div>
        <div class="ric-archetype-name" style="color:{result.primary.color};">{result.primary.name}</div>
        <div class="ric-tagline">{result.primary.tagline}</div>
        <div class="ric-description">{result.primary.description}</div>

        <div class="ric-badges">
          {#if bestRole}
            <span class="ric-badge best">
              <span class="ric-badge-dot" style="background:{bestRole.color};"></span>
              Most played: {bestRole.label}
            </span>
          {/if}
          {#if result.secondary}
            <span class="ric-badge secondary" style="border-color:{result.secondary.borderColor};color:{result.secondary.color};">
              {result.secondary.emoji} {result.secondary.name} vibes
            </span>
          {/if}
          {#if result.worst && result.worst.score < 25}
            <span class="ric-badge worst">
              💤 Rarely: {result.worst.name}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- RIGHT: Role Distribution & Stats -->
    <div class="ric-right">
      <div class="ric-section-title">Role Distribution</div>
      <div class="ric-role-bars">
        {#each roleBars as bar}
          <div class="ric-role-bar-row">
            <span class="ric-role-bar-label">{bar.label}</span>
            <div class="ric-role-bar-track">
              <div
                class="ric-role-bar-fill"
                style="width:{bar.pct}%;background:{bar.color};box-shadow:0 0 8px {bar.color}55;"
              ></div>
            </div>
            <span class="ric-role-bar-pct">{bar.pct}%</span>
          </div>
        {/each}
      </div>

      <div class="ric-score-row">
        <span class="ric-section-title">Archetype Scores</span>
        <div class="ric-scores">
          {#each [result.primary, result.secondary, result.worst] as arch, i}
            {#if arch}
              <div class="ric-score-item">
                <span class="ric-score-emoji">{arch.emoji}</span>
                <div class="ric-score-bar-track">
                  <div
                    class="ric-score-bar-fill"
                    style="width:{arch.score}%;background:{arch.color};opacity:{i === 2 ? 0.5 : 1};"
                  ></div>
                </div>
                <span class="ric-score-num" style="color:{i === 2 ? 'var(--muted)' : arch.color};">{arch.score}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Animated glow border overlay -->
  <div class="ric-glow-border"></div>
</div>
{/if}

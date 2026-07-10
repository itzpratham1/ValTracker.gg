<script>
  export let match = null;
  export let playerName = '';
  export let playerTag = '';

  $: allPlayers = getPlayerList(match);
  $: rounds = match?.rounds || [];
  $: me = allPlayers.find(p =>
    p.name?.toLowerCase() === playerName?.toLowerCase() &&
    p.tag?.toLowerCase() === playerTag?.toLowerCase()
  );
  $: myPuuid = me?.puuid || me?.subject || me?.id || '';
  $: myPuuids = [me?.puuid, me?.subject, me?.id, myPuuid].filter(Boolean);
  $: myTeamId = (me?.team || '').toLowerCase();
  $: teammatePuuids = allPlayers
    .filter(p => (p.team || '').toLowerCase() === myTeamId && !myPuuids.includes(p.puuid || p.subject || p.id))
    .map(p => p.puuid || p.subject || p.id)
    .filter(Boolean);

  $: parsedRounds = rounds.map(r => {
    let ps = r.player_stats || [];
    if (typeof ps === 'string') { try { ps = JSON.parse(ps); } catch (e) { ps = []; } }
    if (!Array.isArray(ps)) ps = Object.values(ps);
    return { ...r, _ps: ps };
  });

  function getPlayerList(m) {
    if (!m) return [];
    if (Array.isArray(m.players)) return m.players;
    return m.players?.all_players || m.players || [];
  }

  $: teamRounds = parsedRounds.map((r, i) => {
    const num = i + 1;
    const myTeamWon = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
    
    // Find my round stats
    const myPs = (r._ps || []).find(p => myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id));
    const killEvents = myPs?.kill_events || [];
    const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);

    // Detect clutch
    let isClutch = false;
    if (myTeamWon && (r._ps || []).length > 0) {
      let tmDeaths = 0;
      let meDied = false;
      (r._ps || []).forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          const victim = k.victim_puuid || k.victim;
          if (victim && myPuuids.includes(victim)) meDied = true;
          if (victim && teammatePuuids.includes(victim)) tmDeaths++;
        });
      });
      if (tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) {
        isClutch = true;
      }
    }

    const isAce = myKills >= 5;

    return {
      num,
      won: myTeamWon,
      isClutch,
      isAce,
      myKills
    };
  });

  $: clutches = teamRounds
    .filter(r => r.isClutch)
    .map(r => {
      const enemiesAlive = Math.max(1, r.myKills);
      return {
        round: r.num,
        kills: r.myKills,
        vsCount: `1v${Math.min(enemiesAlive, 5)}`
      };
    });

  $: aces = teamRounds.filter(r => r.isAce).map(r => ({ round: r.num }));
</script>

{#if !me}
  <div class="no-detail">Your player not found in match data</div>
{:else}
  <div class="panel-section">
    <div class="panel-section-title">Round History Timeline</div>
    <div class="rounds-wrap">
      {#each teamRounds as r}
        <div class="round-dot {r.won ? 'won' : 'lost'}{r.isClutch ? ' clutch' : ''}" title="Round {r.num}{r.isClutch ? '  Clutch' : ''}{r.myKills > 0 ? ` · ${r.myKills} Kills` : ''}" style="position:relative; overflow:visible; display:flex; align-items:center; justify-content:center;">
          {r.num}
          {#if r.isAce}
            <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#ffd700; color:#000; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:900; line-height:1.2; box-shadow:0 0 4px #ffd700; border:0.5px solid #000; z-index:2; white-space:nowrap;">ACE</span>
          {:else if r.myKills >= 2}
            <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:var(--accent); color:#fff; font-family:'DM Mono', monospace; font-size:7px; padding:0 3px; border-radius:3px; font-weight:800; line-height:1.2; box-shadow:0 0 4px var(--accentdim); border:0.5px solid #000; z-index:2; white-space:nowrap;">{r.myKills}K</span>
          {/if}
        </div>
      {/each}
    </div>
    <div class="round-legend" style="margin-top:12px;">
      <span><span class="legend-dot" style="background:rgba(62,207,142,0.4)"></span>Win</span>
      <span><span class="legend-dot" style="background:rgba(255,87,87,0.3)"></span>Loss</span>
      <span><span class="legend-dot" style="outline:2px solid #f5a623;display:inline-block;width:8px;height:8px;border-radius:2px;"></span>Clutch</span>
    </div>
  </div>

  <div class="panel-section">
    <div class="panel-section-title">Clutches & Aces</div>
    {#if clutches.length === 0 && aces.length === 0}
      <div class="no-detail">No clutch or ace moments detected this match</div>
    {:else}
      <div class="clutch-highlight">
        {#each clutches as c}
          <div class="clutch-pill">👑 {c.vsCount} Clutch 🔥 Rnd {c.round}{c.kills ? ` (${c.kills} kills)` : ''}</div>
        {/each}
        {#each aces as a}
          <div class="clutch-pill" style="color:var(--accent);border-color:var(--accentborder)">⭐ ACE ⭐ Rnd {a.round}</div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

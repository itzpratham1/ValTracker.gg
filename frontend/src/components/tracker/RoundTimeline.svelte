<script>
  import MatchMomentumGraph from './MatchMomentumGraph.svelte';

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
    if (myTeamWon && (r._ps || r.player_stats || []).length > 0) {
      let deadTeammates = new Set();
      let meDied = false;
      const playerStats = r._ps || r.player_stats || [];
      playerStats.forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          const victim = k.victim_puuid || k.victim;
          if (victim && myPuuids.includes(victim)) meDied = true;
          if (victim && teammatePuuids.includes(victim)) deadTeammates.add(victim);
        });
      });
      if (deadTeammates.size >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied) {
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
  <MatchMomentumGraph teamRounds={teamRounds} match={match} />

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

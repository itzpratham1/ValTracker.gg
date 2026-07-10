<script>
  import { getAgentIconUrl } from '../../lib/assets';
  import { escapeHtml } from '../../lib/utils';

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
  $: myTeammates = myPuuids.length ? allPlayers.filter(p =>
    (p.team || '').toLowerCase() === myTeamId && !myPuuids.includes(p.puuid || p.subject || p.id)
  ) : [];

  $: parsedRounds = rounds.map(r => {
    let ps = r.player_stats || [];
    if (typeof ps === 'string') { try { ps = JSON.parse(ps); } catch (e) { ps = []; } }
    if (!Array.isArray(ps)) ps = Object.values(ps);
    return { ...r, _ps: ps };
  });

  function findMyPs(ps) {
    return (ps || []).find(p => myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id));
  }

  function getPlayerList(m) {
    if (!m) return [];
    if (Array.isArray(m.players)) return m.players;
    return m.players?.all_players || m.players || [];
  }

  $: abilities = me?.ability_casts || {};
  $: dmgMade = me?.damage_made || 0;
  $: dmgRcvd = me?.damage_received || 0;
  $: totalSpent = parsedRounds.reduce((s, r) => s + (findMyPs(r._ps)?.economy?.spent || 0), 0);
  $: avgEco = parsedRounds.length ? Math.round(totalSpent / parsedRounds.length) : 0;

  $: matchStats = me?.stats || {};
  $: headS = matchStats.headshots || 0;
  $: bodyS = matchStats.bodyshots || 0;
  $: legS = matchStats.legshots || 0;
  $: totalShots = headS + bodyS + legS;
  $: hsPct = totalShots ? Math.round((headS / totalShots) * 100) : 0;
  $: bsPct = totalShots ? Math.round((bodyS / totalShots) * 100) : 0;
  $: lsPct = totalShots ? Math.round((legS / totalShots) * 100) : 0;

  $: card = me?.assets?.card?.large || me?.assets?.card?.wide || '';
  $: ecoRounds = parsedRounds.filter(r => findMyPs(r._ps)?.economy);

  function computeBuyType(eco) {
    if (!eco) return 'ECO';
    const weapon = (typeof eco.weapon === 'object' && eco.weapon?.name) ? eco.weapon.name : (eco.weapon || '');
    const lv = eco.loadout_value || 0;
    if (lv >= 3900 || weapon.toLowerCase() === 'vandal' || weapon.toLowerCase() === 'phantom' || weapon.toLowerCase() === 'operator') return 'FULL BUY';
    if (lv >= 2000) return 'FORCE';
    return 'ECO';
  }

  function getWeaponName(eco) {
    if (!eco) return 'None';
    if (typeof eco.weapon === 'object' && eco.weapon?.name) return eco.weapon.name;
    return eco.weapon || 'None';
  }

  function getArmorName(eco) {
    if (!eco) return 'None';
    if (typeof eco.armor === 'object' && eco.armor?.name) return eco.armor.name;
    return typeof eco.armor === 'string' && eco.armor ? eco.armor : 'None';
  }
</script>

{#if !me}
  <div class="no-detail">Your player not found in match data</div>
{:else}
  <div class="panel-section">
    <div class="panel-section-title">Player Profile</div>
    <div class="detail-profile">
      {#if card}
        <img src={card} class="detail-card" alt="" on:error={(e) => e.target.style.display='none'}>
      {/if}
      <div class="detail-profile-stats">
        <div class="dp-stat"><div class="dpv">LVL {me.level || '—'}</div><div class="dpl">Account Level</div></div>
        <div class="dp-stat"><div class="dpv">{dmgMade}</div><div class="dpl">Dmg Dealt</div></div>
        <div class="dp-stat"><div class="dpv">{dmgRcvd}</div><div class="dpl">Dmg Received</div></div>
        <div class="dp-stat"><div class="dpv">{dmgMade && dmgRcvd ? (dmgMade / dmgRcvd).toFixed(2) : '—'}</div><div class="dpl">Dmg Ratio</div></div>
      </div>
    </div>
  </div>

  <div class="panel-section">
    <div class="panel-section-title">Ability Casts</div>
    <div class="ability-grid">
      <div class="ability-chip"><div class="ac-key">C</div><div class="ac-val">{abilities.c_cast || 0}</div></div>
      <div class="ability-chip"><div class="ac-key">Q</div><div class="ac-val">{abilities.q_cast || 0}</div></div>
      <div class="ability-chip"><div class="ac-key">E</div><div class="ac-val">{abilities.e_cast || 0}</div></div>
      <div class="ability-chip ult"><div class="ac-key">ULT</div><div class="ac-val">{abilities.x_cast || 0}</div></div>
      <div class="ability-chip eco"><div class="ac-key">Avg Eco</div><div class="ac-val">{avgEco}cr</div></div>
      <div class="ability-chip eco"><div class="ac-key">Total Spent</div><div class="ac-val">{totalSpent}cr</div></div>
    </div>
  </div>

  {#if totalShots > 0 || headS > 0}
    <div class="panel-section">
      <div class="panel-section-title">Accuracy Breakdown</div>
      <div class="acc-body-row" style="margin-top: 0;">
        <div class="acc-bars" style="gap: 8px;">
          {#each [['Head', headS, hsPct, 'var(--win)'], ['Body', bodyS, bsPct, 'var(--muted)'], ['Legs', legS, lsPct, 'var(--loss)']] as [label, hits, pct, col]}
            <div class="acc-row">
              <span class="acc-lbl" style="width:34px;">{label.toUpperCase()}</span>
              <div class="acc-track"><div class="acc-fill" style="width:{pct}%;background:{col};"></div></div>
              <span class="acc-pct" style="color:{col}">{pct}%</span>
              <span class="acc-hits">{(hits || 0).toLocaleString()} hits</span>
            </div>
          {/each}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:110px;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:38px;line-height:1;color:{hsPct >= 25 ? 'var(--win)' : hsPct >= 15 ? 'var(--accent)' : 'var(--loss)'};">{hsPct}%</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px;">HS RATE</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">{totalShots} total shots</div>
        </div>
      </div>
    </div>
  {/if}

  <div class="panel-section">
    <div class="panel-section-title">Economy Per Round</div>
    {#if ecoRounds.length === 0}
      <div class="no-detail">Economy data not available</div>
    {:else}
      <div class="eco-grid">
        {#each ecoRounds as r, ri}
          {@const ps = findMyPs(r._ps)}
          {@const eco = ps?.economy || {}}
          {@const won = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId}
          {@const weapon = getWeaponName(eco)}
          {@const armor = getArmorName(eco)}
          {@const buyType = computeBuyType(eco)}
          <div class="eco-card" class:won class:lost={!won}>
            <div class="eco-card-header">
              <span class="eco-round-num">Round {ri + 1}</span>
              <span class="eco-outcome-badge" class:won class:lost={!won}>{won ? 'WIN' : 'LOSS'}</span>
              <span class="eco-buy-badge {buyType.toLowerCase().replace(' ', '-')}">{buyType}</span>
            </div>
            <div class="eco-card-body">
              <div class="eco-weapon-section">
                <span class="eco-weapon-name">{weapon}</span>
                <span class="eco-armor-name">{armor}</span>
              </div>
              <div class="eco-financials">
                <div class="eco-fin-row"><span class="eco-lbl">Loadout:</span><span class="eco-val">{eco.loadout_value || 0} cr</span></div>
                <div class="eco-fin-row"><span class="eco-lbl">Spent:</span><span class="eco-val spent">{eco.spent || 0} cr</span></div>
                <div class="eco-fin-row"><span class="eco-lbl">Bank:</span><span class="eco-val bank">{eco.remaining || 0} cr</span></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

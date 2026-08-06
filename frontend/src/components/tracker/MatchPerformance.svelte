<script>
  import { getAgentIconUrl } from '../../lib/assets';
  import { escapeHtml } from '../../lib/utils';

  export let match = null;
  export let playerName = '';
  export let playerTag = '';

  let ecoViewMode = 'compact'; // 'compact' | 'table'

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

  $: card = me?.assets?.card?.large || me?.assets?.card?.wide || me?.assets?.card?.small || '';
  $: ecoRounds = parsedRounds.filter(r => findMyPs(r._ps)?.economy);

  $: totalRounds = parsedRounds.length || match?.metadata?.rounds_played || 24;
  
  // Calculate current player's advanced stats
  $: myKdDiff = me ? (matchStats.kills || 0) - (matchStats.deaths || 0) : 0;
  $: myAcs = me ? (totalRounds ? Math.round((matchStats.score || 0) / totalRounds) : 0) : 0;
  $: myAdr = me ? (totalRounds ? Math.round(dmgMade / totalRounds) : 0) : 0;
  $: myDmgDelta = me ? (totalRounds ? Math.round((dmgMade - dmgRcvd) / totalRounds) : 0) : 0;

  // Compute round-based stats: KAST, FK, FD, Multi-kills
  let myKast = 0;
  let myFk = 0;
  let myFd = 0;
  let myMulti3k = 0;
  let myMulti4k = 0;
  let myMulti5k = 0;

  $: {
    if (me && parsedRounds.length > 0) {
      let kastRounds = 0;
      let fk = 0;
      let fd = 0;
      let m3k = 0;
      let m4k = 0;
      let m5k = 0;

      const myNameTag = (playerName && playerTag) ? `${playerName}#${playerTag}` : playerName || '';

      parsedRounds.forEach(r => {
        let allRoundKills = [];
        const psList = r._ps || [];
        
        psList.forEach(ps => {
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
          
          const isFk = (myPuuids.includes(fbKillerPuuid)) || 
                       (myNameTag && fbKillerName && myNameTag.toLowerCase() === fbKillerName.toLowerCase());
          const isFd = (myPuuids.includes(fbVictimPuuid)) || 
                       (myNameTag && fbVictimName && myNameTag.toLowerCase() === fbVictimName.toLowerCase());
          
          if (isFk) fk++;
          if (isFd) fd++;
        }
        
        const myPs = findMyPs(r._ps);
        if (myPs) {
          const rKills = typeof myPs.kills === 'number' ? myPs.kills : (myPs.kills?.length || myPs.kill_events?.length || 0);
          
          if (rKills === 3) m3k++;
          else if (rKills === 4) m4k++;
          else if (rKills >= 5) m5k++;
          
          const gotKill = rKills > 0 || allRoundKills.some(k => 
            (myPuuids.includes(k.killerPuuid)) || 
            (myNameTag && k.killerName && myNameTag.toLowerCase() === k.killerName.toLowerCase())
          );
          
          const gotAssist = allRoundKills.some(k => 
            k.assistants && k.assistants.some(ast => 
              (myPuuids.includes(ast.assistant_puuid)) || 
              (myNameTag && ast.assistant_display_name && myNameTag.toLowerCase() === ast.assistant_display_name.toLowerCase())
            )
          );
          
          const playerDied = allRoundKills.some(k => 
            (myPuuids.includes(k.victimPuuid)) || 
            (myNameTag && k.victimName && myNameTag.toLowerCase() === k.victimName.toLowerCase())
          );
          const survived = !playerDied;
          
          let traded = false;
          if (playerDied && fbVictimPuuid) {
            const myDeath = allRoundKills.find(k => 
              (myPuuids.includes(k.victimPuuid)) || 
              (myNameTag && k.victimName && myNameTag.toLowerCase() === k.victimName.toLowerCase())
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
                if (!myPuuids.includes(traderPuuid) && !(myNameTag && traderName && myNameTag.toLowerCase() === traderName.toLowerCase())) {
                  traded = true;
                }
              }
            }
          }
          
          if (gotKill || gotAssist || survived || traded) {
            kastRounds++;
          }
        }
      });

      myKast = totalRounds ? Math.round((kastRounds / totalRounds) * 100) : 0;
      myFk = fk;
      myFd = fd;
      myMulti3k = m3k;
      myMulti4k = m4k;
      myMulti5k = m5k;
    }
  }

  function computeBuyType(eco) {
    if (!eco) return 'ECO';
    const weapon = (typeof eco.weapon === 'object' && eco.weapon?.name) ? eco.weapon.name : (eco.weapon || '');
    const lv = eco.loadout_value || 0;
    const spent = eco.spent || 0;
    const remaining = eco.remaining || 0;
    const w = weapon.toLowerCase();

    if (lv >= 3900 || w === 'vandal' || w === 'phantom' || w === 'operator' || w === 'odin') {
      return 'FULL BUY';
    }
    if (lv >= 2400) {
      return 'HALF BUY';
    }
    if (spent >= 2000 || (spent >= 1500 && remaining < 1000) || lv >= 1800) {
      return 'FORCE';
    }
    return 'ECO';
  }

  function getWeaponName(eco) {
    if (!eco) return 'None';
    if (typeof eco.weapon === 'object' && eco.weapon?.name) return eco.weapon.name;
    return eco.weapon || 'None';
  }

  function getArmorName(eco) {
    if (!eco) return 'No Armor';
    let armorObj = eco.armor;
    let name = 'No Armor';

    if (typeof armorObj === 'object' && armorObj) {
      name = armorObj.name || armorObj.id || '';
    } else if (typeof armorObj === 'string' && armorObj) {
      name = armorObj;
    }

    const lower = name.toLowerCase();
    if (lower.includes('regen') || lower.includes('item_armor_regen') || lower.includes('shield_regen')) {
      return 'Regen Shield';
    }
    if (lower.includes('heavy') || lower.includes('shield_heavy') || lower.includes('item_armor_heavy')) {
      return 'Heavy Shield';
    }
    if (lower.includes('light') || lower.includes('shield_light') || lower.includes('item_armor_light')) {
      return 'Light Shield';
    }

    if (lower === 'none' || lower === '' || lower === 'null' || lower === 'undefined') {
      return 'No Armor';
    }

    return name;
  }

  function formatMoney(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000) {
      const k = num / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
    }
    return String(num);
  }

  // Economy Intelligence & Coaching Metrics
  $: ecoEfficiency = totalSpent > 0 ? ((dmgMade / totalSpent) * 1000).toFixed(2) : '0';

  let fullBuyWins = 0, fullBuyTotal = 0;
  let halfBuyWins = 0, halfBuyTotal = 0;
  let forceWins = 0, forceTotal = 0;
  let ecoWins = 0, ecoTotal = 0;
  let pistol1Won = false, pistol2Won = false;
  let bonusWonCount = 0;
  let thriftyCount = 0;

  $: {
    if (parsedRounds && parsedRounds.length > 0) {
      let fbW = 0, fbT = 0;
      let hbW = 0, hbT = 0;
      let fcW = 0, fcT = 0;
      let ecW = 0, ecT = 0;
      let p1W = false, p2W = false;
      let bonW = 0;
      let thrifty = 0;

      parsedRounds.forEach((r, ri) => {
        const ps = findMyPs(r._ps);
        const eco = ps?.economy || {};
        const won = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId;
        const buyType = computeBuyType(eco);

        if (buyType === 'FULL BUY') {
          fbT++;
          if (won) fbW++;
        } else if (buyType === 'HALF BUY') {
          hbT++;
          if (won) hbW++;
        } else if (buyType === 'FORCE') {
          fcT++;
          if (won) fcW++;
        } else {
          ecT++;
          if (won) ecW++;
        }

        if (ri === 0) p1W = won;
        if (ri === 12) p2W = won;

        if ((ri === 2 && p1W) || (ri === 14 && p2W)) {
          if (won) bonW++;
        }

        if (buyType === 'ECO' && won) {
          thrifty++;
        }
      });

      fullBuyWins = fbW; fullBuyTotal = fbT;
      halfBuyWins = hbW; halfBuyTotal = hbT;
      forceWins = fcW; forceTotal = fcT;
      ecoWins = ecW; ecoTotal = ecT;
      pistol1Won = p1W; pistol2Won = p2W;
      bonusWonCount = bonW;
      thriftyCount = thrifty;
    }
  }

  $: fullBuyWr = fullBuyTotal ? Math.round((fullBuyWins / fullBuyTotal) * 100) : 0;
  $: halfBuyWr = halfBuyTotal ? Math.round((halfBuyWins / halfBuyTotal) * 100) : 0;
  $: forceWr = forceTotal ? Math.round((forceWins / forceTotal) * 100) : 0;
  $: ecoWr = ecoTotal ? Math.round((ecoWins / ecoTotal) * 100) : 0;

  $: ecoCoachTip = (() => {
    if (!parsedRounds.length) return '';
    if (fullBuyWr >= 60 && ecoWins > 0) {
      return `Solid economy conversion! Converted ${fullBuyWr}% of Full Buys and secured ${ecoWins} eco round win(s).`;
    }
    if (forceTotal > 3 && forceWr < 40) {
      return `High force-buy frequency (${forceTotal} rounds) with a low ${forceWr}% win rate. Consider saving for full armor & rifles.`;
    }
    if (fullBuyWr < 40 && fullBuyTotal > 0) {
      return `Low full buy conversion (${fullBuyWr}%). Coordinate utility & site executions on full buy rounds to maximize credit investments.`;
    }
    if (pistol1Won && pistol2Won) {
      return `Dominant pistol performance! Won both pistol rounds (R1 & R13), providing early round momentum in both halves.`;
    }
    return `Balanced economy usage: ${ecoEfficiency} Dmg per 1k credits across ${totalRounds} rounds.`;
  })();
</script>

{#if !me}
  <div class="no-detail">Your player not found in match data</div>
{:else}
  <!-- COMPACT HEADER PLAYER PROFILE -->
  <div class="panel-section" style="margin-top: 0; padding: 12px 16px;">
    <div class="compact-detail-profile">
      {#if card}
        <img src={card} class="detail-card-thumb" alt="" on:error={(e) => e.target.style.display='none'}>
      {/if}
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0;">
        <div class="detail-profile-stats" style="grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{myAcs}</div><div class="dpl">ACS</div></div>
          <div class="dp-stat" style="padding: 8px 10px;">
            <div class="dpv" style="color: {myKdDiff > 0 ? 'var(--win)' : myKdDiff < 0 ? 'var(--loss)' : 'var(--muted)'}; font-weight: bold;">
              {myKdDiff > 0 ? '+' : ''}{myKdDiff}
            </div>
            <div class="dpl">KD Diff</div>
          </div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{myKast}%</div><div class="dpl">KAST %</div></div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{myAdr}</div><div class="dpl">ADR</div></div>
          <div class="dp-stat" style="padding: 8px 10px;">
            <div class="dpv" style="color: {myDmgDelta > 0 ? 'var(--win)' : myDmgDelta < 0 ? 'var(--loss)' : 'var(--muted)'};">
              {myDmgDelta > 0 ? '+' : ''}{myDmgDelta}
            </div>
            <div class="dpl">Dmg Δ/Rd</div>
          </div>
          <div class="dp-stat" style="padding: 8px 10px;">
            <div class="dpv" style="display:flex; gap:4px; justify-content: center;">
              <span style="color:var(--win); font-weight: bold;">{myFk}</span>
              <span style="color:var(--muted);">/</span>
              <span style="color:var(--loss);">{myFd}</span>
            </div>
            <div class="dpl">FK / FD</div>
          </div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{dmgMade}</div><div class="dpl">Dmg Dealt</div></div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{dmgRcvd}</div><div class="dpl">Dmg Received</div></div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">{dmgMade && dmgRcvd ? (dmgMade / dmgRcvd).toFixed(2) : '—'}</div><div class="dpl">Dmg Ratio</div></div>
          <div class="dp-stat" style="padding: 8px 10px;"><div class="dpv">LVL {me.level || '—'}</div><div class="dpl">Level</div></div>
        </div>

        <div class="multi-kill-bar">
          <span class="mk-label">MULTI-KILLS:</span>
          <span class="mk-pill {myMulti3k > 0 ? 'active' : ''}">3K: <strong>{myMulti3k}</strong></span>
          <span class="mk-pill {myMulti4k > 0 ? 'active' : ''}">4K: <strong>{myMulti4k}</strong></span>
          <span class="mk-pill ace {myMulti5k > 0 ? 'active' : ''}">ACE: <strong>{myMulti5k}</strong></span>
        </div>
      </div>
    </div>
  </div>

  <!-- SIDE-BY-SIDE GRID: ABILITY CASTS & ACCURACY BREAKDOWN -->
  <div class="perf-two-col">
    <div class="panel-section" style="margin-top: 0; padding: 12px 16px;">
      <div class="panel-section-title" style="margin-bottom: 8px;">Ability Casts & Utility</div>
      <div class="ability-grid" style="margin-top: 0;">
        <div class="ability-chip"><div class="ac-key">C</div><div class="ac-val">{abilities.c_cast || 0}</div></div>
        <div class="ability-chip"><div class="ac-key">Q</div><div class="ac-val">{abilities.q_cast || 0}</div></div>
        <div class="ability-chip"><div class="ac-key">E</div><div class="ac-val">{abilities.e_cast || 0}</div></div>
        <div class="ability-chip ult"><div class="ac-key">ULT</div><div class="ac-val">{abilities.x_cast || 0}</div></div>
        <div class="ability-chip eco"><div class="ac-key">Avg Eco</div><div class="ac-val">{avgEco}cr</div></div>
        <div class="ability-chip eco"><div class="ac-key">Total Spent</div><div class="ac-val">{formatMoney(totalSpent)}</div></div>
      </div>
    </div>

    {#if totalShots > 0 || headS > 0}
      <div class="panel-section" style="margin-top: 0; padding: 12px 16px;">
        <div class="panel-section-title" style="margin-bottom: 8px;">Accuracy Breakdown</div>
        <div class="acc-body-row" style="margin-top: 0;">
          <div class="acc-bars" style="gap: 6px;">
            {#each [['Head', headS, hsPct, 'var(--win)'], ['Body', bodyS, bsPct, 'var(--muted)'], ['Legs', legS, lsPct, 'var(--loss)']] as [label, hits, pct, col]}
              <div class="acc-row">
                <span class="acc-lbl" style="width:34px;">{label.toUpperCase()}</span>
                <div class="acc-track"><div class="acc-fill" style="width:{pct}%;background:{col};"></div></div>
                <span class="acc-pct" style="color:{col}">{pct}%</span>
                <span class="acc-hits">{(hits || 0).toLocaleString()}</span>
              </div>
            {/each}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:90px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:32px;line-height:1;color:{hsPct >= 25 ? 'var(--win)' : hsPct >= 15 ? 'var(--accent)' : 'var(--loss)'};">{hsPct}%</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">HS RATE</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted2);">{totalShots} shots</div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- ULTRA-COMPACT ECONOMY PER ROUND -->
  <div class="panel-section" style="padding: 12px 16px;">
    <div class="eco-header-bar">
      <div class="eco-header-left">
        <div class="panel-section-title" style="margin-bottom: 0;">Economy Per Round</div>
        <span class="eco-header-sub">Spent = Credits used · Bank = Remaining balance</span>
      </div>
      <div class="eco-view-toggle">
        <button class="eco-toggle-btn" class:active={ecoViewMode === 'compact'} on:click={() => ecoViewMode = 'compact'}>Compact</button>
        <button class="eco-toggle-btn" class:active={ecoViewMode === 'table'} on:click={() => ecoViewMode = 'table'}>Table</button>
      </div>
    </div>

    <!-- ECONOMY INTELLIGENCE DASHBOARD -->
    <div class="eco-intel-bar">
      <div class="eco-intel-card" title="Damage generated per 1,000 credits spent">
        <div class="eic-val">{ecoEfficiency} <span class="eic-unit">Dmg/1k</span></div>
        <div class="eic-lbl">Eco Efficiency</div>
      </div>
      <div class="eco-intel-card" title="Rounds won out of full buy rounds">
        <div class="eic-val" style="color: #00b2ff;">{fullBuyWins}/{fullBuyTotal} <span class="eic-pct">({fullBuyWr}%)</span></div>
        <div class="eic-lbl">Full Buy Win Rate</div>
      </div>
      {#if halfBuyTotal > 0}
        <div class="eco-intel-card" title="Rounds won out of half buy rounds">
          <div class="eic-val" style="color: #a78bfa;">{halfBuyWins}/{halfBuyTotal} <span class="eic-pct">({halfBuyWr}%)</span></div>
          <div class="eic-lbl">Half Buy Win Rate</div>
        </div>
      {/if}
      <div class="eco-intel-card" title="Rounds won out of force buy rounds">
        <div class="eic-val" style="color: #f5a623;">{forceWins}/{forceTotal} <span class="eic-pct">({forceWr}%)</span></div>
        <div class="eic-lbl">Force Buy Win Rate</div>
      </div>
      <div class="eco-intel-card" title="Pistol round outcome (R1 & R13)">
        <div class="eic-val">
          <span class="p-pill {pistol1Won ? 'win' : 'loss'}">R1 {pistol1Won ? 'WIN' : 'LOSS'}</span>
          <span class="p-pill {pistol2Won ? 'win' : 'loss'}">R13 {pistol2Won ? 'WIN' : 'LOSS'}</span>
        </div>
        <div class="eic-lbl">Pistol Rounds</div>
      </div>
      {#if thriftyCount > 0 || bonusWonCount > 0}
        <div class="eco-intel-card highlight">
          <div class="eic-val" style="color: var(--win);">
            {#if thriftyCount > 0}<span>{thriftyCount} Thrifty</span>{/if}
            {#if bonusWonCount > 0}<span style="margin-left: 6px;">{bonusWonCount} Bonus</span>{/if}
          </div>
          <div class="eic-lbl">Eco Milestones</div>
        </div>
      {/if}
    </div>

    {#if ecoCoachTip}
      <div class="eco-coach-tip">
        <span class="ect-icon">🤖 AI ECO INSIGHT:</span>
        <span class="ect-msg">{ecoCoachTip}</span>
      </div>
    {/if}

    {#if ecoRounds.length === 0}
      <div class="no-detail">Economy data not available</div>
    {:else if ecoViewMode === 'compact'}
      <div class="compact-eco-grid">
        {#each ecoRounds as r, ri}
          {@const ps = findMyPs(r._ps)}
          {@const eco = ps?.economy || {}}
          {@const won = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId}
          {@const weapon = getWeaponName(eco)}
          {@const armor = getArmorName(eco)}
          {@const buyType = computeBuyType(eco)}
          <div class="compact-eco-card" class:won class:lost={!won} title="Round {ri + 1} ({won ? 'WIN' : 'LOSS'} - {buyType})&#10;Weapon: {weapon}&#10;Armor: {armor}&#10;Loadout: {(eco.loadout_value || 0).toLocaleString()} cr&#10;Spent: {(eco.spent || 0).toLocaleString()} cr&#10;Bank: {(eco.remaining || 0).toLocaleString()} cr">
            <div class="compact-eco-top">
              <span class="compact-eco-rnum">R{ri + 1}</span>
              <div style="display:flex; gap:3px; align-items:center;">
                <span class="compact-eco-badge" class:won class:lost={!won}>{won ? 'W' : 'L'}</span>
                <span class="compact-eco-buy {buyType.toLowerCase().replace(/\s+/g, '-')}">{buyType}</span>
              </div>
            </div>
            <div class="compact-eco-wpn-row">
              <span class="compact-eco-wpn">{weapon}</span>
              {#if armor !== 'No Armor'}
                <span class="compact-eco-armor {armor.toLowerCase().replace(/\s+/g, '-').replace('-shield', '')}" title={armor}>
                  {armor.replace(' Shield', '')}
                </span>
              {/if}
            </div>
            <div class="compact-eco-sub">
              <span title="Spent Credits">Spent <strong style="color: var(--loss);">{formatMoney(eco.spent)}</strong></span>
              <span title="Remaining Bank">Bank <strong style="color: #f5a623;">{formatMoney(eco.remaining)}</strong></span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="eco-table-wrap">
        <table class="eco-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Result</th>
              <th>Buy</th>
              <th>Weapon</th>
              <th>Armor</th>
              <th>Loadout</th>
              <th>Spent</th>
              <th>Bank</th>
            </tr>
          </thead>
          <tbody>
            {#each ecoRounds as r, ri}
              {@const ps = findMyPs(r._ps)}
              {@const eco = ps?.economy || {}}
              {@const won = (r.winning_team || r.winningTeam || '').toLowerCase() === myTeamId}
              {@const weapon = getWeaponName(eco)}
              {@const armor = getArmorName(eco)}
              {@const buyType = computeBuyType(eco)}
              <tr>
                <td style="font-weight: 800;">Round {ri + 1}</td>
                <td><span class="compact-eco-badge" class:won class:lost={!won}>{won ? 'WIN' : 'LOSS'}</span></td>
                <td><span class="compact-eco-buy {buyType.toLowerCase().replace(' ', '-')}">{buyType}</span></td>
                <td style="font-weight: 700; color: #fff;">{weapon}</td>
                <td>{armor}</td>
                <td>{(eco.loadout_value || 0).toLocaleString()} cr</td>
                <td style="color: var(--loss);">{(eco.spent || 0).toLocaleString()} cr</td>
                <td style="color: #f5a623;">{(eco.remaining || 0).toLocaleString()} cr</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
{/if}

<style>
  .compact-detail-profile {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }

  .detail-card-thumb {
    width: 85px;
    height: 125px;
    border-radius: 8px;
    border: 1px solid var(--border);
    object-fit: cover;
    object-position: top center;
    flex-shrink: 0;
  }

  .perf-two-col {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .eco-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .eco-header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .eco-header-sub {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    color: var(--muted);
    letter-spacing: 0.5px;
  }

  .eco-view-toggle {
    display: flex;
    gap: 3px;
    background: var(--surface2);
    padding: 2px;
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .eco-toggle-btn {
    background: transparent;
    border: none;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .eco-toggle-btn.active {
    background: var(--surface3);
    color: var(--text);
    font-weight: bold;
  }

  .compact-eco-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)) !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  .compact-eco-card {
    background: rgba(13, 13, 16, 0.8) !important;
    border: 1px solid var(--border) !important;
    border-radius: 6px !important;
    padding: 6px 8px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 3px !important;
    transition: all 0.15s ease !important;
  }

  .compact-eco-card:hover {
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-1px) !important;
  }

  .compact-eco-card.won {
    border-left: 3px solid var(--win) !important;
    background: rgba(16, 185, 129, 0.04) !important;
  }

  .compact-eco-card.lost {
    border-left: 3px solid var(--loss) !important;
    background: rgba(244, 63, 94, 0.03) !important;
  }

  .compact-eco-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    font-size: 10px;
  }

  .compact-eco-rnum {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 11px;
    color: var(--text);
  }

  .compact-eco-badge {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .compact-eco-badge.won { color: var(--win); background: rgba(16, 185, 129, 0.15); }
  .compact-eco-badge.lost { color: var(--loss); background: rgba(244, 63, 94, 0.15); }

  .compact-eco-buy {
    font-family: 'DM Mono', monospace;
    font-size: 7.5px;
    font-weight: 700;
    padding: 1px 3px;
    border-radius: 2px;
    text-transform: uppercase;
  }
  .compact-eco-buy.full-buy { color: #00b2ff; background: rgba(0, 178, 255, 0.12); }
  .compact-eco-buy.half-buy { color: #a78bfa; background: rgba(167, 139, 250, 0.15); }
  .compact-eco-buy.force { color: #f5a623; background: rgba(245, 166, 35, 0.12); }
  .compact-eco-buy.eco { color: var(--muted); background: rgba(255, 255, 255, 0.05); }

  .compact-eco-wpn-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  .compact-eco-wpn {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 11px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact-eco-armor {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    color: #cbd5e1;
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 4px;
    border-radius: 3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .compact-eco-armor.heavy {
    color: #38bdf8;
    background: rgba(0, 178, 255, 0.15);
    border: 1px solid rgba(0, 178, 255, 0.3);
  }

  .compact-eco-armor.light {
    color: #c084fc;
    background: rgba(167, 139, 250, 0.15);
    border: 1px solid rgba(167, 139, 250, 0.3);
  }

  .compact-eco-armor.regen {
    color: #34d399;
    background: rgba(52, 211, 153, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.3);
  }

  .compact-eco-sub {
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }

  .eco-table-wrap {
    overflow-x: auto;
    margin-top: 6px;
  }

  .eco-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
  }

  .eco-table th {
    background: var(--surface2);
    color: var(--muted);
    font-weight: 700;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .eco-table td {
    padding: 6px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: var(--text);
  }

  .eco-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .multi-kill-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .mk-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--muted);
  }

  .mk-pill {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    color: var(--muted);
  }

  .mk-pill.active {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }

  .mk-pill.ace.active {
    color: var(--accent);
    border-color: var(--accentborder);
    background: var(--accentdim);
  }
  .eco-intel-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
    gap: 8px;
    margin-bottom: 10px;
  }

  .eco-intel-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 10px;
    text-align: center;
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .eco-intel-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  .eco-intel-card.highlight {
    border-color: var(--accentborder);
    background: var(--accentdim);
  }

  .eic-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 17px;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    line-height: 1.1;
  }

  .eic-unit {
    font-size: 11px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-weight: 400;
  }

  .eic-pct {
    font-size: 12px;
    opacity: 0.85;
  }

  .eic-lbl {
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    color: var(--muted2);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-top: 3px;
  }

  .p-pill {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
  }
  .p-pill.win { background: rgba(16, 185, 129, 0.15); color: var(--win); }
  .p-pill.loss { background: rgba(244, 63, 94, 0.15); color: var(--loss); }

  .eco-coach-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(232, 255, 71, 0.04);
    border: 1px solid rgba(232, 255, 71, 0.2);
    border-radius: 6px;
    padding: 6px 12px;
    margin-bottom: 10px;
    font-size: 11px;
  }

  .ect-icon {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    color: #e8ff47;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  .ect-msg {
    font-family: 'Inter', sans-serif;
    color: var(--text);
    font-size: 11px;
  }

  /* ── MOBILE RESPONSIVE OPTIMIZATIONS ── */
  @media (max-width: 650px) {
    .compact-detail-profile {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .detail-card-thumb {
      width: 100%;
      height: 65px;
      object-position: center 20%;
    }

    .detail-profile-stats {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 6px !important;
    }

    .dp-stat {
      padding: 6px 8px !important;
    }

    .dpv {
      font-size: 16px !important;
    }

    .dpl {
      font-size: 8px !important;
    }

    .multi-kill-bar {
      justify-content: space-around;
      padding: 6px 8px;
    }

    .perf-two-col {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .acc-body-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px !important;
    }

    .eco-header-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .eco-intel-bar {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 6px !important;
    }

    .eco-intel-card.highlight {
      grid-column: 1 / -1;
    }

    .eco-coach-tip {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 8px 10px;
    }

    .ect-msg {
      font-size: 10.5px;
    }

    .compact-eco-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }

    .compact-eco-card {
      padding: 8px 10px !important;
    }

    .compact-eco-wpn {
      font-size: 12px !important;
    }

    .compact-eco-sub {
      font-size: 9px !important;
    }
  }
</style>


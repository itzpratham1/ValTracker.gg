<script>
  import { getAgentIconUrl } from '../../lib/assets';
  import { escapeHtml } from '../../lib/utils';

  export let match = null;
  export let playerName = '';
  export let playerTag = '';

  $: allPlayers = getPlayerList(match);
  $: rounds = match?.rounds || [];
  $: kills = match?.kills || [];

  $: me = allPlayers.find(p =>
    p.name?.toLowerCase() === playerName?.toLowerCase() &&
    p.tag?.toLowerCase() === playerTag?.toLowerCase()
  );
  $: myPuuid = me?.puuid || me?.subject || me?.id || '';
  $: myPuuids = [me?.puuid, me?.subject, me?.id, myPuuid].filter(Boolean);
  $: myTeamId = (me?.team || '').toLowerCase();
  $: enemies = allPlayers.filter(p => (p.team || '').toLowerCase() !== myTeamId);

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

  function findMyPs(ps) {
    return (ps || []).find(p => myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id));
  }

  function resolveWeapon(k) {
    if (k.damage_weapon_name && k.damage_weapon_name.length > 1) {
      return {
        name: k.damage_weapon_name,
        icon: k.damage_weapon_assets?.killfeed_icon || k.damage_weapon_assets?.display_icon || null
      };
    }
    const wpnId = k.damage_weapon_id || '';
    if (wpnId) {
      const cleaned = wpnId.replace(/^[^/]*\//, '').replace(/TX_Hud_/i, '').replace(/_/g, ' ').trim();
      if (/^[0-9a-f]{8}-/.test(cleaned)) return { name: 'Ability', icon: null };
      return { name: cleaned || 'Unknown', icon: null };
    }
    return { name: 'Unknown', icon: null };
  }

  // Summary stats
  $: matchStats = me?.stats || {};
  $: headS = matchStats.headshots || 0;
  $: bodyS = matchStats.bodyshots || 0;
  $: legS = matchStats.legshots || 0;
  $: totalShots = headS + bodyS + legS;
  $: hsPct = totalShots ? Math.round((headS / totalShots) * 100) : 0;

  $: duelK = me?.stats?.kills || 0;
  $: duelD = me?.stats?.deaths || 0;
  $: duelWin = Math.round((duelK / Math.max(duelK + duelD, 1)) * 100);
  $: duelKd = duelD ? (duelK / duelD).toFixed(2) : duelK.toFixed(2);
  $: totalRoundsCount = parsedRounds.length || 24;
  $: kpr = totalRoundsCount ? (duelK / totalRoundsCount).toFixed(2) : '0.00';
  $: dpr = totalRoundsCount ? (duelD / totalRoundsCount).toFixed(2) : '0.00';
  $: duelCol = duelWin >= 55 ? 'var(--win)' : duelWin <= 44 ? 'var(--loss)' : 'var(--accent)';
  $: kdCol = parseFloat(duelKd) >= 1.2 ? 'var(--win)' : parseFloat(duelKd) < 0.9 ? 'var(--loss)' : 'var(--text)';
  $: hsCol = hsPct >= 25 ? 'var(--win)' : hsPct < 15 ? 'var(--loss)' : 'var(--text)';
  $: winW = Math.round((duelK / Math.max(duelK + duelD, 1)) * 100);
  $: lossW = 100 - winW;

  $: insight = (() => {
    let ins = '';
    if (duelWin >= 60) ins = `<span style="color:var(--win)">Strong duel game</span> · you won ${duelWin}% of 1v1s this match.`;
    else if (duelWin <= 42) ins = `<span style="color:var(--loss)">Rough duel game</span> · lost more gunfights than won (${duelWin}%). Check if you were peeking without info.`;
    else ins = `<span style="color:var(--muted)">Average duel game</span> · close split between kills and deaths.`;
    if (hsPct >= 30) ins += ` Excellent HS% (${hsPct}%) this match.`;
    else if (hsPct < 15 && totalShots > 0) ins += ` Low HS% (${hsPct}%) · likely spraying under pressure.`;
    return ins;
  })();

  // Core calculations
  $: duelData = (() => {
    if (!me || !enemies.length) return { duelEntries: [], roundKills: [] };

    const duelMatrix = {};
    enemies.forEach(e => {
      const ePuuid = e.puuid || e.subject || e.id || '';
      duelMatrix[ePuuid] = { kills: 0, deaths: 0, name: e.name, agent: e.character || e.agent?.name || '' };
    });

    const roundKillsList = [];

    parsedRounds.forEach((r, ri) => {
      const myPs = findMyPs(r._ps);
      const myKills = myPs?.kill_events || myPs?.kills || [];
      const killCount = myKills.length;
      const roundWon = (r.winning_team || '').toLowerCase() === myTeamId;

      const processedKills = [];
      myKills.forEach(k => {
        let isHS = typeof k.headshot === 'boolean' ? k.headshot : k.finishing_damage?.is_headshot;
        const victimId = k.victim_puuid || k.victim || '';
        if (!isHS && myPs?.damage_events) {
          const dE = myPs.damage_events.find(de => de.receiver_puuid === victimId);
          if (dE && dE.headshots > 0) isHS = true;
        }
        isHS = isHS || false;

        const victim = allPlayers.find(p => (p.puuid || p.subject || p.id) === victimId);
        const victimName = victim ? victim.name : 'Enemy';
        const victimAgent = victim ? (victim.character || victim.agent?.name || '') : '';
        const wpn = resolveWeapon(k);

        processedKills.push({
          victimName,
          victimAgent,
          wpn,
          isHS
        });

        if (duelMatrix[victimId]) {
          duelMatrix[victimId].kills++;
        }
      });

      if (killCount > 0) {
        roundKillsList.push({
          roundNum: ri + 1,
          won: roundWon,
          kills: processedKills
        });
      }

      r._ps.forEach(pStats => {
        const pId = pStats.player_puuid || pStats.subject || pStats.puuid;
        const pKills = pStats.kill_events || pStats.kills || [];
        pKills.forEach(k => {
          const victimId = k.victim_puuid || k.victim || '';
          if (myPuuids.includes(victimId) && duelMatrix[pId]) {
            duelMatrix[pId].deaths++;
          }
        });
      });
    });

    const duelEntries = Object.values(duelMatrix)
      .filter(d => d.kills > 0 || d.deaths > 0)
      .sort((a, b) => (b.kills - b.deaths) - (a.kills - a.deaths));

    return { duelEntries, roundKills: roundKillsList };
  })();
</script>

{#if !me}
  <div class="no-detail">Your player not found in match data</div>
{:else}
  <!-- Duel Breakdown Summary -->
  <div class="panel-section">
    <div class="panel-section-title">Duel Breakdown Summary</div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div class="match-duels-summary-grid">
        <div style="text-align:center;">
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); letter-spacing:1px; text-transform:uppercase;">Duel Win %</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; color:{duelCol}">{duelWin}%</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); letter-spacing:1px; text-transform:uppercase;">K/D</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; color:{kdCol}">{duelKd}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); letter-spacing:1px; text-transform:uppercase;">KPR</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; color:{parseFloat(kpr) >= 0.8 ? 'var(--win)' : parseFloat(kpr) < 0.5 ? 'var(--loss)' : 'var(--text)'}">{kpr}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); letter-spacing:1px; text-transform:uppercase;">DPR</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; color:{parseFloat(dpr) <= 0.7 ? 'var(--win)' : parseFloat(dpr) > 0.9 ? 'var(--loss)' : 'var(--text)'}">{dpr}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); letter-spacing:1px; text-transform:uppercase;">HS %</div>
          <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; color:{hsCol}">{hsPct}%</div>
        </div>
      </div>
      <div style="background:var(--surface2); border-radius:4px; overflow:hidden; height:6px; display:flex;">
        <div style="width:{winW}%; background:var(--win); transition:width 0.8s ease;"></div>
        <div style="width:{lossW}%; background:var(--loss); transition:width 0.8s ease;"></div>
      </div>
      <div style="font-family:'Barlow',sans-serif; font-size:12px; color:rgba(240,240,242,0.7); line-height:1.5">{@html insight}</div>
    </div>
  </div>

  <!-- Duel Matrix -->
  {#if duelData.duelEntries.length}
    <div class="panel-section">
      <div class="panel-section-title">Duel Matrix</div>
      <div style="font-family:'DM Mono',monospace; font-size:9px; color:var(--muted); letter-spacing:1px; margin-bottom:8px;">YOUR KILLS vs THEIR KILLS AGAINST YOU</div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        {#each duelData.duelEntries as d}
          {@const icon = getAgentIconUrl(d.agent)}
          {@const net = d.kills - d.deaths}
          {@const netCol = net > 0 ? 'var(--win)' : net < 0 ? 'var(--loss)' : 'var(--muted)'}
          <div style="display:flex; align-items:center; gap:8px; padding:5px 8px; background:var(--surface2); border-radius:var(--radius-sm);">
            {#if icon}
              <img src={icon} style="width:24px; height:24px; object-fit:contain; border-radius:3px; background:var(--surface3);" alt="" on:error={(e) => e.target.style.display='none'}>
            {:else}
              <div style="width:24px; height:24px; background:var(--surface3); border-radius:3px;"></div>
            {/if}
            <div style="flex:1; min-width:0;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{escapeHtml(d.name)}</div>
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:var(--muted2);">{escapeHtml(d.agent.toUpperCase())}</div>
            </div>
            <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
              <div style="text-align:center; min-width:28px;">
                <div style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:18px; color:var(--win); line-height:1;">{d.kills}</div>
                <div style="font-family:'DM Mono',monospace; font-size:7px; color:var(--muted2); letter-spacing:1px;">KILLS</div>
              </div>
              <div style="width:1px; height:24px; background:var(--border);"></div>
              <div style="text-align:center; min-width:28px;">
                <div style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:18px; color:var(--loss); line-height:1;">{d.deaths}</div>
                <div style="font-family:'DM Mono',monospace; font-size:7px; color:var(--muted2); letter-spacing:1px;">DEATHS</div>
              </div>
              <div style="min-width:36px; text-align:right;">
                <span style="font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:14px; color:{netCol};">{net > 0 ? '+' : ''}{net}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Round Kill Feed -->
  <div class="panel-section">
    <div class="panel-section-title">Round Kill Feed</div>
    {#if !duelData.roundKills.length}
      <div class="no-detail">No kill data for this match</div>
    {:else}
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        {#each duelData.roundKills as rk}
          {@const badge = rk.kills.length >= 5 ? ' · ACE' : rk.kills.length >= 4 ? ' · 4K' : rk.kills.length >= 3 ? ' · 3K' : ''}
          <div style="background:var(--surface2); border:1px solid {rk.won ? 'rgba(62,207,142,0.12)' : 'rgba(255,87,87,0.08)'}; border-radius:var(--radius-sm); overflow:hidden; flex:1; min-width:220px; max-width:100%;">
            <div style="display:flex; align-items:center; gap:6px; padding:6px 10px; border-bottom:1px solid var(--border);">
              <span style="font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; color:{rk.won ? 'var(--win)' : 'var(--loss)'};">R{rk.roundNum}</span>
              <span style="font-family:'DM Mono',monospace; font-size:8px; color:{rk.won ? 'var(--win)' : 'var(--loss)'}; letter-spacing:1px; opacity:0.7;">{rk.won ? 'W' : 'L'}{badge}</span>
              <span style="margin-left:auto; font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:13px; color:var(--text);">{rk.kills.length}K</span>
            </div>
            {#each rk.kills as k}
              {@const victimIcon = getAgentIconUrl(k.victimAgent)}
              <div style="display:flex; align-items:center; gap:6px; padding:4px 10px; border-bottom:1px solid rgba(255,255,255,0.02);">
                {#if victimIcon}
                  <img src={victimIcon} style="width:16px; height:16px; object-fit:contain; flex-shrink:0; border-radius:2px;" alt="" on:error={(e) => e.target.style.display='none'}>
                {:else}
                  <div style="width:16px; height:16px; background:var(--surface3); border-radius:2px; flex-shrink:0;"></div>
                {/if}
                <span style="font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; color:var(--text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{escapeHtml(k.victimName)}</span>
                {#if k.wpn.icon}
                  <img src={k.wpn.icon} style="height:10px; width:auto; object-fit:contain; filter:brightness(0.8); flex-shrink:0;" alt={k.wpn.name} on:error={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'inline'; }}>
                  <span style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); display:none;">{escapeHtml(k.wpn.name)}</span>
                {:else}
                  <span style="font-family:'DM Mono',monospace; font-size:8px; color:var(--muted2); flex-shrink:0;">{escapeHtml(k.wpn.name)}</span>
                {/if}
                {#if k.isHS}
                  <span style="font-family:'DM Mono',monospace; font-size:7px; font-weight:700; color:var(--accent); background:var(--accentdim); padding:1px 4px; border-radius:2px; letter-spacing:1px; flex-shrink:0;">HS</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

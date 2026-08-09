<script>
  import { tick, onMount } from 'svelte';
  import { createShareCard } from '../../lib/api';
  import { getAgentIconUrl, getAgentPortraitUrl, getMapImg } from '../../lib/assets';
  import { getRankImgUrl, getRankFromRR } from '../../lib/constants';
  import { formatMatchDate, getPlayerList } from '../../lib/utils';
  import { renderFlexCardToCanvas } from '../../lib/flexCardRenderer';

  export let match = null;
  export let playerName = '';
  export let playerTag = '';
  export let allPlayers = [];
  export let rawMatch = null;
  export let playerBannerUrl = '';
  export let playerLevel = '';
  export let onClose = () => {};

  let loading = true;
  let loaded = false;
  let loadingTxt = 'GENERATING NATIVE FLEX CARD...';
  let imgPreview = '';
  let templateText = '';
  let shareUrl = '';
  let shareId = '';
  let copyFeedback = false;
  let canvasEl;

  // Luxury Themes
  const FLEX_THEMES = [
    {
      id: 'champions',
      name: 'VCT Champions',
      badge: '🏆 CHAMPIONS',
      accent: '#ffd700',
      accentShadow: 'rgba(255, 215, 0, 0.4)',
      border: 'rgba(255, 215, 0, 0.45)',
      bgGradStart: 'rgba(255, 215, 0, 0.16)',
      bgGradEnd: 'rgba(18, 14, 4, 0.97)',
      cardBg: '#090805',
      titleBgStart: 'rgba(255, 215, 0, 0.25)',
      titleColor: '#ffd700',
      titleBorder: 'rgba(255, 215, 0, 0.5)'
    },
    {
      id: 'obsidian',
      name: 'Obsidian Valor',
      badge: '🔥 OBSIDIAN',
      accent: '#fa4454',
      accentShadow: 'rgba(250, 68, 84, 0.35)',
      border: 'rgba(250, 68, 84, 0.4)',
      bgGradStart: 'rgba(250, 68, 84, 0.12)',
      bgGradEnd: 'rgba(10, 10, 15, 0.96)',
      cardBg: '#050508',
      titleBgStart: 'rgba(250, 68, 84, 0.2)',
      titleColor: '#fa4454',
      titleBorder: 'rgba(250, 68, 84, 0.4)'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      badge: '⚡ CYBERPUNK',
      accent: '#00f3ff',
      accentShadow: 'rgba(0, 243, 255, 0.4)',
      border: 'rgba(0, 243, 255, 0.4)',
      bgGradStart: 'rgba(0, 243, 255, 0.15)',
      bgGradEnd: 'rgba(6, 12, 24, 0.97)',
      cardBg: '#040810',
      titleBgStart: 'rgba(0, 243, 255, 0.25)',
      titleColor: '#00f3ff',
      titleBorder: 'rgba(0, 243, 255, 0.5)'
    },
    {
      id: 'icebox',
      name: 'Icebox Frost',
      badge: '❄️ FROST',
      accent: '#38bdf8',
      accentShadow: 'rgba(56, 189, 248, 0.4)',
      border: 'rgba(56, 189, 248, 0.4)',
      bgGradStart: 'rgba(56, 189, 248, 0.18)',
      bgGradEnd: 'rgba(10, 20, 30, 0.96)',
      cardBg: '#060c14',
      titleBgStart: 'rgba(56, 189, 248, 0.25)',
      titleColor: '#38bdf8',
      titleBorder: 'rgba(56, 189, 248, 0.5)'
    },
    {
      id: 'sovereign',
      name: 'Sovereign Minimal',
      badge: '☯️ SOVEREIGN',
      accent: '#ffffff',
      accentShadow: 'rgba(255, 255, 255, 0.25)',
      border: 'rgba(255, 255, 255, 0.25)',
      bgGradStart: 'rgba(255, 255, 255, 0.08)',
      bgGradEnd: 'rgba(15, 15, 18, 0.98)',
      cardBg: '#09090b',
      titleBgStart: 'rgba(255, 255, 255, 0.12)',
      titleColor: '#ffffff',
      titleBorder: 'rgba(255, 255, 255, 0.3)'
    }
  ];

  let selectedThemeId = 'champions';
  $: activeTheme = FLEX_THEMES.find(t => t.id === selectedThemeId) || FLEX_THEMES[0];

  // Customizer Toggles
  let showScoreboard = true;
  let showTimeline = true;
  let showFeats = true;

  // 3D Tilt Preview State
  let rotateX = 0;
  let rotateY = 0;

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rotateX = ((y - centerY) / centerY) * -6;
    rotateY = ((x - centerX) / centerX) * 6;
  }

  function handleMouseLeave() {
    rotateX = 0;
    rotateY = 0;
  }

  $: if (match) generateCard();

  const TIER_RR_MAP = {
    'Iron 1': 3, 'Iron 2': 4, 'Iron 3': 5,
    'Bronze 1': 6, 'Bronze 2': 7, 'Bronze 3': 8,
    'Silver 1': 9, 'Silver 2': 10, 'Silver 3': 11,
    'Gold 1': 12, 'Gold 2': 13, 'Gold 3': 14,
    'Platinum 1': 15, 'Platinum 2': 16, 'Platinum 3': 17,
    'Diamond 1': 18, 'Diamond 2': 19, 'Diamond 3': 20,
    'Ascendant 1': 21, 'Ascendant 2': 22, 'Ascendant 3': 23,
    'Immortal 1': 24, 'Immortal 2': 25, 'Immortal 3': 26,
    'Radiant': 27
  };

  function getTierRR(tierName) {
    const id = TIER_RR_MAP[tierName];
    return id != null ? (id - 3) * 100 : null;
  }

  function getLobbyRankInfo(players, myTeamId) {
    const withRank = players.filter(p =>
      p.currenttier_patched && p.currenttier_patched !== 'Unranked' && p.currenttier && p.currenttier > 0
    );
    if (!withRank.length) return null;
    const avgTierRR = (arr) => {
      if (!arr.length) return null;
      const total = arr.reduce((s, p) => {
        const rr = getTierRR(p.currenttier_patched) || ((p.currenttier || 3) - 3) * 100;
        return s + rr;
      }, 0);
      return Math.round(total / arr.length);
    };
    const allAvg = avgTierRR(withRank);
    return allAvg != null ? getRankFromRR(allAvg) : null;
  }

  async function selectTheme(themeId) {
    if (selectedThemeId === themeId) return;
    selectedThemeId = themeId;
    activeTheme = FLEX_THEMES.find(t => t.id === themeId) || FLEX_THEMES[0];
    await tick();
    await reRenderCanvas();
  }

  async function toggleOption(opt) {
    if (opt === 'scoreboard') showScoreboard = !showScoreboard;
    if (opt === 'timeline') showTimeline = !showTimeline;
    if (opt === 'feats') showFeats = !showFeats;
    await tick();
    await reRenderCanvas();
  }

  async function generateCard() {
    if (!match) return;
    loading = true;
    loaded = false;
    loadingTxt = 'COMPILING FLEX CARD...';

    await tick();
    await reRenderCanvas();

    try {
      if (imgPreview) {
        const res = await createShareCard({
          image: imgPreview,
          playerName,
          playerTag,
          agentName: match.agentName,
          mapName: match.map,
          won: match.won,
          score: match.rounds
        });
        if (res.status === 'ok') {
          shareUrl = res.share_url;
          shareId = res.share_id;
          if (!templateText.includes(res.share_url)) {
            templateText = templateText + ' ' + res.share_url;
          }
        }
      }
    } catch (e) {
      console.error('Share card upload error:', e);
    }
  }

  async function reRenderCanvas() {
    if (!match || !canvasEl) return;
    const m = match;
    const pl = allPlayers || [];
    const plist = rawMatch ? getPlayerList(rawMatch) : pl;

    const totalRoundsFromScore = (rawMatch?.rounds || []).length || String(m.rounds || '1-1').split('-').reduce((a, b) => Number(a) + Number(b), 0);
    const acs = m.acs || Math.round((m.score || 0) / Math.max(1, totalRoundsFromScore));
    const hsPct = m.shots ? Math.round((m.hs / m.shots) * 100) : (m.headshotPct || 0);
    const kd = m.deaths ? (m.kills / m.deaths).toFixed(2) : m.kills.toFixed(2);

    const meC = plist.find(p => p.name?.toLowerCase() === playerName.toLowerCase() && p.tag?.toLowerCase() === playerTag.toLowerCase());
    const myPuuid = meC?.puuid || meC?.subject || meC?.id || '';
    const myPuuids = [meC?.puuid, meC?.subject, meC?.id, myPuuid].filter(Boolean);

    let totalDamage = 0;
    let firstKills = 0;
    let firstDeaths = 0;
    const rounds = rawMatch?.rounds || [];

    rounds.forEach((r) => {
      const playerStats = r.player_stats || [];
      const myPs = myPuuid ? playerStats.find(p => myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)) : null;
      if (myPs) {
        if (typeof myPs.damage === 'number') totalDamage += myPs.damage;
        else if (Array.isArray(myPs.damage_events)) {
          totalDamage += myPs.damage_events.reduce((sum, d) => sum + (d.damage || 0), 0);
        }
      }

      let allKills = [];
      playerStats.forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          allKills.push(k);
        });
      });
      allKills.sort((a, b) => (a.kill_time_in_round || a.time_in_round || 0) - (b.kill_time_in_round || b.time_in_round || 0));
      if (allKills.length > 0) {
        const fk = allKills[0];
        const killer = fk.killer_puuid || fk.killer;
        const victim = fk.victim_puuid || fk.victim;
        if (killer && myPuuids.includes(killer)) firstKills++;
        if (victim && myPuuids.includes(victim)) firstDeaths++;
      }
    });

    const adr = totalRoundsFromScore ? Math.round(totalDamage / totalRoundsFromScore) : Math.round(acs * 0.7);
    const fkDiffNum = firstKills - firstDeaths;
    const fkFdDiff = fkDiffNum >= 0 ? `+${fkDiffNum}` : `${fkDiffNum}`;

    const combatRating = Math.min(10, (parseFloat(kd) * 2.8 + acs / 75 + hsPct / 12 + (adr / 80)).toFixed(1));

    let perfGrade = 'B';
    if (combatRating >= 9.0) perfGrade = 'S+';
    else if (combatRating >= 8.0) perfGrade = 'S';
    else if (combatRating >= 6.8) perfGrade = 'A';
    else if (combatRating >= 5.0) perfGrade = 'B';

    const totalRounds = totalRoundsFromScore || 1;
    const getACS = p => Math.round((p.stats?.score || 0) / totalRounds);
    const matchMVPPlayer = plist.length ? plist.reduce((b, p) => getACS(p) > getACS(b) ? p : b, plist[0]) : null;
    const alliedPlayersList = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId);
    const teamMVPPlayer = alliedPlayersList.length ? alliedPlayersList.reduce((b, p) => getACS(p) > getACS(b) ? p : b, alliedPlayersList[0]) : null;

    const isMatchMVP = matchMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();
    const isTeamMVP = !isMatchMVP && teamMVPPlayer?.name?.toLowerCase() === playerName.toLowerCase();

    let doubleKills = 0, tripleKills = 0, quadKills = 0, aces = 0, clutchesCount = 0;
    const teammatePuuids = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId && !myPuuids.includes(p.puuid)).map(p => p.puuid);

    const roundList = rounds.map((r) => {
      const myWon = (r.winning_team || r.winningTeam || '').toLowerCase() === m.myTeamId;
      const playerStats = r.player_stats || [];
      const myPs = myPuuid ? playerStats.find(p => myPuuids.includes(p.player_puuid || p.subject || p.puuid || p.player_id)) : null;
      const killEvents = myPs?.kill_events || [];
      const myKills = typeof myPs?.kills === 'number' ? myPs.kills : (myPs?.kills?.length || killEvents.length || 0);

      if (myKills === 2) doubleKills++;
      else if (myKills === 3) tripleKills++;
      else if (myKills === 4) quadKills++;
      else if (myKills >= 5) aces++;

      let tmDeaths = 0, meDied = false;
      playerStats.forEach(ps => {
        (ps.kill_events || []).forEach(k => {
          const victim = k.victim_puuid || k.victim;
          if (victim && myPuuids.includes(victim)) meDied = true;
          if (victim && teammatePuuids.includes(victim)) tmDeaths++;
        });
      });

      const isClutch = myWon && tmDeaths >= teammatePuuids.length && teammatePuuids.length > 0 && !meDied;
      if (isClutch) clutchesCount++;

      return { won: myWon, isClutch };
    });

    let coolTitle = '🏆 VICTORIOUS TACTICIAN';
    if (m.won) {
      if (aces > 0) coolTitle = '👑 CHAMPION ACE';
      else if (clutchesCount >= 2) coolTitle = '⚡ CLUTCH LEGEND';
      else if (kd >= 2.0) coolTitle = '🔥 UNSTOPPABLE APEX';
      else if (kd >= 1.5 && isMatchMVP) coolTitle = '🧬 MATCH COLOSSUS';
      else if (kd >= 1.25) coolTitle = '💥 SQUAD CARRY';
      else if (isMatchMVP) coolTitle = '👑 MATCH MVP';
      else if (isTeamMVP) coolTitle = '⭐ TEAM MVP';
      else if (m.assists >= 8) coolTitle = '🛡️ TACTICAL ANCHOR';
    } else {
      if (isMatchMVP) coolTitle = '👑 MATCH MVP (DEFEAT)';
      else if (isTeamMVP) coolTitle = '⭐ TEAM MVP (DEFEAT)';
      else if (kd >= 1.3) coolTitle = '💥 VALIANT EFFORT';
      else coolTitle = '🛡️ TACTICAL ANCHOR';
    }

    const userRank = meC?.currenttier_patched || meC?.tier || 'Unranked';
    const userRankImgUrl = getRankImgUrl(userRank) || '';

    const rankInfo = getLobbyRankInfo(plist, m.myTeamId);
    const lobbyRank = rankInfo?.name || 'Unknown';
    const lobbyRankImgUrl = getRankImgUrl(lobbyRank) || '';

    const alliedSorted = plist.filter(p => (p.team || '').toLowerCase() === m.myTeamId).sort((a, b) => getACS(b) - getACS(a));
    const enemySorted = plist.filter(p => (p.team || '').toLowerCase() !== m.myTeamId).sort((a, b) => getACS(b) - getACS(a));

    const cardData = {
      playerName,
      playerTag,
      playerLevel: playerLevel || '—',
      playerBannerUrl: playerBannerUrl || '',
      agentName: m.agentName || 'Agent',
      agentIconUrl: getAgentIconUrl(m.agentName) || '',
      agentPortraitUrl: getAgentPortraitUrl(m.agentName) || getAgentIconUrl(m.agentName) || '',
      mapName: m.map || 'Valorant',
      mapImgUrl: getMapImg(m.map) || '',
      won: m.won,
      score: m.rounds || '13 - 6',
      gameDate: formatMatchDate(m.gameStart),
      kills: m.kills || 0,
      deaths: m.deaths || 0,
      assists: m.assists || 0,
      kd,
      acs,
      hsPct,
      adr,
      fkFdDiff,
      combatRating: String(combatRating),
      perfGrade,
      coolTitle,
      isMatchMVP,
      isTeamMVP,
      userRank,
      userRankImgUrl,
      lobbyRank,
      lobbyRankImgUrl,
      rounds: roundList,
      feats: {
        aces,
        clutches: clutchesCount,
        quads: quadKills,
        triples: tripleKills,
        doubles: doubleKills
      },
      alliedPlayers: alliedSorted.map(p => ({
        name: p.name,
        tag: p.tag,
        iconUrl: getAgentIconUrl(p.character || p.agent?.name || '') || '',
        kda: `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`,
        acs: Math.round((p.stats?.score || 0) / totalRounds),
        isMe: p.name?.toLowerCase() === playerName.toLowerCase() && p.tag?.toLowerCase() === playerTag.toLowerCase()
      })),
      enemyPlayers: enemySorted.map(p => ({
        name: p.name,
        tag: p.tag,
        iconUrl: getAgentIconUrl(p.character || p.agent?.name || '') || '',
        kda: `${p.stats?.kills || 0}/${p.stats?.deaths || 0}/${p.stats?.assists || 0}`,
        acs: Math.round((p.stats?.score || 0) / totalRounds)
      }))
    };

    // Render directly to Native Canvas 2D
    await renderFlexCardToCanvas(canvasEl, cardData, activeTheme, { showScoreboard, showTimeline, showFeats });

    imgPreview = canvasEl.toDataURL('image/png');
    loading = false;
    loaded = true;
  }

  async function copyImageToClipboard() {
    try {
      if (!canvasEl) return;
      canvasEl.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copyFeedback = true;
          setTimeout(() => { copyFeedback = false; }, 3000);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  }

  function shareToPlatform(platform) {
    const text = templateText;
    const encodedText = encodeURIComponent(text);

    if (platform === 'download') {
      const a = document.createElement('a');
      a.href = imgPreview;
      a.download = `valtracker_${activeTheme.id}_${match?.agentName || 'agent'}_${match?.map || 'map'}_${Date.now()}.png`;
      a.click();
    } else if (platform === 'twitter') {
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      let cleanText = text;
      if (shareUrl && cleanText.includes(shareUrl)) cleanText = cleanText.replace(shareUrl, '').trim();
      const url = shareUrl
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanText)}&url=${encodeURIComponent(urlWithBuster)}`
        : `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(url, '_blank');
    } else if (platform === 'reddit') {
      const title = match?.won
        ? `[ValTracker] Secured an epic ${match?.rounds} VICTORY on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'}!`
        : `[ValTracker] Match on ${match?.map?.toUpperCase() || 'VALORANT'} as ${match?.agentName?.toUpperCase() || 'Agent'} (${match?.rounds})`;
      const urlWithBuster = shareUrl ? `${shareUrl}?v=${Date.now()}` : '';
      const url = shareUrl
        ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(urlWithBuster)}&title=${encodeURIComponent(title)}`
        : `https://www.reddit.com/r/VALORANT/submit?title=${encodeURIComponent(title)}`;
      window.open(url, '_blank');
    }
  }
</script>

<!-- Offscreen Native Canvas Context -->
<canvas bind:this={canvasEl} style="display:none;"></canvas>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="share-modal-overlay" class:open={match} on:click|self={onClose}>
  {#if match}
    <div class="share-modal">
      <!-- Modal Header -->
      <div class="share-modal-header">
        <div class="share-modal-title">
          <img src="/logo.png" style="height:22px; width:auto;" alt="Logo" />
          Flex Card Customizer
        </div>
        <button class="share-modal-close" on:click={onClose}>&#10005;</button>
      </div>

      <div class="share-modal-body">
        <!-- Interactive Theme Bar -->
        <div class="theme-bar-wrap">
          <div class="theme-bar-label">SELECT LUXURY THEME:</div>
          <div class="theme-pills">
            {#each FLEX_THEMES as theme}
              <button 
                class="theme-pill" 
                class:active={selectedThemeId === theme.id}
                style="--t-accent:{theme.accent}; --t-border:{theme.border}"
                on:click={() => selectTheme(theme.id)}
              >
                <span class="theme-dot" style="background:{theme.accent}"></span>
                {theme.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Interactive Section Toggles -->
        <div class="toggle-bar-wrap">
          <div class="theme-bar-label">LAYOUT CONTROLS:</div>
          <div class="toggle-pills">
            <button class="toggle-btn" class:active={showScoreboard} on:click={() => toggleOption('scoreboard')}>
              {showScoreboard ? '✓ Scoreboard' : '+ Add Scoreboard'}
            </button>
            <button class="toggle-btn" class:active={showTimeline} on:click={() => toggleOption('timeline')}>
              {showTimeline ? '✓ Timeline' : '+ Add Timeline'}
            </button>
            <button class="toggle-btn" class:active={showFeats} on:click={() => toggleOption('feats')}>
              {showFeats ? '✓ Feats' : '+ Add Feats'}
            </button>
          </div>
        </div>

        {#if loading}
          <div class="share-loading">
            <div class="share-spinner" style="border-top-color:{activeTheme.accent}"></div>
            <div class="share-loading-txt">{loadingTxt}</div>
          </div>
        {/if}

        {#if loaded}
          <div class="share-loaded">
            <!-- 3D Tilt Preview Container -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="share-preview-wrap" 
              on:mousemove={handleMouseMove} 
              on:mouseleave={handleMouseLeave}
              style="transform: perspective(1000px) rotateX({rotateX}deg) rotateY({rotateY}deg);"
            >
              <img class="share-preview-img" src={imgPreview} alt="Flex Card Preview" />
              <div class="share-preview-badge" style="border: 1px solid {activeTheme.accent}50; color:{activeTheme.accent};">
                {activeTheme.badge} PREVIEW (3D INTERACTIVE)
              </div>
            </div>

            {#if copyFeedback}
              <div class="share-clipboard-status">✨ High-Res PNG Image copied to Clipboard! Ready to paste into Discord/X.</div>
            {/if}

            <div>
              <div class="share-label">Share Post Template</div>
              <textarea class="share-textarea" bind:value={templateText}></textarea>
            </div>

            <!-- Action Grid -->
            <div class="share-buttons">
              <button class="share-btn share-btn-copy" on:click={copyImageToClipboard}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy Image
              </button>
              <button class="share-btn share-btn-download" on:click={() => shareToPlatform('download')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Download HD PNG
              </button>
              <button class="share-btn share-btn-twitter" on:click={() => shareToPlatform('twitter')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </button>
              <button class="share-btn share-btn-reddit" on:click={() => shareToPlatform('reddit')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.23.73 4.29 1.97 5.95l-1.39 4.16c-.1.31.18.61.5.5l4.16-1.39C8.89 21.68 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.19 12.35c-.44.44-1.15.44-1.59 0L12 11.76l-2.6 2.6c-.44.44-1.15.44-1.59 0-.44-.44-.44-1.15 0-1.59l2.6-2.6-2.6-2.6c-.44-.44-.44-1.15 0-1.59.44-.44 1.15-.44 1.59 0l2.6 2.6 2.6-2.6c.44-.44 1.15-.44 1.59 0 .44.44.44 1.15 0 1.59l-2.6 2.6 2.6 2.6c.44.44.44 1.15 0 1.59z"/></svg>
                Reddit
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .share-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(8px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .share-modal-overlay.open { display: flex; }

  .share-modal {
    max-width: 720px;
    width: 95%;
    background: linear-gradient(180deg, #0d0d12 0%, #050508 100%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 70px rgba(0,0,0,0.9);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .share-modal-title {
    color: #fff;
    font-size: 19px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .share-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 20px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .share-modal-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

  .share-modal-body {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 78vh;
    overflow-y: auto;
  }

  .theme-bar-wrap, .toggle-bar-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-bar-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 1px;
    font-weight: 700;
  }

  .theme-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .theme-pill {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .theme-pill:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }

  .theme-pill.active {
    background: rgba(255,255,255,0.12);
    border-color: var(--t-border);
    color: #fff;
    box-shadow: 0 0 12px var(--t-accent);
  }

  .theme-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .toggle-pills {
    display: flex;
    gap: 8px;
  }

  .toggle-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    padding: 5px 10px;
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: rgba(62,207,142,0.15);
    border-color: rgba(62,207,142,0.4);
    color: #3ecf8e;
  }

  .share-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 16px;
  }

  .share-loading-txt {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #fa4454;
    letter-spacing: 1px;
  }

  .share-loaded {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .share-preview-wrap {
    position: relative;
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.4);
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    transition: transform 0.15s ease-out;
    transform-style: preserve-3d;
  }

  .share-preview-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .share-preview-badge {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(6px);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .share-clipboard-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
    background: rgba(62, 207, 142, 0.1);
    border: 1px solid rgba(62, 207, 142, 0.3);
    padding: 8px;
    border-radius: 8px;
  }

  .share-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .share-textarea {
    width: 100%;
    height: 70px;
    background: #121217;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #fff;
    resize: none;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .share-textarea:focus { border-color: rgba(250,68,84,0.5); }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .share-btn {
    border: none;
    border-radius: 8px;
    padding: 11px 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .share-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .share-btn-copy { background: linear-gradient(135deg, #3ecf8e 0%, #10b981 100%); color: #000; }
  .share-btn-download { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; }
  .share-btn-twitter { background: #1d9bf0; color: #fff; }
  .share-btn-reddit { background: #ff4500; color: #fff; }

  .share-spinner {
    width: 34px;
    height: 34px;
    border: 2.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: share-spin 0.7s linear infinite;
  }
  @keyframes share-spin { to { transform: rotate(360deg); } }
</style>

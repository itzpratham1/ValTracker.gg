<script>
  import { onMount, onDestroy } from 'svelte';
  import { escapeHtml } from '../../lib/utils';
  import { playSound } from '../../lib/audio';

  export let playerName = '';
  export let playerTag = '';
  export let region = '';
  export let mode = '';
  export let visible = false;
  export let onCancel = null;

  let progress = 5;
  let tipIndex = 0;
  let tipVisible = true;
  let progressInterval;
  let tipInterval;
  let timerInterval;

  let startTime = Date.now();
  let elapsedSeconds = '0.0';

  const VALORANT_LORE = [
    { tag: 'VALORANT LORE', text: 'Omen was once a human known as Viper\'s close companion before his transformation.' },
    { tag: 'VALORANT LORE', text: 'Jett\'s wind powers come from a mysterious artifact found in South Korea.' },
    { tag: 'VALORANT LORE', text: 'Sage can resurrect fallen allies using her ancient orb of life.' },
    { tag: 'VALORANT LORE', text: 'Cypher\'s surveillance tech was originally designed for corporate espionage.' },
    { tag: 'VALORANT LORE', text: 'Reyna feeds on the life force of defeated enemies to grow stronger.' },
    { tag: 'VALORANT LORE', text: 'Brimstone leads the VALORANT protocol from an orbiting command station.' },
    { tag: 'VALORANT LORE', text: 'Killjoy\'s turrets were originally built to protect her hometown in Berlin.' },
    { tag: 'VALORANT LORE', text: 'Phoenix\'s blaze abilities manifest from his fiery personality and London roots.' },
    { tag: 'VALORANT LORE', text: 'Sova hunts with precision — his owl drone is named "Grey War".' },
    { tag: 'VALORANT LORE', text: 'Viper\'s chemical compounds are derived from a rare Earth element.' },
    { tag: 'VALORANT LORE', text: 'Omen travels through a shadow realm between dimensions.' },
    { tag: 'VALORANT LORE', text: 'Astra harnesses the energies of the cosmos to control the battlefield.' },
    { tag: 'VALORANT LORE', text: 'KAY/O was built to lead an army against the Radiants.' },
    { tag: 'VALORANT LORE', text: 'Fade\'s nightmares are drawn from the fears of her targets.' },
    { tag: 'VALORANT LORE', text: 'Gekko\'s little creatures — Wingman, Dizzy, and Mosh — are bioengineered.' },
    { tag: 'VALORANT LORE', text: 'Chamber\'s weapons are custom-built from gold and advanced alloys.' },
    { tag: 'VALORANT LORE', text: 'Neon\'s bioelectric powers were developed in a secret Philippine lab.' },
    { tag: 'VALORANT LORE', text: 'Harbor controls water through an ancient artifact from the Indian coast.' },
    { tag: 'VALORANT LORE', text: 'Deadlock\'s barrier technology uses crystallized radianite energy.' },
    { tag: 'VALORANT LORE', text: 'Iso is a former underground fighter who found purpose in the VALORANT protocol.' },
    { tag: 'VALORANT LORE', text: 'Clove cheated death itself, returning as a vibrant force of nature.' },
    { tag: 'VALORANT LORE', text: 'Vyse weaves liquid metal into impenetrable defensive barriers.' },
    { tag: 'VALORANT LORE', text: 'Waylay bends time itself, moving faster than the human eye can follow.' },
    { tag: 'VALORANT LORE', text: 'Tejo\'s tactical expertise comes from decades of military service.' },
    { tag: 'VALORANT LORE', text: 'Miks orchestrates chaos with precise sonic manipulation.' }
  ];

  const VCT_ESPORTS = [
    { tag: 'VCT ESPORTS', text: 'Sentinels won VCT Masters Reykjavik 2021, becoming the first international champion.' },
    { tag: 'VCT ESPORTS', text: 'Paper Rex reached the finals of VCT Champions 2023 in Los Angeles.' },
    { tag: 'VCT ESPORTS', text: 'LOUD won VCT Champions 2022 in Istanbul, Brazil\'s first major title.' },
    { tag: 'VCT ESPORTS', text: 'Fnatic won VCT LOCK//IN 2023, the first event of the new partnership era.' },
    { tag: 'VCT ESPORTS', text: 'Evil Geniuses made a historic lower bracket run at VCT Champions 2023.' },
    { tag: 'VCT ESPORTS', text: 'EDward Gaming won VCT Champions 2024, China\'s first world championship.' },
    { tag: 'VCT ESPORTS', text: 'DRX is known for their disciplined, tactical approach to Valorant.' },
    { tag: 'VCT ESPORTS', text: '100 Thieves rebuilt their roster around star duelist Cryo in 2023.' },
    { tag: 'VCT ESPORTS', text: 'Team Heretics surprised everyone with a deep run at VCT Champions 2024.' },
    { tag: 'VCT ESPORTS', text: 'ZETA DIVISION built one of the largest fanbases in VCT Pacific.' },
    { tag: 'VCT ESPORTS', text: 'FunPlus Phoenix brought their Counter-Strike pedigree to Valorant.' },
    { tag: 'VCT ESPORTS', text: 'Leviatán\'s aggressive playstyle made them fan favorites in 2024.' },
    { tag: 'VCT ESPORTS', text: 'Karmine Corp quickly became a top contender after joining VCT EMEA.' },
    { tag: 'VCT ESPORTS', text: 'Gen.G emerged as a powerhouse in VCT Pacific during 2024.' },
    { tag: 'VCT ESPORTS', text: 'Trace Esports represented China with flair at multiple VCT events.' },
    { tag: 'VCT ESPORTS', text: 'FUT Esports built a roster of experienced veterans for the 2024 season.' },
    { tag: 'VCT ESPORTS', text: 'Bilibili Gaming brought fresh Chinese talent to the VCT circuit.' },
    { tag: 'VCT ESPORTS', text: 'FURIA became Brazil\'s rising hope in VCT Americas.' },
    { tag: 'VCT ESPORTS', text: 'Global Esports represented the South Asian region on the global stage.' },
    { tag: 'VCT ESPORTS', text: 'Nongshim RedForce brought Korean esports expertise to VCT Pacific.' },
    { tag: 'VCT ESPORTS', text: 'BBL Esports carved out a reputation as EMEA\'s underdog dark horse.' },
    { tag: 'VCT ESPORTS', text: 'XLG Esports emerged as a new force in the Chinese Valorant scene.' }
  ];

  const allTips = [...VALORANT_LORE, ...VCT_ESPORTS];

  $: if (visible) {
    startLoading();
  } else {
    stopLoading();
  }

  onMount(() => {
    tipIndex = Math.floor(Math.random() * allTips.length);
  });

  onDestroy(() => {
    clearInterval(progressInterval);
    clearInterval(tipInterval);
    clearInterval(timerInterval);
  });

  function startLoading() {
    progress = 5;
    tipIndex = Math.floor(Math.random() * allTips.length);
    tipVisible = true;

    startTime = Date.now();
    elapsedSeconds = '0.0';

    timerInterval = setInterval(() => {
      elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    }, 100);

    progressInterval = setInterval(() => {
      if (progress < 40) progress += Math.random() * 7 + 4;
      else if (progress < 75) progress += Math.random() * 4 + 2;
      else if (progress < 90) progress += Math.random() * 1 + 1;
    }, 300);

    tipInterval = setInterval(() => {
      tipVisible = false;
      setTimeout(() => {
        tipIndex = (tipIndex + 1) % allTips.length;
        tipVisible = true;
      }, 250);
    }, 4000);
  }

  function stopLoading() {
    clearInterval(progressInterval);
    clearInterval(tipInterval);
    clearInterval(timerInterval);
    progress = 100;
  }

  function handleCancel() {
    playSound('cancel');
    if (typeof onCancel === 'function') {
      onCancel();
    } else {
      window.location.href = '/login';
    }
  }

  $: currentTip = allTips[tipIndex] || allTips[0];

  $: stepText = progress < 30 
    ? 'CONNECTING TO RIOT GATEWAY...' 
    : progress < 60 
    ? 'COMPILING MATCH HISTORY & MMR...' 
    : progress < 85 
    ? 'ANALYZING HEADSHOT % & ACCURACY...' 
    : 'GENERATING STATS & INSIGHTS...';
</script>

{#if visible}
  <div class="loading-card">
    <div class="loading-scanlines"></div>

    <div class="loading-spinner">
      <svg viewBox="0 0 100 100" class="spinner-svg">
        <circle cx="50" cy="50" r="46" class="spinner-outer"></circle>
        <circle cx="50" cy="50" r="38" class="spinner-inner"></circle>
      </svg>
      <div class="spinner-icon">⚡</div>
    </div>

    <div class="loading-title">{stepText}</div>
    <div class="loading-subtitle">
      SYNCING <span class="loading-player">{escapeHtml(playerName)}#{escapeHtml(playerTag)}</span> [{escapeHtml(region)} · {escapeHtml(mode)}]
    </div>

    <div class="loading-progress">
      <div class="loading-progress-fill" style="width: {Math.min(progress, 100)}%"></div>
    </div>

    <!-- Stopwatch Telemetry & Cancel Control -->
    <div class="loading-controls-row">
      <div class="loading-telemetry">
        <span class="telemetry-pulse"></span>
        <span class="telemetry-label">ELAPSED:</span>
        <span class="telemetry-val">{elapsedSeconds}s</span>
      </div>

      <button type="button" class="loading-cancel-btn" on:click={handleCancel}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>Cancel & Search Again</span>
      </button>
    </div>

    <div class="loading-tip" class:tip-visible={tipVisible}>
      <div class="loading-tip-tag">{currentTip.tag}</div>
      <div class="loading-tip-text">{currentTip.text}</div>
    </div>

    <div class="loading-estimate">USUALLY TAKES 5–10 SECONDS TO COMPILE STATS</div>
  </div>
{/if}

<style>
  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    min-height: 400px;
    background: rgba(10, 10, 14, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius, 12px);
    position: relative;
    overflow: hidden;
    animation: loadingCardIn 0.4s ease;
  }

  @keyframes loadingCardIn {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }

  .loading-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(255, 255, 255, 0.01) 3px,
      rgba(255, 255, 255, 0.01) 4px
    );
    opacity: 0.45;
    pointer-events: none;
  }

  .loading-spinner {
    width: 80px;
    height: 80px;
    position: relative;
    margin-bottom: 20px;
  }

  .spinner-svg {
    width: 100%;
    height: 100%;
  }

  .spinner-outer {
    fill: none;
    stroke: var(--accent, #fa4454);
    stroke-width: 2;
    stroke-dasharray: 12 6;
    animation: spinCw 4s linear infinite;
    transform-origin: center;
  }

  .spinner-inner {
    fill: none;
    stroke: var(--loss, #f43f5e);
    stroke-width: 2;
    stroke-dasharray: 200;
    animation: spinCcw 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    transform-origin: center;
  }

  .spinner-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: var(--accent, #fa4454);
    animation: iconPulse 1.5s ease-in-out infinite;
  }

  @keyframes spinCw {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spinCcw {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }

  @keyframes iconPulse {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }

  .loading-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 20px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-bottom: 6px;
  }

  .loading-subtitle {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #a0a0ab);
    letter-spacing: 1.5px;
    margin-bottom: 24px;
  }

  .loading-player {
    color: var(--accent, #fa4454);
    font-weight: 700;
  }

  .loading-progress {
    width: 100%;
    max-width: 300px;
    height: 8px;
    border-radius: 0;
    margin: 0 auto 28px;
    transform: skewX(-15deg);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .loading-progress-fill {
    height: 100%;
    background: repeating-linear-gradient(
      90deg,
      var(--accent, #fa4454),
      var(--accent, #fa4454) 6px,
      transparent 6px,
      transparent 9px
    );
    border-radius: 0;
    box-shadow: 0 0 10px var(--accentdim, rgba(250, 68, 84, 0.15));
    transition: width 0.3s ease;
  }

  .loading-tip {
    background: rgba(5, 5, 8, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 16px 20px;
    height: 142px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    max-width: 340px;
    transition: opacity 0.25s ease;
    opacity: 0;
  }

  .loading-tip.tip-visible {
    opacity: 1;
  }

  .loading-tip-tag {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    color: var(--muted, #a0a0ab);
    border: 1px solid rgba(255, 255, 255, 0.09);
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 1.5px;
    align-self: flex-start;
    margin-bottom: 10px;
  }

  .loading-tip-text {
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    color: var(--text, #f4f4f7);
    font-weight: 500;
    line-height: 1.5;
  }

  .loading-estimate {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2, #5b5b66);
    margin-top: 18px;
    opacity: 0.75;
    letter-spacing: 0.5px;
  }

  /* Telemetry & Cancel Row */
  .loading-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    max-width: 340px;
    margin-bottom: 20px;
  }

  .loading-telemetry {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 4px 10px;
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
  }

  .telemetry-pulse {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
    animation: pulseGlow 1.2s infinite alternate;
  }

  .telemetry-label {
    color: #8b8b9a;
  }

  .telemetry-val {
    color: #10b981;
    font-weight: 700;
  }

  .loading-cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(250, 68, 84, 0.06);
    border: 1px solid rgba(250, 68, 84, 0.25);
    color: #fa4454;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
  }

  .loading-cancel-btn:hover {
    background: rgba(250, 68, 84, 0.18);
    border-color: rgba(250, 68, 84, 0.5);
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.2);
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    .loading-card {
      min-height: 320px;
      padding: 24px 12px;
    }
    .loading-spinner {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
    .loading-title {
      font-size: 17px;
      letter-spacing: 2px;
    }
    .loading-tip {
      height: 120px;
      padding: 12px 16px;
    }
    .loading-tip-text {
      font-size: 13px;
    }
    .loading-controls-row {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>

<script>
  import { onMount, onDestroy } from 'svelte';
  import SearchForm from '../landing/SearchForm.svelte';
  import Bookmarks from '../landing/Bookmarks.svelte';
  import RecentSearches from '../landing/RecentSearches.svelte';
  import Footer from '../shared/Footer.svelte';
  import { playSound, getMuted, setMuted } from '../../lib/audio';

  import { navigate } from 'astro:transitions/client';
  import { setPlayer } from '../../lib/appStore';

  let canvasRef;
  let animationId;
  let isMuted = false;
  let serverTime = '';
  let serverPing = '18ms';
  let tickerText = '>> VALTRACKER ONLINE // WAITING FOR USER INPUT... >> LIVE STATS UPLINK ACTIVE... >> SUPPORTING ALL VALORANT REGIONS... >> LEADERBOARDS & HISTORY SYNCHRONIZED...';

  function handleSelect(name, tag, region, mode) {
    playSound('submit');
    setPlayer({ name, tag, region, mode, fetching: true, loaded: false });
    const targetUrl = `/app?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&mode=${mode}`;
    if (typeof navigate === 'function') {
      navigate(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    setMuted(isMuted);
    if (!isMuted) playSound('click');
  }

  function playHoverSound() {
    playSound('hover');
  }

  onMount(() => {
    isMuted = getMuted();

    const timer = setInterval(() => {
      const now = new Date();
      serverTime = now.toUTCString().replace('GMT', 'UTC');
    }, 1000);

    const initAudio = () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      playSound('hover');
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);

    if (canvasRef) {
      const ctx = canvasRef.getContext('2d');
      let width = (canvasRef.width = window.innerWidth);
      let height = (canvasRef.height = window.innerHeight);

      const handleResize = () => {
        if (!canvasRef) return;
        width = canvasRef.width = window.innerWidth;
        height = canvasRef.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      const particles = [];
      const particleCount = 40;

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * width;
          this.y = height + Math.random() * 100;
          this.size = Math.random() * 2 + 0.5;
          this.speedY = Math.random() * 1.0 + 0.3;
          this.speedX = (Math.random() - 0.5) * 0.5;
          this.opacity = Math.random() * 0.5 + 0.15;
          this.pulseSpeed = Math.random() * 0.018 + 0.005;
          this.pulseDir = Math.random() > 0.5 ? 1 : -1;
          this.color = Math.random() > 0.35 ? '250, 68, 84' : '232, 255, 71';
        }
        update() {
          this.y -= this.speedY;
          this.x += this.speedX;
          this.opacity += this.pulseSpeed * this.pulseDir;
          if (this.opacity > 0.75) this.pulseDir = -1;
          if (this.opacity < 0.1) this.pulseDir = 1;
          if (this.y < -10 || this.x < -10 || this.x > width + 10) this.reset();
        }
        draw() {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - this.size);
          ctx.lineTo(this.x + this.size, this.y);
          ctx.lineTo(this.x, this.y + this.size);
          ctx.lineTo(this.x - this.size, this.y);
          ctx.closePath();
          ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
          ctx.shadowBlur = this.size * 3;
          ctx.shadowColor = `rgba(${this.color}, 0.6)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      for (let i = 0; i < particleCount; i++) particles.push(new Particle());

      let scanlineY = 0;
      const animate = () => {
        if (!canvasRef) return;
        ctx.fillStyle = 'rgba(4, 4, 7, 0.18)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
        ctx.lineWidth = 1;
        const gs = 70;
        for (let x = 0; x < width; x += gs) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gs) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        particles.forEach(p => { p.update(); p.draw(); });

        scanlineY += 1.2;
        if (scanlineY > height) scanlineY = 0;
        ctx.beginPath();
        ctx.moveTo(0, scanlineY);
        ctx.lineTo(width, scanlineY);
        ctx.strokeStyle = 'rgba(250, 68, 84, 0.04)';
        ctx.lineWidth = 2;
        ctx.stroke();

        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
      };
    }

    return () => { clearInterval(timer); };
  });
</script>

<div class="lv-root">
  <canvas bind:this={canvasRef} class="lv-canvas"></canvas>

  <div class="lv-corners" aria-hidden="true">
    <div class="lv-corner tl"></div>
    <div class="lv-corner tr"></div>
    <div class="lv-corner bl"></div>
    <div class="lv-corner br"></div>
  </div>

  <div class="lv-topbar">
    <div class="lv-topbar-left">
      <div class="lv-status-pill">
        <span class="lv-pulse"></span>
        <span class="lv-mono lv-green">SYSTEM: ONLINE</span>
      </div>
      <span class="lv-mono lv-dim lv-hide-sm">SECURE LINK // PING: <span class="lv-red">{serverPing}</span></span>
    </div>
    <div class="lv-topbar-right">
      <span class="lv-mono lv-dim lv-hide-sm">{serverTime || 'CONNECTING...'}</span>
      <button class="lv-mute-btn" on:click={toggleMute} on:mouseenter={playHoverSound} title={isMuted ? 'Unmute Sounds' : 'Mute Sounds'}>
        {#if isMuted}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z" stroke-dasharray="4"></path>
          </svg>
        {:else}
          <svg class="lv-wave-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Ambient glow behind search card -->
  <div class="lv-ambient-glow" aria-hidden="true"></div>

  <div class="lv-main">
    <div class="lv-hero lv-anim-hero">
      <div class="lv-logo-row">
        <div class="lv-logo-glow-wrap">
          <img src="/logo.png" class="lv-logo-img lv-logo-glitch" alt="ValTracker" />
        </div>
        <h1 class="lv-logo-text">ValTracker</h1>
      </div>
      <div class="lv-tagline-row lv-anim-tagline">
        <div class="lv-tagline-line"></div>
        <div class="lv-tagline-center">
          <span class="lv-tagline-dot"></span>
          <span class="lv-tagline">Valorant Stats Tracker</span>
          <span class="lv-tagline-dot"></span>
        </div>
        <div class="lv-tagline-line"></div>
      </div>
    </div>

    <div class="lv-search-wrap lv-anim-card">
      <!-- animated scan sweep line -->
      <div class="lv-card-sweep" aria-hidden="true"></div>
      <SearchForm onSearch={handleSelect} />
    </div>

    <div class="lv-history-wrap">
      <div class="lv-history-panel lv-anim-panel1">
        <div class="lv-panel-header">
          <span class="lv-panel-dot gold"></span>
          <span class="lv-panel-title">Bookmarked Players</span>
        </div>
        <div class="lv-panel-body">
          <Bookmarks onSelect={handleSelect} />
        </div>
      </div>

      <div class="lv-history-panel lv-anim-panel2">
        <div class="lv-panel-header">
          <span class="lv-panel-dot red"></span>
          <span class="lv-panel-title">Recent Searches</span>
        </div>
        <div class="lv-panel-body">
          <RecentSearches onSelect={handleSelect} />
        </div>
      </div>
    </div>

    <Footer />
  </div>

  <div class="lv-ticker" aria-hidden="true">
    <div class="lv-ticker-track">
      <span class="lv-ticker-text">{tickerText}</span>
      <span class="lv-ticker-text">{tickerText}</span>
    </div>
  </div>
</div>

<style>
  .lv-root {
    position: relative;
    min-height: 100vh;
    width: 100%;
    background-color: #040407;
    overflow-x: clip;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 56px 20px 62px;
    box-sizing: border-box;
  }

  .lv-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  /* ── AMBIENT GLOW ── */
  .lv-ambient-glow {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 400px;
    background: radial-gradient(ellipse at center,
      rgba(250, 68, 84, 0.06) 0%,
      rgba(250, 68, 84, 0.02) 40%,
      transparent 70%);
    pointer-events: none;
    z-index: 1;
    animation: lvGlowPulse 6s ease-in-out infinite alternate;
  }

  @keyframes lvGlowPulse {
    from { opacity: 0.6; transform: translateX(-50%) scale(1); }
    to   { opacity: 1;   transform: translateX(-50%) scale(1.08); }
  }

  .lv-corners {
    position: fixed;
    inset: 14px;
    pointer-events: none;
    z-index: 1;
    animation: lvCornersIn 1.2s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes lvCornersIn {
    from { opacity: 0; transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1); }
  }

  .lv-corner {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 1.5px solid rgba(250, 68, 84, 0.3);
  }

  .tl { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 3px; }
  .tr { top: 0; right: 0; border-left: none; border-bottom: none; border-top-right-radius: 3px; }
  .bl { bottom: 0; left: 0; border-right: none; border-top: none; border-bottom-left-radius: 3px; }
  .br { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 3px; }

  .lv-topbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 46px;
    background: rgba(6, 6, 10, 0.9);
    border-bottom: 1px solid rgba(250, 68, 84, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    z-index: 50;
    backdrop-filter: blur(14px);
    box-sizing: border-box;
  }

  .lv-topbar-left,
  .lv-topbar-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .lv-mono {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.2px;
  }

  .lv-dim { color: #5a5a6a; }
  .lv-green { color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.4); }
  .lv-red { color: #fa4454; text-shadow: 0 0 8px rgba(250,68,84,0.4); }

  .lv-status-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(16,185,129,0.06);
    border: 1px solid rgba(16,185,129,0.2);
    padding: 3px 10px;
    border-radius: 4px;
  }

  .lv-pulse {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
    animation: lvPulse 1.5s infinite alternate;
    flex-shrink: 0;
  }

  @keyframes lvPulse {
    from { opacity: 0.4; transform: scale(0.85); }
    to   { opacity: 1;   transform: scale(1.1);  }
  }

  .lv-mute-btn {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .lv-mute-btn svg { width: 15px; height: 15px; }

  .lv-mute-btn:hover {
    background: rgba(250,68,84,0.12);
    border-color: rgba(250,68,84,0.35);
    color: #fa4454;
  }

  .lv-wave-icon { animation: lvWave 1s infinite alternate; }
  @keyframes lvWave {
    from { transform: scale(1); }
    to   { transform: scale(1.07); }
  }

  .lv-main {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-top: 20px;
    padding-bottom: 0;
  }

  .lv-hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .lv-logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .lv-logo-glow-wrap {
    display: flex;
    align-items: center;
  }

  .lv-logo-img {
    height: 52px;
    width: auto;
    filter: drop-shadow(0 0 18px rgba(250,68,84,0.7));
    animation: lvFloat 4s ease-in-out infinite;
  }

  /* Subtle glitch flicker on the logo icon */
  .lv-logo-glitch {
    animation: lvFloat 4s ease-in-out infinite, lvGlitch 8s 2s infinite;
  }

  @keyframes lvFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }

  @keyframes lvGlitch {
    0%,94%,100% {
      filter: drop-shadow(0 0 18px rgba(250,68,84,0.7));
      transform: translateY(0);
    }
    95% {
      filter: drop-shadow(0 0 18px rgba(250,68,84,0.7)) drop-shadow(-3px 0 rgba(232,255,71,0.7));
      transform: translateY(-2px) skewX(-2deg);
    }
    96% {
      filter: drop-shadow(0 0 18px rgba(250,68,84,0.7)) drop-shadow(3px 0 rgba(250,68,84,0.7));
      transform: translateY(1px) skewX(1deg);
    }
    97% {
      filter: drop-shadow(0 0 18px rgba(250,68,84,0.7));
      transform: translateY(0);
    }
  }

  .lv-logo-text {
    font-family: 'Barlow Condensed', 'Rajdhani', sans-serif;
    font-weight: 900;
    font-size: 52px;
    letter-spacing: 4px;
    color: #fff;
    text-transform: uppercase;
    margin: 0;
    text-shadow: 0 4px 24px rgba(0,0,0,0.6);
    line-height: 1;
  }

  /* ── TAGLINE ── */
  .lv-tagline-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    max-width: 360px;
  }

  .lv-tagline-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(250,68,84,0.4), transparent);
  }

  .lv-tagline-center {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .lv-tagline-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #fa4454;
    box-shadow: 0 0 4px rgba(250,68,84,0.6);
    flex-shrink: 0;
  }

  .lv-tagline {
    font-family: 'DM Mono', monospace;
    font-size: 9.5px;
    color: #9090a4;
    letter-spacing: 3px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── STAGGERED ENTRY ANIMATIONS ── */
  .lv-anim-hero {
    animation: lvSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both;
  }
  .lv-anim-tagline {
    animation: lvFadeIn 0.6s ease 0.35s both;
  }
  .lv-anim-card {
    animation: lvSlideUp 0.75s cubic-bezier(0.22,1,0.36,1) 0.28s both;
  }
  .lv-anim-panel1 {
    animation: lvSlideUp 0.65s cubic-bezier(0.22,1,0.36,1) 0.48s both;
  }
  .lv-anim-panel2 {
    animation: lvSlideUp 0.65s cubic-bezier(0.22,1,0.36,1) 0.58s both;
  }

  @keyframes lvSlideUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes lvFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── SEARCH WRAP ── */
  .lv-search-wrap {
    width: 100%;
    position: relative;
    border-radius: 14px;
    overflow: hidden;
  }

  /* Animated scan sweep bar that rides across the top of the card */
  .lv-card-sweep {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(250,68,84,0.0) 20%,
      rgba(250,68,84,0.8) 50%,
      rgba(232,255,71,0.5) 60%,
      transparent 80%);
    border-radius: 14px 14px 0 0;
    z-index: 10;
    animation: lvSweep 4s cubic-bezier(0.4,0,0.6,1) infinite;
    pointer-events: none;
  }

  @keyframes lvSweep {
    0%   { transform: translateX(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(100%); opacity: 0; }
  }

  .lv-search-wrap :global(.search-form-card) {
    background: rgba(10,10,16,0.82) !important;
    border: 1px solid rgba(250,68,84,0.18) !important;
    border-radius: 14px !important;
    box-shadow:
      0 20px 60px rgba(0,0,0,0.55),
      inset 0 0 30px rgba(250,68,84,0.04),
      0 0 0 1px rgba(255,255,255,0.03) !important;
    backdrop-filter: blur(20px) !important;
    padding: 32px 28px !important;
    position: relative !important;
    overflow: hidden !important;
    transition: box-shadow 0.35s ease, border-color 0.35s ease !important;
  }

  /* Glow up on any input focus inside the card */
  .lv-search-wrap:focus-within :global(.search-form-card) {
    border-color: rgba(250,68,84,0.35) !important;
    box-shadow:
      0 24px 72px rgba(0,0,0,0.6),
      inset 0 0 40px rgba(250,68,84,0.07),
      0 0 0 1px rgba(250,68,84,0.1) !important;
  }

  .lv-search-wrap :global(.sf-title) {
    font-size: 22px !important;
    letter-spacing: 3px !important;
    margin-bottom: 6px !important;
  }

  .lv-history-wrap {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .lv-history-panel {
    background: rgba(9,9,14,0.78);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease;
    will-change: transform;
  }

  .lv-history-panel:hover {
    border-color: rgba(250,68,84,0.28);
    transform: translateY(-3px);
    box-shadow:
      0 20px 48px rgba(0,0,0,0.5),
      0 0 0 1px rgba(250,68,84,0.12),
      inset 0 0 20px rgba(250,68,84,0.04);
  }

  .lv-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(250,68,84,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .lv-panel-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lv-panel-dot.gold {
    background: #e8ff47;
    box-shadow: 0 0 6px #e8ff47;
    animation: lvPulse 1.8s infinite alternate;
  }

  .lv-panel-dot.red {
    background: #fa4454;
    box-shadow: 0 0 6px #fa4454;
    animation: lvPulse 2s infinite alternate;
  }

  .lv-panel-title {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #9a9aaa;
  }

  .lv-panel-body {
    padding: 12px 14px;
  }

  .lv-panel-body :global(.bookmarks-section),
  .lv-panel-body :global(.recent-section) {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }

  .lv-panel-body :global(.bm-header),
  .lv-panel-body :global(.rs-header) {
    display: none !important;
  }

  .lv-ticker {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 26px;
    background: rgba(6,6,10,0.96);
    border-top: 1px solid rgba(250,68,84,0.15);
    z-index: 50;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .lv-ticker-track {
    display: flex;
    white-space: nowrap;
    animation: lvTicker 35s linear infinite;
  }

  .lv-ticker-text {
    font-family: 'DM Mono', monospace;
    font-size: 8.5px;
    color: rgba(250,68,84,0.55);
    letter-spacing: 2px;
    padding-right: 80px;
    display: inline-block;
  }

  @keyframes lvTicker {
    0%   { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-50%, 0, 0); }
  }

  .lv-hide-sm { display: flex; }

  @media (max-width: 700px) {
    .lv-history-wrap { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .lv-hide-sm { display: none !important; }
    .lv-root { padding: 52px 12px 60px; }
    .lv-logo-img { height: 38px; }
    .lv-logo-text { font-size: 36px; letter-spacing: 2px; }
    .lv-tagline { font-size: 8.5px; letter-spacing: 2px; }
    .lv-main { gap: 16px; margin-top: 10px; }
    .lv-search-wrap :global(.search-form-card) {
      padding: 20px 16px !important;
      border-radius: 12px !important;
    }
    .lv-search-wrap :global(.sf-title) {
      font-size: 18px !important;
      letter-spacing: 2px !important;
    }
    .lv-history-panel { border-radius: 10px; }
    .lv-ticker {
      height: calc(24px + env(safe-area-inset-bottom, 0px));
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  @media (max-width: 400px) {
    .lv-logo-row { gap: 10px; }
    .lv-logo-img { height: 32px; }
    .lv-logo-text { font-size: 30px; }
  }
</style>

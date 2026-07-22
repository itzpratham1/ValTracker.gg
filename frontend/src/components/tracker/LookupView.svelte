<script>
  import { onMount, onDestroy } from 'svelte';
  import SearchForm from '../landing/SearchForm.svelte';
  import Bookmarks from '../landing/Bookmarks.svelte';
  import RecentSearches from '../landing/RecentSearches.svelte';
  import { playSound, getMuted, setMuted } from '../../lib/audio';

  let canvasRef;
  let animationId;
  let isMuted = false;
  let serverTime = '';
  let serverPing = '18ms';
  let tickerText = '>> VALTRACKER ONLINE // WAITING FOR USER INPUT... >> LIVE STATS UPLINK ACTIVE... >> SUPPORTING ALL VALORANT REGIONS... >> LEADERBOARDS & HISTORY SYNCHRONIZED...';

  function handleSelect(name, tag, region, mode) {
    playSound('submit');
    // Short delay for sound effect to play
    setTimeout(() => {
      window.location.href = `/app?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&mode=${mode}`;
    }, 150);
  }

  function toggleMute() {
    isMuted = !isMuted;
    setMuted(isMuted);
    if (!isMuted) {
      playSound('click');
    }
  }

  function playHoverSound() {
    playSound('hover');
  }

  onMount(() => {
    isMuted = getMuted();

    // Time ticker
    const timer = setInterval(() => {
      const now = new Date();
      serverTime = now.toUTCString().replace('GMT', 'UTC');
    }, 1000);

    // Audio init gesture
    const initAudio = () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      playSound('hover');
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);

    // Canvas particle effect (Radianite sparks)
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
      const particleCount = 45;

      class Particle {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * width;
          this.y = height + Math.random() * 100;
          this.size = Math.random() * 2.5 + 0.5;
          this.speedY = Math.random() * 1.2 + 0.3;
          this.speedX = (Math.random() - 0.5) * 0.6;
          this.opacity = Math.random() * 0.5 + 0.2;
          this.pulseSpeed = Math.random() * 0.02 + 0.005;
          this.pulseDir = Math.random() > 0.5 ? 1 : -1;
          this.radianiteColor = Math.random() > 0.3 ? '250, 68, 84' : '232, 255, 71'; // Red or Yellow accent sparks
        }
        update() {
          this.y -= this.speedY;
          this.x += this.speedX;
          this.opacity += this.pulseSpeed * this.pulseDir;
          if (this.opacity > 0.8) this.pulseDir = -1;
          if (this.opacity < 0.1) this.pulseDir = 1;

          if (this.y < -10 || this.x < -10 || this.x > width + 10) {
            this.reset();
          }
        }
        draw() {
          ctx.beginPath();
          // Draw diamond style sparks for a gamified tech feel
          ctx.moveTo(this.x, this.y - this.size);
          ctx.lineTo(this.x + this.size, this.y);
          ctx.lineTo(this.x, this.y + this.size);
          ctx.lineTo(this.x - this.size, this.y);
          ctx.closePath();
          ctx.fillStyle = `rgba(${this.radianiteColor}, ${this.opacity})`;
          ctx.shadowBlur = this.size * 2;
          ctx.shadowColor = `rgba(${this.radianiteColor}, 0.5)`;
          ctx.fill();
          ctx.shadowBlur = 0; // reset shadow
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }

      // Scanner scan line
      let scanlineY = 0;

      const animate = () => {
        if (!canvasRef) return;
        ctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; // slow trail
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid Backdrop
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Floating particle updates
        particles.forEach((p) => {
          p.update();
          p.draw();
        });

        // Slow horizontal scan line
        scanlineY += 1.5;
        if (scanlineY > height) scanlineY = 0;
        ctx.beginPath();
        ctx.moveTo(0, scanlineY);
        ctx.lineTo(width, scanlineY);
        ctx.strokeStyle = 'rgba(250, 68, 84, 0.05)';
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

    return () => {
      clearInterval(timer);
    };
  });
</script>

<div class="lookup-root">
  <!-- Dynamic Canvas Background -->
  <canvas bind:this={canvasRef} class="lookup-canvas"></canvas>

  <!-- Top Tactical HUD -->
  <div class="hud-top-bar">
    <div class="hud-left">
      <div class="hud-terminal-pill">
        <span class="hud-pulse"></span>
        <span class="hud-mono text-glow-green">SYSTEM: ONLINE</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-mono hud-hidden-mobile">
        SECURE LINK // PING: <span class="text-glow-red">{serverPing}</span>
      </div>
    </div>

    <div class="hud-right">
      <div class="hud-mono hud-hidden-mobile">{serverTime || 'CONNECTING...'}</div>
      <div class="hud-divider hud-hidden-mobile"></div>
      <button 
        class="hud-sound-toggle" 
        on:click={toggleMute} 
        on:mouseenter={playHoverSound}
        title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
      >
        {#if isMuted}
          <svg class="sound-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z" stroke-dasharray="4"></path>
          </svg>
        {:else}
          <svg class="sound-icon pulsing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Decorative Corner Notches -->
  <div class="lookup-corners">
    <div class="lookup-corner tl"></div>
    <div class="lookup-corner tr"></div>
    <div class="lookup-corner bl"></div>
    <div class="lookup-corner br"></div>
  </div>

  <!-- Ambient Diagonal Striping -->
  <div class="lookup-decorations">
    <div class="deco-crosshair cx1">+</div>
    <div class="deco-crosshair cx2">+</div>
    <div class="deco-bracket br1">[ PLAYER SEARCH ]</div>
    <div class="deco-stripe"></div>
  </div>

  <div class="lookup-container">
    <div class="lookup-header-block">
      <h1 class="lookup-logo-wrap">
        <div class="logo-box">
          <img src="/logo.png" class="logo-icon" alt="ValTracker Logo">
          <div class="logo-glitch-line"></div>
        </div>
        <span class="logo-text">ValTracker</span>
      </h1>
      <div class="lookup-tagline-wrap">
        <span class="tagline-brackets">[</span>
        <span class="lookup-tagline">Valorant Stats Tracker</span>
        <span class="tagline-brackets">]</span>
      </div>
    </div>

    <div class="lookup-columns-wrap">
      <div class="lookup-card console-card search-area-card">
        <div class="card-tech-header">
          <span class="card-tech-dot"></span>
          <span class="card-tech-title">Search Console</span>
          <span class="card-tech-tag">Search</span>
        </div>
        <SearchForm onSearch={handleSelect} />
      </div>

      <div class="lookup-card console-card dossier-area-card">
        <div class="card-tech-header">
          <span class="card-tech-dot green-dot"></span>
          <span class="card-tech-title">Saved Profiles & History</span>
          <span class="card-tech-tag">Quick Access</span>
        </div>
        <div class="history-card-inner">
          <Bookmarks onSelect={handleSelect} />
          <RecentSearches onSelect={handleSelect} />
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Marquee Status Ticker -->
  <div class="hud-bottom-ticker">
    <div class="ticker-wrapper">
      <div class="ticker-content">{tickerText}</div>
      <div class="ticker-content" aria-hidden="true">{tickerText}</div>
    </div>
  </div>
</div>

<style>
  .lookup-root {
    position: relative;
    min-height: 100vh;
    width: 100%;
    background-color: #050508;
    overflow-x: clip;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px 20px 40px;
    box-sizing: border-box;
  }

  .lookup-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  /* ── HUD TOP BAR ── */
  .hud-top-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 48px;
    background: rgba(8, 8, 12, 0.85);
    border-bottom: 1px solid rgba(255, 70, 85, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    z-index: 10;
    backdrop-filter: blur(12px);
    box-sizing: border-box;
  }

  .hud-left, .hud-right {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 11px;
    letter-spacing: 1.5px;
  }

  .hud-mono {
    font-family: 'DM Mono', monospace;
    color: #8b8b9a;
  }

  .text-glow-green {
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  }

  .text-glow-red {
    color: #fa4454;
    text-shadow: 0 0 8px rgba(250, 68, 84, 0.4);
  }

  .hud-terminal-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 3px 10px;
    border-radius: 4px;
  }

  .hud-pulse {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
    animation: pulseGlow 1.5s infinite alternate;
  }

  @keyframes pulseGlow {
    from { opacity: 0.4; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1.1); }
  }

  .hud-divider {
    width: 1px;
    height: 16px;
    background-color: rgba(255, 255, 255, 0.15);
  }

  .hud-center {
    display: flex;
    justify-content: center;
  }

  .hud-episode-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 13px;
    color: #fff;
    letter-spacing: 2px;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
  }

  .hud-sound-toggle {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: var(--transition, all 0.2s);
  }

  .hud-sound-toggle:hover {
    background: rgba(250, 68, 84, 0.15);
    border-color: rgba(250, 68, 84, 0.4);
    color: #fa4454;
  }

  .sound-icon {
    width: 16px;
    height: 16px;
  }

  .pulsing-icon {
    animation: iconWave 1s infinite alternate;
  }

  @keyframes iconWave {
    from { transform: scale(1); }
    to { transform: scale(1.06); }
  }

  /* ── CORNER BRACKETS ── */
  .lookup-corners {
    position: fixed;
    inset: 15px;
    pointer-events: none;
    z-index: 1;
  }

  .lookup-corner {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid rgba(250, 68, 84, 0.35);
  }

  .tl { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 4px; }
  .tr { top: 0; right: 0; border-left: none; border-bottom: none; border-top-right-radius: 4px; }
  .bl { bottom: 0; left: 0; border-right: none; border-top: none; border-bottom-left-radius: 4px; }
  .br { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 4px; }

  /* ── DECORATIVE ELEMENTS ── */
  .lookup-decorations {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  }

  .deco-crosshair {
    position: absolute;
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: rgba(250, 68, 84, 0.2);
    animation: driftCrosshair 20s infinite alternate linear;
  }

  .cx1 { top: 12%; left: 8%; }
  .cx2 { bottom: 15%; right: 10%; }

  .deco-bracket {
    position: absolute;
    top: 75px;
    right: 5%;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(232, 255, 71, 0.3);
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .deco-bracket::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #e8ff47;
    border-radius: 50%;
    animation: pulseGlow 1s infinite alternate;
  }

  @keyframes driftCrosshair {
    0% { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(15px, 20px) rotate(180deg); }
  }

  .deco-stripe {
    position: absolute;
    bottom: -150px;
    left: -150px;
    width: 400px;
    height: 400px;
    background: repeating-linear-gradient(45deg, rgba(250, 68, 84, 0.01) 0px, rgba(250, 68, 84, 0.01) 2px, transparent 2px, transparent 15px);
    transform: rotate(15deg);
  }

  /* ── MAIN CONTENT CONTAINER ── */
  .lookup-container {
    position: relative;
    max-width: 960px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
    margin-top: 15px;
    margin-bottom: 20px;
  }

  .lookup-header-block {
    text-align: center;
    margin-bottom: 36px;
    position: relative;
  }

  .lookup-logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 52px;
    letter-spacing: 4px;
    color: #fff;
    text-transform: uppercase;
  }

  .logo-box {
    position: relative;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-box img {
    height: 56px;
    width: auto;
    filter: drop-shadow(0 0 16px rgba(250, 68, 84, 0.7));
    animation: logoFloat 4s ease-in-out infinite;
  }

  @keyframes logoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .logo-text {
    background: linear-gradient(135deg, #fff 20%, #fa4454 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(250, 68, 84, 0.15);
    letter-spacing: 3px;
  }

  .lookup-tagline-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .tagline-brackets {
    font-family: 'DM Mono', monospace;
    font-weight: bold;
    font-size: 14px;
    color: rgba(250, 68, 84, 0.6);
  }

  .lookup-tagline {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #c4c4d4;
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  /* ── COLUMN LAYOUT ── */
  .lookup-columns-wrap {
    display: flex;
    gap: 24px;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .lookup-card {
    margin: 0;
    flex: 1;
    min-width: 320px;
    max-width: 460px;
    position: relative;
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  /* Gamified Holographic Tech Border Styles */
  .console-card {
    background: rgba(10, 10, 15, 0.75);
    border: 1px solid rgba(250, 68, 84, 0.15);
    border-radius: 12px;
    box-shadow: 
      0 16px 40px rgba(0, 0, 0, 0.5),
      inset 0 0 20px rgba(250, 68, 84, 0.05);
    backdrop-filter: blur(16px);
    overflow: hidden;
  }

  .console-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(250, 68, 84, 0.7), transparent);
    animation: scanBarHorizontal 3s infinite linear;
  }

  @keyframes scanBarHorizontal {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .card-tech-header {
    background: rgba(250, 68, 84, 0.04);
    border-bottom: 1px solid rgba(250, 68, 84, 0.15);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-tech-dot {
    width: 6px;
    height: 6px;
    background-color: #fa4454;
    border-radius: 50%;
    box-shadow: 0 0 6px #fa4454;
    display: inline-block;
  }

  .green-dot {
    background-color: #e8ff47;
    box-shadow: 0 0 6px #e8ff47;
  }

  .card-tech-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #e0e0ea;
    letter-spacing: 1px;
    flex: 1;
    margin-left: 10px;
  }

  .card-tech-tag {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 1px;
    color: rgba(250, 68, 84, 0.6);
    border: 1px solid rgba(250, 68, 84, 0.25);
    padding: 1px 6px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .history-card-inner {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 400px;
    box-sizing: border-box;
  }

  /* Overrides for SearchForm container inside card to blend seamlessly */
  .lookup-card :global(.search-form-card) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 24px !important;
  }

  /* ── BOTTOM MARQUEE TICKER ── */
  .hud-bottom-ticker {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 28px;
    background: rgba(8, 8, 12, 0.95);
    border-top: 1px solid rgba(250, 68, 84, 0.2);
    z-index: 10;
    display: flex;
    align-items: center;
    overflow: hidden;
    box-sizing: border-box;
  }

  .ticker-wrapper {
    display: flex;
    white-space: nowrap;
    width: 100%;
  }

  .ticker-content {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(250, 68, 84, 0.65);
    letter-spacing: 2px;
    padding-right: 50px;
    animation: marqueeTicker 30s linear infinite;
    display: inline-block;
  }

  @keyframes marqueeTicker {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-100%, 0, 0); }
  }

  /* ── MOBILE BREAKPOINTS ── */
  @media (max-width: 800px) {
    .hud-hidden-mobile {
      display: none !important;
    }
  }

  @media (max-width: 480px) {
    .lookup-root {
      padding: 70px 10px 40px;
    }
    .lookup-logo-wrap {
      font-size: 38px;
      letter-spacing: 2px;
    }
    .logo-box img {
      height: 40px;
    }
    .lookup-tagline {
      font-size: 9px;
      letter-spacing: 2px;
    }
    .lookup-columns-wrap {
      gap: 16px;
    }
    .lookup-card {
      min-width: 100%;
    }
    .history-card-inner {
      padding: 16px;
    }
  }
</style>

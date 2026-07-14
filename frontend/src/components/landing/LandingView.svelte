<script>
  import SearchForm from './SearchForm.svelte';
  import Bookmarks from './Bookmarks.svelte';
  import RecentSearches from './RecentSearches.svelte';
  import LoadingCard from './LoadingCard.svelte';
  import { player, currentView } from '../../lib/appStore';

  let matchesCached = 530;

  fetch('/api/landing-stats')
    .then(r => r.json())
    .then(data => { if (data && data.matches_analysed) matchesCached = data.matches_analysed; })
    .catch(() => {});

  function scrollToSearch(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('landing-lookup-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function navigateToTab(tabId, e) {
    if (e) e.preventDefault();
    currentView.set(tabId);
    player.set({
      name: '',
      tag: '',
      region: 'ap',
      mode: 'competitive',
      act: 'v26a4',
      loaded: true,
      fetching: false
    });
    window.history.pushState({}, '', `/app#${tabId}`);
  }
</script>

<main class="landing-main">
  <!-- Hero -->
  <section class="landing-hero" id="hero">
    <div class="landing-hero-bg">
      <div class="landing-hero-grid"></div>
      <div class="landing-hero-glow"></div>
      <div class="landing-glow-orb orb-1"></div>
      <div class="landing-glow-orb orb-2"></div>
      <div class="landing-glow-orb orb-3"></div>
    </div>
    <div class="landing-hero-content">
      <div class="landing-eyebrow">
        <span class="landing-eyebrow-dot"></span>
        Free forever · No account needed
      </div>
      <h1 class="landing-headline">
        <span class="landing-headline-line">Stop Guessing.</span>
        <span class="landing-headline-line">Start Climbing.</span>
      </h1>
      <p class="landing-subtitle">
        Real-time Valorant stats, AI coaching, and live OBS overlays.
      </p>
      <a href="/app" class="landing-hero-btn" on:click={scrollToSearch}>
        Track Your Stats
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <p class="landing-hero-note">No account needed. Just your Riot ID.</p>
    </div>
  </section>

  <!-- Search + History Card -->
  <section class="landing-search-section">
    <div class="landing-search-wrap">
      <div id="landing-lookup-form">
        <SearchForm />
      </div>

      <div id="landing-history-card" class="landing-history-card">
        <Bookmarks />
        <RecentSearches />
      </div>

      <LoadingCard visible={false} />
    </div>
  </section>

  <!-- Ticker Bar -->
  <div class="landing-ticker">
    <div class="landing-ticker-track">
      <span>{matchesCached}+ Matches Cached</span>
      <span>·</span>
      <span>Free Forever</span>
      <span>·</span>
      <span>AI-Powered Coaching</span>
      <span>·</span>
      <span>OBS Ready</span>
      <span>·</span>
      <span>VCT Live Coverage</span>
      <span>·</span>
      <span>No Login Required</span>
      <span>·</span>
      <span>Real-Time Stats</span>
      <span>·</span>
      <span>Meta Comp Architect</span>
      <span>·</span>
      <!-- Duplicate for seamless loop -->
      <span>{matchesCached}+ Matches Cached</span>
      <span>·</span>
      <span>Free Forever</span>
      <span>·</span>
      <span>AI-Powered Coaching</span>
      <span>·</span>
      <span>OBS Ready</span>
      <span>·</span>
      <span>VCT Live Coverage</span>
      <span>·</span>
      <span>No Login Required</span>
      <span>·</span>
      <span>Real-Time Stats</span>
      <span>·</span>
      <span>Meta Comp Architect</span>
      <span>·</span>
    </div>
  </div>

  <!-- Features Bento Grid -->
  <section class="landing-section" id="features">
    <div class="landing-section-inner">
      <div class="landing-section-label">
        <span class="landing-section-eyebrow">Features</span>
        <div class="landing-section-line"></div>
      </div>
      <h2 class="landing-section-title">Everything You Need To Rank Up</h2>

      <div class="landing-bento-grid">
        <div class="landing-bento-card span-12 landing-bento-large">
          <span class="landing-card-tag">Core Feature</span>
          <div class="landing-card-img-frame">
            <img src="/stats_tracker_card.webp" alt="Stats Dashboard" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4 landing-bento-red-glow">
          <span class="landing-card-tag landing-card-tag-red">AI Powered</span>
          <div class="landing-card-img-frame">
            <img src="/Val_bot_analysis.webp" alt="ValBot AI Coach" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4">
          <span class="landing-card-tag">Deep Analysis</span>
          <div class="landing-card-img-frame">
            <img src="/deep_analysis.gif" alt="Self-Analysis Diagnostics" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4">
          <span class="landing-card-tag">Performance Lab</span>
          <div class="landing-card-img-frame">
            <img src="/perf_lab.gif" alt="Performance Diagnostics" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4">
          <span class="landing-card-tag">Unique</span>
          <div class="landing-card-img-frame landing-contain-fit">
            <img src="/obs_overlay.webp" alt="OBS Stream Overlay" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4">
          <span class="landing-card-tag">Strategy</span>
          <div class="landing-card-img-frame">
            <img src="/meta_comp.webp" alt="Meta Comp Architect" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-4">
          <span class="landing-card-tag">Browse</span>
          <div class="landing-card-img-frame">
            <img src="/skin_store.webp" alt="Skins Store" loading="lazy">
          </div>
        </div>
        <div class="landing-bento-card span-12 landing-bento-large">
          <span class="landing-card-tag landing-card-tag-red">Live</span>
          <div class="landing-card-img-frame">
            <img src="/VCT_Esports.webp" alt="VCT Esports Hub" loading="lazy">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="landing-cta-section" id="final-cta">
    <div class="landing-cta-card">
      <h2 class="landing-cta-title">Ready To See Your Real Stats?</h2>
      <p class="landing-cta-sub">No sign-up. Free forever. Built by a Valorant player.</p>
      <a href="/app" class="landing-hero-btn" on:click={scrollToSearch}>Track Now — It's Free</a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="landing-footer">
    <div class="landing-footer-inner">
      <div class="landing-footer-brand">
        <img src="/logo.png" alt="ValTracker" class="landing-footer-logo">
        <span>ValTracker</span>
        <p class="landing-footer-credit">Built by Pratham</p>
      </div>
      <nav class="landing-footer-nav">
        <a href="/app" on:click={scrollToSearch}>Tracker</a>
        <a href="/app#esports" on:click={(e) => navigateToTab('esports', e)}>VCT</a>
        <a href="/app#skins" on:click={(e) => navigateToTab('store', e)}>Skins</a>
        <a href="/app#meta" on:click={(e) => navigateToTab('coach', e)}>Meta Comp</a>
        <a href="/overlay" target="_blank">OBS Overlay</a>
      </nav>
      <div class="landing-footer-social">
        <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
    </div>
    <p class="landing-footer-disclaimer">
      ValTracker is not affiliated with Riot Games. Valorant and Riot Games are trademarks of Riot Games, Inc.
    </p>
  </footer>
</main>

<style>
  .landing-main {
    overflow: hidden;
  }

  /* ── Hero ── */
  .landing-hero {
    position: relative;
    min-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120px 24px 60px;
    overflow: hidden;
  }

  .landing-hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .landing-hero-grid {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background-image:
      linear-gradient(rgba(255, 70, 85, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 70, 85, 0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    transform: perspective(600px) rotateX(20deg);
    animation: gridDrift 20s linear infinite;
  }

  @keyframes gridDrift {
    from { background-position: 0 0; }
    to { background-position: 0 60px; }
  }

  .landing-hero-glow {
    position: absolute;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 70, 85, 0.12) 0%, transparent 70%);
    filter: blur(60px);
  }

  .landing-glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
  }

  .orb-1 {
    width: 300px;
    height: 300px;
    background: rgba(255, 70, 85, 0.15);
    top: 10%;
    left: 20%;
    animation: floatOrb1 12s ease-in-out infinite;
  }

  .orb-2 {
    width: 250px;
    height: 250px;
    background: rgba(120, 60, 200, 0.12);
    top: 40%;
    right: 15%;
    animation: floatOrb2 15s ease-in-out infinite;
  }

  .orb-3 {
    width: 200px;
    height: 200px;
    background: rgba(255, 70, 85, 0.1);
    bottom: 10%;
    left: 40%;
    animation: floatOrb3 10s ease-in-out infinite;
  }

  @keyframes floatOrb1 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, -20px); }
  }

  @keyframes floatOrb2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-25px, 15px); }
  }

  @keyframes floatOrb3 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(20px, -30px); }
  }

  .landing-hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 700px;
  }

  .landing-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 24px;
    padding: 6px 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.03);
  }

  .landing-eyebrow-dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 70, 85, 0.4); }
    50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(255, 70, 85, 0); }
  }

  .landing-headline {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: clamp(40px, 8vw, 72px);
    line-height: 1.05;
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .landing-headline-line {
    display: block;
  }

  .landing-headline-line:last-child {
    color: var(--accent);
  }

  .landing-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: var(--muted);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .landing-hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    padding: 14px 32px;
    background: linear-gradient(135deg, #ff4655, #e8334a);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 30px rgba(255, 70, 85, 0.35);
    transition: all 0.3s;
    text-decoration: none;
  }

  .landing-hero-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 40px rgba(255, 70, 85, 0.5);
  }

  .landing-hero-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .landing-hero-note {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted2);
    margin-top: 16px;
    letter-spacing: 0.5px;
  }

  /* ── Search Section ── */
  .landing-search-section {
    padding: 0 24px 60px;
    display: flex;
    justify-content: center;
  }

  .landing-search-wrap {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .landing-history-card {
    background: rgba(10, 10, 14, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius, 12px);
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Ticker ── */
  .landing-ticker {
    padding: 16px 0;
    overflow: hidden;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    margin-bottom: 80px;
  }

  .landing-ticker-track {
    display: flex;
    gap: 32px;
    white-space: nowrap;
    animation: ticker 30s linear infinite;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  @keyframes ticker {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  /* ── Sections ── */
  .landing-section {
    padding: 80px 24px;
  }

  .landing-section-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .landing-section-label {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .landing-section-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--accent);
  }

  .landing-section-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
  }

  .landing-section-title {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: clamp(28px, 4vw, 42px);
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 40px;
  }

  /* ── Bento Grid ── */
  .landing-bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }

  .landing-bento-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s;
    cursor: default;
  }

  .landing-bento-card:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  .landing-bento-red-glow {
    border-color: rgba(255, 70, 85, 0.2);
  }

  .landing-bento-red-glow:hover {
    box-shadow: 0 0 30px rgba(255, 70, 85, 0.1);
    border-color: rgba(255, 70, 85, 0.35);
  }

  .landing-bento-large {
    min-height: 200px;
  }

  .span-12 { grid-column: span 12; }
  .span-4 { grid-column: span 4; }

  .landing-card-tag {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: var(--muted);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
  }

  .landing-card-tag-red {
    color: var(--accent);
    border-color: rgba(255, 70, 85, 0.3);
    background: rgba(255, 70, 85, 0.12);
  }

  .landing-card-img-frame {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
  }

  .landing-card-img-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s;
  }

  .landing-bento-card:hover .landing-card-img-frame img {
    transform: scale(1.03);
  }

  .landing-contain-fit img {
    object-fit: contain;
  }

  /* ── CTA Section ── */
  .landing-cta-section {
    padding: 60px 24px 80px;
    display: flex;
    justify-content: center;
  }

  .landing-cta-card {
    background: rgba(255, 70, 85, 0.06);
    border: 1px solid rgba(255, 70, 85, 0.2);
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    max-width: 560px;
    width: 100%;
  }

  .landing-cta-title {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 28px;
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .landing-cta-sub {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 24px;
  }

  /* ── Footer ── */
  .landing-footer {
    padding: 40px 24px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .landing-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
    margin-bottom: 24px;
  }

  .landing-footer-brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 18px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .landing-footer-logo {
    width: 28px;
    height: 28px;
    margin-bottom: 4px;
  }

  .landing-footer-credit {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
  }

  .landing-footer-nav {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .landing-footer-nav a {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: var(--muted);
    transition: color 0.2s;
    text-decoration: none;
  }

  .landing-footer-nav a:hover {
    color: #fff;
  }

  .landing-footer-social {
    display: flex;
    gap: 16px;
  }

  .landing-footer-social a {
    color: var(--muted);
    transition: color 0.2s;
  }

  .landing-footer-social a:hover {
    color: #fff;
  }

  .landing-footer-disclaimer {
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    text-align: center;
    opacity: 0.6;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .landing-hero {
      min-height: 80vh;
      padding: 100px 20px 40px;
    }
    .landing-bento-grid {
      grid-template-columns: 1fr;
    }
    .span-12, .span-4 {
      grid-column: span 1;
    }
    .landing-footer-inner {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .landing-footer-nav {
      justify-content: center;
    }
  }
</style>

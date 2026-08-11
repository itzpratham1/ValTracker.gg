<script>
  import { onMount, onDestroy, tick } from 'svelte';

  export let open = false;
  export let onClose = () => {};

  let currentStep = 0;
  let dontShowAgain = false;

  let highlightStyle = '';
  let popoverStyle = '';
  let activeElement = null;

  const TOUR_STEPS = [
    {
      id: 'search-filters',
      selector: '[data-tour="search-filters"]',
      title: 'Player Search & Filters',
      icon: '🔍',
      description: 'Search any Valorant player using their Riot ID (Name#Tag). Use the topbar pills to filter match data by Region (AP, NA, EU, KR), Game Mode (Comp, Unrated, DM), or Act.',
      tip: 'Pro Tip: Type a player tag and hit Enter or click the search icon to fetch live career stats.',
      position: 'bottom'
    },
    {
      id: 'nav-tabs',
      selector: '[data-tour="nav-tabs"]',
      title: 'Feature Hubs & Modules',
      icon: '🚀',
      description: 'Switch between core sections: Stats Tracker, VCT Esports Hub, Skins Store with discount alerts, Meta Comp Architect, and OBS Stream Overlay Studio.',
      tip: 'Navigate between full career stats and live esports tournaments in one click.',
      position: 'bottom'
    },
    {
      id: 'hero-overview',
      selector: '[data-tour="hero-overview"]',
      title: 'Career Summary & Rank Pace',
      icon: '👑',
      description: 'Overview of your current Competitive Rank, RR progress, seasonal Win Rate bar, peak rank tier, and estimated games needed to hit the next rank based on win momentum.',
      tip: 'Hover over rank icons to view detailed tier distribution and MMR status.',
      position: 'bottom'
    },
    {
      id: 'stat-cards',
      selector: '[data-tour="stat-cards"]',
      title: 'Core Performance Metrics',
      icon: '📊',
      description: 'Track key performance indicators: K/D Ratio, Damage Per Round (ADR), Headshot Percentage (HS%), and Win Rate with color-coded ratings.',
      tip: 'Click on any stat card to open deep distribution charts and benchmark insights!',
      position: 'top'
    },
    {
      id: 'tracker-nav',
      selector: '[data-tour="tracker-nav"]',
      title: 'Quick Section Jump Bar',
      icon: '⚡',
      description: 'Use the quick navigation bar to instantly jump between Combat, Performance, Trends, Agents, Maps, Weapons, Teammates, and AI Tools.',
      tip: 'The nav bar dynamically highlights as you scroll down the profile page.',
      position: 'bottom'
    },
    {
      id: 'valbot-coach',
      selector: '[data-tour="valbot-coach"]',
      title: 'ValBot AI Coach & Insights',
      icon: '🤖',
      description: 'Your personal AI tactical coach analyzes your recent match performances, pointing out playstyle strengths, weak areas, and actionable advice to climb ranks.',
      tip: 'Ask ValBot custom questions or request match recommendations anytime.',
      position: 'top'
    },
    {
      id: 'match-history',
      selector: '[data-tour="match-history"]',
      title: 'Match History & Deep Breakdown',
      icon: '🎮',
      description: 'Review match logs with victory/defeat scorelines, ACS, KDA, and map splashes. Click any match to view full scoreboard, round timelines, and duel matrices.',
      tip: 'Hover over round icons in match panels to see economy, kill feed, and momentum.',
      position: 'top'
    },
    {
      id: 'utilities',
      selector: '[data-tour="utilities"]',
      title: 'Export Cards & Utilities',
      icon: '📤',
      description: 'Generate high-res shareable stats graphics for Discord/Reddit, compare head-to-head with rivals, track active gaming sessions, or save player bookmarks!',
      tip: 'Access the Utilities menu anytime in the nav bar or topbar for extra tools.',
      position: 'left'
    }
  ];

  $: if (open) {
    tick().then(() => {
      updateHighlight();
    });
  }

  function handleKeydown(e) {
    if (!open) return;
    if (e.key === 'Escape') {
      closeTour();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      nextStep();
    } else if (e.key === 'ArrowLeft') {
      prevStep();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  });

  async function updateHighlight() {
    if (!open) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    let target = document.querySelector(step.selector);
    
    // Fallback search if selector isn't found
    if (!target) {
      if (step.id === 'search-filters') target = document.querySelector('.topbar-sub-row') || document.querySelector('.player-search-wrap');
      else if (step.id === 'nav-tabs') target = document.querySelector('.topbar-tabs');
      else if (step.id === 'hero-overview') target = document.querySelector('.hero-section') || document.querySelector('.hero-left');
      else if (step.id === 'stat-cards') target = document.querySelector('.stat-cards-grid') || document.querySelector('.stat-card');
      else if (step.id === 'tracker-nav') target = document.querySelector('.tracker-nav');
      else if (step.id === 'valbot-coach') target = document.querySelector('#sec-ai-tools') || document.querySelector('.ai-coach-card');
      else if (step.id === 'match-history') target = document.querySelector('#sec-matches') || document.querySelector('.match-row');
      else if (step.id === 'utilities') target = document.querySelector('.tracker-nav-right') || document.querySelector('.active-pill-btn');
    }

    activeElement = target;

    if (target) {
      // Scroll element smoothly into view if offscreen
      const rect = target.getBoundingClientRect();
      const isOffscreen = rect.top < 80 || rect.bottom > window.innerHeight - 80;

      if (isOffscreen) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Wait briefly for scroll animation to stabilize
        await new Promise(r => setTimeout(r, 250));
      }

      const updatedRect = target.getBoundingClientRect();
      const pad = 8;
      
      highlightStyle = `
        top: ${Math.max(0, updatedRect.top - pad)}px;
        left: ${Math.max(0, updatedRect.left - pad)}px;
        width: ${updatedRect.width + pad * 2}px;
        height: ${updatedRect.height + pad * 2}px;
      `;

      calculatePopoverPosition(updatedRect, step.position);
    } else {
      // Fallback: center modal if target component is not visible on page
      highlightStyle = `display: none;`;
      popoverStyle = `
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: fixed;
      `;
    }
  }

  function calculatePopoverPosition(targetRect, preferredPos) {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      popoverStyle = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100vw - 32px);
        max-width: 440px;
        z-index: 100002;
      `;
      return;
    }

    const cardWidth = 420;
    const cardHeight = 260;
    const gap = 16;

    let top = targetRect.bottom + gap;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    // Adjust position based on target location & viewport boundaries
    if (preferredPos === 'top' || top + cardHeight > window.innerHeight) {
      if (targetRect.top - cardHeight - gap > 80) {
        top = targetRect.top - cardHeight - gap;
      }
    }

    if (preferredPos === 'left') {
      left = targetRect.left - cardWidth - gap;
      top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
    }

    // Viewport clamping
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    top = Math.max(80, Math.min(window.innerHeight - cardHeight - 16, top));

    popoverStyle = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      width: ${cardWidth}px;
      z-index: 100002;
    `;
  }

  function nextStep() {
    if (currentStep < TOUR_STEPS.length - 1) {
      currentStep++;
      updateHighlight();
    } else {
      closeTour();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      updateHighlight();
    }
  }

  function closeTour() {
    if (dontShowAgain && typeof localStorage !== 'undefined') {
      localStorage.setItem('valtracker_tour_completed', 'true');
    }
    open = false;
    currentStep = 0;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onClose();
  }

  function toggleDontShowAgain() {
    dontShowAgain = !dontShowAgain;
    if (typeof localStorage !== 'undefined') {
      if (dontShowAgain) {
        localStorage.setItem('valtracker_tour_completed', 'true');
      } else {
        localStorage.removeItem('valtracker_tour_completed');
      }
    }
  }
</script>

{#if open}
  <div class="tour-backdrop" on:click|self={closeTour}>
    <!-- Active element spotlight cutout highlight box -->
    {#if highlightStyle && !highlightStyle.includes('display: none')}
      <div class="tour-spotlight-box" style={highlightStyle}>
        <div class="spotlight-pulse-border"></div>
      </div>
    {/if}

    <!-- Tour Popover Card -->
    <div class="tour-card" style={popoverStyle}>
      <div class="tour-card-header">
        <div class="tour-title-wrap">
          <span class="tour-step-icon">{TOUR_STEPS[currentStep].icon}</span>
          <div>
            <h3 class="tour-step-title">{TOUR_STEPS[currentStep].title}</h3>
            <span class="tour-step-badge">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
          </div>
        </div>
        <button class="tour-close-btn" on:click={closeTour} title="Close Guide (Esc)">✕</button>
      </div>

      <div class="tour-card-body">
        <p class="tour-desc">{TOUR_STEPS[currentStep].description}</p>

        {#if TOUR_STEPS[currentStep].tip}
          <div class="tour-tip-box">
            <span class="tip-icon">💡</span>
            <span class="tip-text">{TOUR_STEPS[currentStep].tip}</span>
          </div>
        {/if}
      </div>

      <!-- Step Navigation Dots -->
      <div class="tour-dots">
        {#each TOUR_STEPS as _, idx}
          <button
            class="tour-dot"
            class:active={idx === currentStep}
            on:click={() => { currentStep = idx; updateHighlight(); }}
            title="Go to step {idx + 1}"
          ></button>
        {/each}
      </div>

      <div class="tour-card-footer">
        <label class="tour-dont-show">
          <input type="checkbox" checked={dontShowAgain} on:change={toggleDontShowAgain}>
          <span>Don't show again</span>
        </label>

        <div class="tour-nav-btns">
          <button class="tour-btn tour-btn-skip" on:click={closeTour} title="Skip Tour (Esc)">
            Skip
          </button>

          {#if currentStep > 0}
            <button class="tour-btn tour-btn-secondary" on:click={prevStep}>
              ← Back
            </button>
          {/if}

          <button class="tour-btn tour-btn-primary" on:click={nextStep}>
            {currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour 🚀' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .tour-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    animation: fadeIn 0.25s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .tour-spotlight-box {
    position: fixed;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25), 0 0 30px rgba(250, 68, 84, 0.8), inset 0 0 15px rgba(250, 68, 84, 0.15);
    pointer-events: none;
    z-index: 100001;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border: 2px solid var(--accent, #fa4454);
    background: rgba(250, 68, 84, 0.03);
  }

  .spotlight-pulse-border {
    position: absolute;
    inset: -4px;
    border-radius: 14px;
    border: 1.5px dashed rgba(250, 68, 84, 0.8);
    animation: pulseBorder 2s infinite linear;
    pointer-events: none;
  }

  @keyframes pulseBorder {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.02); opacity: 0.3; }
    100% { transform: scale(1); opacity: 0.8; }
  }

  .tour-card {
    background: linear-gradient(135deg, rgba(18, 20, 29, 0.98) 0%, rgba(10, 11, 16, 0.98) 100%);
    border: 1px solid rgba(250, 68, 84, 0.35);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(250, 68, 84, 0.15);
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transition: all 0.25s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tour-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .tour-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tour-step-icon {
    font-size: 26px;
    background: rgba(250, 68, 84, 0.12);
    border: 1px solid rgba(250, 68, 84, 0.25);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .tour-step-title {
    margin: 0;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #ffffff;
  }

  .tour-step-badge {
    font-size: 11px;
    color: var(--accent, #fa4454);
    font-family: 'DM Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .tour-close-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #a0a0ab;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .tour-close-btn:hover {
    background: rgba(250, 68, 84, 0.2);
    border-color: rgba(250, 68, 84, 0.4);
    color: #fff;
  }

  .tour-card-body {
    margin-bottom: 16px;
  }

  .tour-desc {
    margin: 0 0 12px 0;
    font-size: 13.5px;
    line-height: 1.55;
    color: #c4c4d0;
  }

  .tour-tip-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(232, 255, 71, 0.08);
    border: 1px solid rgba(232, 255, 71, 0.2);
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #e8ff47;
    line-height: 1.4;
  }

  .tip-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .tour-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }

  .tour-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tour-dot.active {
    width: 22px;
    border-radius: 10px;
    background: var(--accent, #fa4454);
    box-shadow: 0 0 10px rgba(250, 68, 84, 0.5);
  }

  .tour-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    gap: 12px;
  }

  .tour-dont-show {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: #8a8a98;
    cursor: pointer;
    user-select: none;
  }

  .tour-dont-show input {
    accent-color: var(--accent, #fa4454);
    cursor: pointer;
  }

  .tour-nav-btns {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tour-btn {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    padding: 7px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tour-btn-skip {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #a0a0ab;
  }

  .tour-btn-skip:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .tour-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #d0d0dc;
  }

  .tour-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .tour-btn-primary {
    background: linear-gradient(135deg, #fa4454 0%, #dc2626 100%);
    border: 1px solid rgba(250, 68, 84, 0.6);
    color: #fff;
    box-shadow: 0 4px 15px rgba(250, 68, 84, 0.35);
  }

  .tour-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(250, 68, 84, 0.5);
  }
</style>

<script>
  import { onMount, onDestroy, tick } from 'svelte';

  export let open = false;
  export let section = 'tracker'; // 'tracker' | 'esports' | 'store' | 'coach' | 'overlay'
  export let onClose = () => {};
  export let onStepChange = null;

  let currentStep = 0;
  let dontShowAgain = false;

  let highlightStyle = '';
  let popoverStyle = '';
  let activeElement = null;

  const TOUR_STEPS_BY_SECTION = {
    tracker: [
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
    ],

    esports: [
      {
        id: 'esports-header',
        selector: '[data-tour="esports-header"]',
        title: 'VCT Esports Telemetry Hub',
        icon: '🏆',
        description: 'Follow live competitive Valorant tournaments globally across VCT Pacific, Americas, EMEA, and China leagues in real time.',
        tip: 'Pro Tip: Toggle the Tier 2/3 switch in the top-right to include or hide Challengers and Game Changers events.',
        position: 'bottom'
      },
      {
        id: 'esports-tabs',
        selector: '[data-tour="esports-tabs"]',
        title: 'Tournament Subnav & Filters',
        icon: '⚡',
        description: 'Easily navigate between Overview, Full Match Schedule, VCT 2026 Season Roadmap, Franchise Team Rosters, and Esports News.',
        tip: 'Click any sub-tab to instantly switch sections.',
        position: 'bottom'
      },
      {
        id: 'esports-live',
        selector: '[data-tour="esports-live"]',
        title: 'Live & Highlight Matches',
        icon: '🔴',
        description: 'View active VCT matches with live map scores, team logos, and match schedules updated in real time.',
        tip: 'Click "View Highlights" or "Full Details" on any match card to see stream vods and VLR stats.',
        position: 'right'
      },
      {
        id: 'esports-news',
        selector: '[data-tour="esports-news"]',
        title: 'Esports Headlines & VLR News',
        icon: '📰',
        description: 'Stay updated with the latest roster moves, VCT announcements, playoff standings, and tournament news parsed directly from VLR.gg.',
        tip: 'Click any news card to read the full story on VLR.gg.',
        position: 'left'
      },
      {
        id: 'esports-schedule',
        selector: '[data-tour="esports-schedule"]',
        title: 'Complete Fixtures & Results',
        icon: '📅',
        description: 'Browse upcoming match fixtures or historical match results across all competitive VCT circuits.',
        tip: 'Use the Upcoming and Results toggle pills to switch fixture views.',
        position: 'right'
      },
      {
        id: 'esports-roadmap',
        selector: '[data-tour="esports-roadmap"]',
        title: 'VCT 2026 Season Roadmap',
        icon: '🗺️',
        description: 'Track the full VCT 2026 calendar — from Kickoff and Masters Santiago to Stage 1, Masters London, Stage 2, and Champions Shanghai.',
        tip: 'Click any event card in the roadmap to view qualified teams, regional winners, and playoff bracket stages!',
        position: 'top'
      },
      {
        id: 'esports-teams-sidebar',
        selector: '[data-tour="esports-teams-sidebar"]',
        title: 'Franchise Team Selector',
        icon: '🌍',
        description: 'Browse all 44 official VCT Franchise Teams organized by regional leagues: Americas, EMEA, Pacific, and China.',
        tip: 'Click any team logo in the sidebar to open their active roster dashboard.',
        position: 'right'
      },
      {
        id: 'esports-teams-roster',
        selector: '[data-tour="esports-teams-roster"]',
        title: 'Pro Roster & VCT Capsules',
        icon: '👥',
        description: 'Inspect active pro players, head coaches, reserves, national flags, player avatars, and official VCT team weapon capsule skins.',
        tip: 'Hover over player cards to inspect full player handles and real names.',
        position: 'top'
      }
    ],

    store: [
      {
        id: 'store-bundles',
        selector: '[data-tour="store-bundles"]',
        title: 'Featured Daily Store Bundles',
        icon: '🛍️',
        description: 'Explore active featured daily weapon collections, bundle discounts, and rotation countdown timers.',
        tip: 'Updated daily in sync with the official Valorant in-game store.',
        position: 'bottom'
      },
      {
        id: 'store-catalog',
        selector: '[data-tour="store-catalog"]',
        title: 'Weapon Skin Catalog Search',
        icon: '🔎',
        description: 'Search any weapon skin in Valorant history by name, weapon category (Vandal, Phantom, Operator, Knife), or collection.',
        tip: 'Type skin names or select weapon categories to quickly inspect skins.',
        position: 'bottom'
      },
      {
        id: 'store-rarity',
        selector: '[data-tour="store-rarity"]',
        title: 'Rarity Tier Filters',
        icon: '💎',
        description: 'Filter skins by Select, Deluxe, Premium, Ultra, and Exclusive rarity tiers to find your dream loadout.',
        tip: 'Each rarity tier is color-coded matching Valorant VP price tiers.',
        position: 'bottom'
      },
      {
        id: 'store-card',
        selector: '[data-tour="store-card"]',
        title: '3D Skin Inspector & Chromas',
        icon: '✨',
        description: 'Click any skin card to open the 3D skin inspector, view chroma color variants, weapon levels, sound FX, and VP cost.',
        tip: 'Preview skin variants and level upgrade animations in full screen!',
        position: 'top'
      }
    ],

    coach: [
      {
        id: 'coach-header',
        selector: '[data-tour="coach-header"]',
        title: 'VCT Meta Comp Architect (/comp)',
        icon: '🧠',
        description: 'Build, evaluate, and optimize 5v5 team compositions against official VCT Pro Meta strategies and competitive telemetry.',
        tip: 'Select maps to load VCT pro team lineups and role balance heuristics.',
        position: 'bottom'
      },
      {
        id: 'coach-vct-meta',
        selector: '[data-tour="coach-vct-meta"]',
        title: 'Compare Against VCT Pro Meta',
        icon: '👑',
        description: 'Compare your custom 5-agent team draft directly against VCT Meta Favorites, highest win-rate pro team compositions, and official patch agent pick/win-rate heatmaps.',
        tip: 'Check VCT agent pick rates (PR %) and win rates (WR %) parsed directly from official VCT tournament telemetry.',
        position: 'top'
      },
      {
        id: 'coach-map',
        selector: '[data-tour="coach-map"]',
        title: 'Map & Patch Selector',
        icon: '🗺️',
        description: 'Select any competitive map (Ascent, Bind, Haven, Sunset, etc.) and patch version to view pro-recommended compositions.',
        tip: 'Each map displays specialized agent recommendations tailored to map layouts.',
        position: 'bottom'
      },
      {
        id: 'coach-slots',
        selector: '[data-tour="coach-slots"]',
        title: 'Interactive 5-Agent Draft Slots',
        icon: '⚔️',
        description: 'Click any slot to select agents across Duelist, Initiator, Controller, and Sentinel roles to test custom team comps.',
        tip: 'Click "Build Around" to auto-fill the rest of your team based on your selected main agent!',
        position: 'top'
      },
      {
        id: 'coach-rating',
        selector: '[data-tour="coach-rating"]',
        title: 'AI Synergy & Flaw Analysis',
        icon: '📊',
        description: 'Instant evaluation of your team composition: entry power, smoke coverage, retake potential, and tactical flaw alerts.',
        tip: 'Hover over flaw badges to view suggested agent swaps to maximize win chance.',
        position: 'top'
      }
    ],

    overlay: [
      {
        id: 'overlay-studio',
        selector: '[data-tour="overlay-studio"]',
        title: 'Stream Overlay Studio (/overlay)',
        icon: '📺',
        description: 'Create custom live stream HUD widgets for OBS Studio, Streamlabs, and vMix.',
        tip: 'Displays real-time rank, K/D, ACS, and session win/loss directly on your stream broadcast.',
        position: 'bottom'
      },
      {
        id: 'overlay-themes',
        selector: '[data-tour="overlay-themes"]',
        title: 'Theme Presets & Palette',
        icon: '🎨',
        description: 'Pick pre-built color themes (Val Red, Neon, Ice Blue, Ghost, Jade) or customize exact hex colors to match your stream overlay branding.',
        tip: 'Adjust scale slider and container size to fit your stream layout.',
        position: 'bottom'
      },
      {
        id: 'overlay-stats',
        selector: '[data-tour="overlay-stats"]',
        title: 'Widget Stat Toggles',
        icon: '⚙️',
        description: 'Select exactly which metrics to broadcast on stream: Current Rank, Peak Rank, Win Rate %, K/D Ratio, ACS, or Live Session W/L.',
        tip: 'Toggle stats on or off in real-time to keep your overlay clean and compact.',
        position: 'top'
      },
      {
        id: 'overlay-url',
        selector: '[data-tour="overlay-url"]',
        title: 'OBS Browser Source URL Generator',
        icon: '🔗',
        description: '1-click copy of your unique stream overlay URL. Simply add a Browser Source in OBS Studio and paste the link!',
        tip: 'Includes step-by-step OBS setup instructions with transparent background support.',
        position: 'top'
      }
    ]
  };

  $: TOUR_STEPS = TOUR_STEPS_BY_SECTION[section] || TOUR_STEPS_BY_SECTION.tracker;

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

  async function waitForTarget(selector, maxRetries = 12, delayMs = 40) {
    if (!selector) return null;
    for (let i = 0; i < maxRetries; i++) {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return el;
        }
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    return document.querySelector(selector);
  }

  async function updateHighlight() {
    if (!open) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    if (onStepChange) {
      onStepChange(currentStep, step);
      await tick();
    }

    let target = await waitForTarget(step.selector);
    
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
      else if (step.id === 'store-bundles') target = document.querySelector('.store-featured-container') || document.querySelector('.featured-bundle');
      else if (step.id === 'store-catalog') target = document.querySelector('.store-search-wrap') || document.querySelector('.store-filters');
      else if (step.id === 'store-rarity') target = document.querySelector('.store-filter-selects');
      else if (step.id === 'store-card') target = document.querySelector('.skin-catalog-card');
      else if (step.id === 'store-header') target = document.querySelector('.store-banner');
      else if (step.id.startsWith('esports-')) target = document.querySelector('.esports-pill.active') || document.querySelector('.esports-pills-scroll');
      else if (step.id.startsWith('coach-')) target = document.querySelector('.coach-banner') || document.querySelector('.coach-select-row');
      else if (step.id.startsWith('overlay-')) target = document.querySelector('.ost-header') || document.querySelector('.ost-step');
    }

    activeElement = target;

    if (target) {
      const rect = target.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      const headerOffset = isMobile ? 80 : 120;
      const bottomThreshold = isMobile ? window.innerHeight - 290 : window.innerHeight - 80;

      const isCramped = rect.top < headerOffset || rect.bottom > bottomThreshold;

      if (isCramped) {
        const targetDocTop = window.scrollY + rect.top;
        const desiredScrollY = Math.max(0, targetDocTop - headerOffset);
        window.scrollTo({
          top: desiredScrollY,
          behavior: 'smooth'
        });
        await new Promise(r => setTimeout(r, 320));
      }

      const updatedRect = target.getBoundingClientRect();
      const pad = 8;
      
      highlightStyle = `
        top: ${Math.max(0, updatedRect.top - pad)}px;
        left: ${Math.max(0, updatedRect.left - pad)}px;
        width: ${updatedRect.width + pad * 2}px;
        height: ${updatedRect.height + pad * 2}px;
      `;

      await tick();
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

  let cardEl;

  function calculatePopoverPosition(targetRect, preferredPos) {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      popoverStyle = `
        position: fixed;
        bottom: max(16px, env(safe-area-inset-bottom, 16px));
        left: 50%;
        transform: translateX(-50%);
        width: calc(100vw - 24px);
        max-width: 440px;
        max-height: calc(100vh - 60px);
        overflow-y: auto;
        z-index: 100002;
      `;
      return;
    }

    const cardWidth = 420;
    const measuredHeight = cardEl ? cardEl.offsetHeight : 360;
    const gap = 16;

    let top = targetRect.bottom + gap;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top - 80;

    // Flip card above target if space below is constrained or preferredPos === 'top'
    if (preferredPos === 'top' || spaceBelow < measuredHeight + gap) {
      if (spaceAbove >= measuredHeight + gap || spaceAbove > spaceBelow) {
        top = targetRect.top - measuredHeight - gap;
      }
    }

    if (preferredPos === 'left') {
      left = targetRect.left - cardWidth - gap;
      top = targetRect.top + (targetRect.height / 2) - (measuredHeight / 2);
    } else if (preferredPos === 'right') {
      left = targetRect.right + gap;
      top = targetRect.top + (targetRect.height / 2) - (measuredHeight / 2);
    }

    // Auto-correct position if centered popover card overlaps target element
    if (preferredPos === 'bottom' || preferredPos === 'top') {
      const cardRight = left + cardWidth;
      const cardBottom = top + measuredHeight;
      const overlaps = !(
        left >= targetRect.right ||
        cardRight <= targetRect.left ||
        top >= targetRect.bottom ||
        cardBottom <= targetRect.top
      );
      if (overlaps) {
        if (targetRect.right + gap + cardWidth <= window.innerWidth - 16) {
          left = targetRect.right + gap;
        } else if (targetRect.left - gap - cardWidth >= 16) {
          left = targetRect.left - gap - cardWidth;
        }
      }
    }

    // Strict viewport clamping to guarantee zero overflow
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    top = Math.max(80, Math.min(window.innerHeight - measuredHeight - 20, top));

    popoverStyle = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      width: ${cardWidth}px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
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
    const storageKey = section === 'tracker' ? 'valtracker_tour_completed' : `valtracker_tour_${section}`;
    if (dontShowAgain && typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
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
    const storageKey = section === 'tracker' ? 'valtracker_tour_completed' : `valtracker_tour_${section}`;
    if (typeof localStorage !== 'undefined') {
      if (dontShowAgain) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }

  let touchStartX = 0;
  let touchEndX = 0;

  function handleTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
    }
  }

  function handleTouchEnd(e) {
    if (e.changedTouches && e.changedTouches.length > 0) {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) {
          nextStep();
        } else {
          prevStep();
        }
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
    <div
      class="tour-card"
      bind:this={cardEl}
      style={popoverStyle}
      on:touchstart={handleTouchStart}
      on:touchend={handleTouchEnd}
    >
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

  /* Mobile Responsive Enhancements */
  @media (max-width: 768px) {
    .tour-card {
      padding: 14px 16px;
      border-radius: 18px 18px 14px 14px;
    }
    .tour-card-header {
      margin-bottom: 10px;
    }
    .tour-step-icon {
      width: 36px;
      height: 36px;
      font-size: 20px;
      border-radius: 10px;
    }
    .tour-step-title {
      font-size: 16px;
      line-height: 1.2;
    }
    .tour-step-badge {
      font-size: 10px;
    }
    .tour-desc {
      font-size: 12.5px;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .tour-tip-box {
      padding: 7px 10px;
      font-size: 11px;
      border-radius: 6px;
    }
    .tour-dots {
      margin-bottom: 10px;
      gap: 5px;
    }
    .tour-dot {
      width: 6px;
      height: 6px;
    }
    .tour-dot.active {
      width: 18px;
    }
    .tour-card-footer {
      padding-top: 10px;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tour-dont-show {
      font-size: 10.5px;
    }
    .tour-nav-btns {
      gap: 6px;
      width: 100%;
      justify-content: flex-end;
    }
    .tour-btn {
      font-size: 11.5px;
      padding: 8px 12px;
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .tour-btn-primary {
      flex: 1;
    }
  }
</style>

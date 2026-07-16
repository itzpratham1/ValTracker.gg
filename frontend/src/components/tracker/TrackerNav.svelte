<script>
  import { createEventDispatcher } from 'svelte';

  export let onScrollTo = (sectionId) => {};
  export let sessionActive = false;
  export let sessionSummaryVisible = false;
  export let onToggleSession = () => {};
  export let onShowSessionSummary = () => {};
  export let activeSection = 'sec-combat';

  const dispatch = createEventDispatcher();

  let toolsOpen = false;

  const SECTIONS = [
    { id: 'sec-combat', icon: '⚔️', label: 'Combat', number: '01' },
    { id: 'sec-performance', icon: '📈', label: 'Performance', number: '02' },
    { id: 'sec-trend', icon: '📊', label: 'Trend', number: '03' },
    { id: 'sec-agents', icon: '👤', label: 'Agents', number: '04' },
    { id: 'sec-maps', icon: '🗺️', label: 'Maps', number: '05' },
    { id: 'sec-weapons', icon: '🔫', label: 'Weapons', number: '06' },
    { id: 'sec-teammates', icon: '👥', label: 'Teammates', number: '07' },
    { id: 'sec-matches', icon: '🎮', label: 'Matches', number: '08' },
    { id: 'sec-ai-tools', icon: '🤖', label: 'AI Tools', number: '09' },
  ];

  function smoothScrollTo(sectionId, event) {
    event.preventDefault();
    onScrollTo(sectionId);
  }

  function closeTools() {
    toolsOpen = false;
  }
</script>

<svelte:window on:click={closeTools} />

<div class="tracker-nav" id="tracker-nav">
  <div class="tracker-nav-left">
    {#each SECTIONS as section}
      <a class="tracker-nav-item" class:active={activeSection === section.id} on:click={(e) => smoothScrollTo(section.id, e)}>
        <span class="nav-icon">{section.icon}</span> {section.label}
      </a>
    {/each}
  </div>
  
  <div class="tracker-nav-right">
    <div class="session-group">
      <button class="nav-btn" class:action={!sessionActive} class:stop={sessionActive} on:click={onToggleSession}>
        {sessionActive ? '⏹ End Session' : '▶ Start Session'}
      </button>
      {#if sessionSummaryVisible}
        <button class="nav-btn success" on:click={onShowSessionSummary}>📊 Summary</button>
      {/if}
    </div>
    
    <div class="nav-dropdown" class:active={toolsOpen}>
      <button class="nav-btn dropdown-trigger"
              on:click|stopPropagation={() => toolsOpen = !toolsOpen}
              title="More Tools">
        <span>⚡ Utilities</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      <div class="dropdown-menu" on:click|stopPropagation>
        <button class="dropdown-item" on:click={() => { toolsOpen = false; dispatch('shareProfile'); }}>
          <span class="dropdown-item-icon">🔗</span> Share Profile
        </button>
        <button class="dropdown-item" on:click={() => { toolsOpen = false; dispatch('openLeaderboard'); }}>
          <span class="dropdown-item-icon">🏆</span> Top 500
        </button>
        <button class="dropdown-item" on:click={() => { toolsOpen = false; dispatch('openH2H'); }}>
          <span class="dropdown-item-icon">⚔️</span> Compare (Vs)
        </button>
        <button class="dropdown-item" on:click={() => { toolsOpen = false; dispatch('exportStats'); }}>
          <span class="dropdown-item-icon">📤</span> Export Stats Card
        </button>
        <button class="dropdown-item" on:click={() => { toolsOpen = false; dispatch('openBookmarks'); }}>
          <span class="dropdown-item-icon" style="color:#ffd700;">★</span> Bookmarked Players
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item danger" on:click={() => { toolsOpen = false; dispatch('clearMatches'); }} title="Clear all stored matches">
          <span class="dropdown-item-icon">🗑️</span> Clear Stored Matches
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .nav-dropdown { position: relative; }
</style>

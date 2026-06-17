<script>
  import { onMount, onDestroy } from 'svelte';
  import { currentView } from '../../lib/appStore';
  import { fetchMetaComps } from '../../lib/api';
  import {
    evaluateDraft, buildAroundMe, getAgentIconUrl, getRoleClass,
    MAPS, MAP_DISPLAY, DRAFT_MAP_RECOMMENDATIONS, getAgentDisplayName
  } from '../../lib/draft-engine';
  import ProComps from './ProComps.svelte';
  import AgentSelectorModal from './AgentSelectorModal.svelte';

  export let playerAgentPool = {};

  let draftSlots = [null, null, null, null, null];
  let activeSlotIndex = null;
  let selectedMap = 'ascent';
  let evaluation = null;
  let savedComps = [];
  let selectorOpen = false;

  $: isVisible = $currentView === 'coach';

  $: if (isVisible) {
    loadSavedDrafts();
  }

  onMount(() => {
    loadSavedDrafts();
  });

  function loadSavedDrafts() {
    try {
      savedComps = JSON.parse(localStorage.getItem('valtracker_comps')) || [];
    } catch { savedComps = []; }
  }

  function handleMapChange() {
    runEvaluation();
  }

  function openSelector(slotIndex) {
    activeSlotIndex = slotIndex;
    selectorOpen = true;
  }

  function closeSelector() {
    selectorOpen = false;
    activeSlotIndex = null;
  }

  function handleSelectAgent(agentKey) {
    if (activeSlotIndex === null) return;
    draftSlots[activeSlotIndex] = agentKey;
    draftSlots = [...draftSlots];
    closeSelector();
    runEvaluation();
  }

  function resetDraft() {
    draftSlots = [null, null, null, null, null];
    runEvaluation();
  }

  function runEvaluation() {
    evaluation = evaluateDraft(draftSlots, selectedMap);
  }

  function handleBuildAroundMe() {
    draftSlots = buildAroundMe(draftSlots, selectedMap, playerAgentPool);
    runEvaluation();
  }

  function saveCurrentDraft() {
    const selected = draftSlots.filter(s => s !== null);
    if (selected.length < 5) return;

    const mapCapitalized = MAP_DISPLAY[selectedMap] || selectedMap;
    const compName = prompt("Enter a name for this custom setup:", `${mapCapitalized} Tactics`);
    if (compName === null) return;

    const finalName = compName.trim() || `${mapCapitalized} Tactics`;

    const newComp = {
      id: Date.now(),
      name: finalName,
      map: selectedMap,
      agents: [...draftSlots],
      timestamp: Date.now()
    };

    savedComps = [newComp, ...savedComps];
    localStorage.setItem('valtracker_comps', JSON.stringify(savedComps));
  }

  function deleteDraftComp(id) {
    savedComps = savedComps.filter(c => c.id !== id);
    localStorage.setItem('valtracker_comps', JSON.stringify(savedComps));
  }

  function loadDraftComp(id) {
    const comp = savedComps.find(c => c.id === id);
    if (!comp) return;
    draftSlots = [...comp.agents];
    if (comp.map) selectedMap = comp.map;
    runEvaluation();
  }

  function exportDraftPNG() {
    showToast('Export feature coming soon!');
  }

  function showToast(msg) {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(msg);
    } else {
      console.log(msg);
    }
  }

  $: scoreColor = evaluation
    ? evaluation.score >= 85 ? 'var(--win)'
      : evaluation.score >= 70 ? 'var(--accent)'
      : 'var(--loss)'
    : 'var(--muted)';
</script>

<div class="coach-view">
  <!-- Banner Header -->
  <div class="coach-banner">
    <h2 class="coach-banner-title">VCT Meta Comp Architect</h2>
    <p class="coach-banner-desc">
      Draft 5-agent team compositions for any active Valorant map. Our real-time coaching heuristics engine evaluates role balances, map suitability, and triggers synergies to flag tactical vulnerabilities before you queue.
    </p>
  </div>

  <div class="coach-grid">
    <!-- LEFT PANEL: Draft Board & Map Selector -->
    <div class="coach-left-panel">
      <div class="section-label visible" style="margin-bottom: 0;">
        <span class="sl-text">Draft Composition Board</span>
        <div class="sl-line"></div>
      </div>

      <div class="card coach-draft-card">
        <!-- Map Selector -->
        <div>
          <label class="coach-label">Select Tactical Map</label>
          <select bind:value={selectedMap} on:change={handleMapChange} class="coach-select">
            {#each MAPS as map}
              <option value={map}>{MAP_DISPLAY[map]}</option>
            {/each}
          </select>
        </div>

        <!-- 5 Agent Slots -->
        <div class="coach-slots-header">Selected Agent Draft</div>
        <div class="coach-team-slots">
          {#each draftSlots as slot, i}
            <div class="dc-slot-card" on:click={() => openSelector(i)}>
              <div class="dc-slot-avatar">
                {#if slot}
                  {@const iconUrl = getAgentIconUrl(slot)}
                  {#if iconUrl}
                    <img class="dc-slot-avatar-img" src={iconUrl} alt={slot} />
                  {:else}
                    <span>{slot.charAt(0).toUpperCase()}</span>
                  {/if}
                {:else}
                  <span>+</span>
                {/if}
              </div>
              <div class="dc-slot-name">{slot ? slot.toUpperCase() : `Slot ${i + 1}`}</div>
            </div>
          {/each}
        </div>

        <!-- Action Buttons Row 1 -->
        <div class="dc-btn-row">
          <button class="fetch-btn dc-btn-primary" on:click={handleBuildAroundMe}>Build Around Me</button>
          <button class="fetch-btn dc-btn-secondary" on:click={resetDraft}>Clear</button>
        </div>

        <!-- Action Buttons Row 2 -->
        <div class="dc-btn-row">
          <button class="fetch-btn dc-btn-accent" on:click={saveCurrentDraft}>Save Draft</button>
          <button class="fetch-btn dc-btn-secondary" on:click={exportDraftPNG}>Export Lineup</button>
        </div>
      </div>

      <!-- My Saved Compositions -->
      {#if savedComps.length > 0}
        <div class="section-label visible" style="margin-top: 15px; margin-bottom: 0;">
          <span class="sl-text">My Saved Compositions</span>
          <div class="sl-line"></div>
        </div>
        <div class="card coach-saved-card">
          {#each savedComps as comp}
            <div class="coach-saved-item">
              <div class="coach-saved-info" on:click={() => loadDraftComp(comp.id)}>
                <div class="coach-saved-name">
                  <span>{comp.name}</span>
                  <span class="coach-saved-map">{MAP_DISPLAY[comp.map] || comp.map}</span>
                </div>
                <div class="coach-saved-agents">
                  {#each comp.agents as ag}
                    {#if ag}
                      {@const icon = getAgentIconUrl(ag)}
                      {#if icon}
                        <img src={icon} alt={ag} class="coach-saved-agent-icon" title={ag.toUpperCase()} />
                      {/if}
                    {/if}
                  {/each}
                </div>
              </div>
              <button class="coach-saved-delete" on:click={() => deleteDraftComp(comp.id)}>&times;</button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Pro Comps Panel -->
      <ProComps mapKey={selectedMap} />
    </div>

    <!-- RIGHT PANEL: Verdict -->
    <div class="coach-right-panel">
      <div class="section-label visible" style="margin-bottom: 0;">
        <span class="sl-text">Tactical Coach Verdict</span>
        <div class="sl-line"></div>
      </div>

      <div class="card coach-verdict-card">
        {#if evaluation}
          <!-- Score Meter + Verdict -->
          <div class="coach-verdict-header">
            <div class="coach-score-meter" style="border-color: {scoreColor};">
              <div class="coach-score-num" style="color: {scoreColor};">{evaluation.score}</div>
              <div class="coach-score-label">SCORE</div>
            </div>
            <div>
              <div class="coach-verdict-title" style="color: {scoreColor};">{evaluation.verdictTitle}</div>
              <p class="coach-verdict-desc">{evaluation.verdictDesc}</p>
            </div>
          </div>

          <!-- Role Allocations -->
          <div>
            <h4 class="coach-section-title">Role Allocations</h4>
            <div class="coach-bars">
              {#each evaluation.roleBars as bar}
                <div>
                  <div class="coach-bar-header">
                    <span>{bar.id.charAt(0).toUpperCase() + bar.id.slice(1)}</span>
                    <span>{bar.current} / {bar.target}</span>
                  </div>
                  <div class="dc-track-bar">
                    <div class="dc-fill-bar {bar.id}" style="width: {Math.min((bar.current / bar.target) * 100, 100)}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Advanced Coordination Metrics -->
          <div class="coach-metrics-section">
            <h4 class="coach-section-title">Advanced Coordination Metrics</h4>
            <div class="coach-bars">
              <div>
                <div class="coach-bar-header">
                  <span>Site Entry & Execution Power</span>
                  <span>{evaluation.metrics.entry}%</span>
                </div>
                <div class="dc-track-bar"><div class="dc-fill-bar entry" style="width: {evaluation.metrics.entry}%"></div></div>
              </div>
              <div>
                <div class="coach-bar-header">
                  <span>Defensive Lock & Site Delay</span>
                  <span>{evaluation.metrics.defense}%</span>
                </div>
                <div class="dc-track-bar"><div class="dc-fill-bar defense" style="width: {evaluation.metrics.defense}%"></div></div>
              </div>
              <div>
                <div class="coach-bar-header">
                  <span>Retake & Scouting Capability</span>
                  <span>{evaluation.metrics.retake}%</span>
                </div>
                <div class="dc-track-bar"><div class="dc-fill-bar retake" style="width: {evaluation.metrics.retake}%"></div></div>
              </div>
              <div>
                <div class="coach-bar-header">
                  <span>Inter-Agent Synergy Factor</span>
                  <span>{evaluation.metrics.synergy}%</span>
                </div>
                <div class="dc-track-bar"><div class="dc-fill-bar synergy" style="width: {evaluation.metrics.synergy}%"></div></div>
              </div>
            </div>
          </div>

          <!-- Draft Analysis Insights -->
          <div class="coach-insights-section">
            <h4 class="coach-section-title">Draft Analysis Insights</h4>
            <div class="coach-insights">
              {#if evaluation.insights.length === 0}
                <div class="coach-insights-empty">Insights panel will fill once draft is parsed.</div>
              {:else}
                {#each evaluation.insights as insight}
                  <div class="dc-insight-card {insight.type}">
                    <span class="dc-insight-card-icon">{insight.icon}</span>
                    <div>{@html insight.text}</div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {:else}
          <!-- Empty state -->
          <div class="coach-verdict-header">
            <div class="coach-score-meter">
              <div class="coach-score-num">0</div>
              <div class="coach-score-label">SCORE</div>
            </div>
            <div>
              <div class="coach-verdict-title">Incomplete Draft</div>
              <p class="coach-verdict-desc">Add 5 agents to evaluate the comp synergy and receive coaching advice.</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<AgentSelectorModal
  open={selectorOpen}
  currentSlots={draftSlots}
  onSelect={handleSelectAgent}
  onClose={closeSelector}
/>

<style>
  .coach-view {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .coach-banner {
    background: linear-gradient(135deg, rgba(250, 68, 84, 0.12) 0%, rgba(20, 20, 22, 0.45) 100%);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .coach-banner-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 32px;
    font-weight: 900;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 1.5px;
    margin: 0;
  }

  .coach-banner-desc {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
    max-width: 700px;
  }

  .coach-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 28px;
  }

  .coach-left-panel, .coach-right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .coach-draft-card {
    padding: 16px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .coach-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    display: block;
    margin-bottom: 6px;
  }

  .coach-select {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  .coach-slots-header {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .coach-team-slots {
    display: flex;
    justify-content: space-around;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dc-slot-card {
    flex: 1;
    min-width: 90px;
    max-width: 110px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dc-slot-card:hover {
    border-color: var(--accentborder);
    background: rgba(250, 68, 84, 0.04);
    transform: translateY(-2px);
  }

  .dc-slot-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--muted);
    border: 1px solid var(--border);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .dc-slot-card:hover .dc-slot-avatar {
    border-color: var(--accent);
    color: #fff;
  }

  .dc-slot-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dc-slot-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dc-btn-row {
    display: flex;
    gap: 10px;
  }

  .dc-btn-primary {
    flex: 1.5;
    margin: 0;
    background: linear-gradient(135deg, var(--accent) 0%, #ff4655 100%);
    color: #0d0d0f;
    font-weight: 800;
  }

  .dc-btn-secondary {
    flex: 0.8;
    margin: 0;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
  }

  .dc-btn-accent {
    flex: 1;
    margin: 0;
    background: var(--accent);
    color: #0d0d0f;
  }

  .coach-saved-card {
    padding: 16px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .coach-saved-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  .coach-saved-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    cursor: pointer;
  }

  .coach-saved-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .coach-saved-map {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--accent);
    border: 1px solid rgba(232,232,232,0.2);
    padding: 0px 4px;
    border-radius: 3px;
  }

  .coach-saved-agents {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .coach-saved-agent-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .coach-saved-delete {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 14px;
    cursor: pointer;
    padding: 0 4px;
    transition: color 0.2s;
  }

  .coach-saved-delete:hover {
    color: #ff4655;
  }

  .coach-verdict-card {
    padding: 20px;
    border-radius: 16px;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .coach-verdict-header {
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 16px;
  }

  .coach-score-meter {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 16px rgba(250, 68, 84, 0.1);
    flex-shrink: 0;
  }

  .coach-score-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px;
    font-weight: 900;
    color: var(--muted);
  }

  .coach-score-label {
    font-size: 8px;
    color: var(--muted);
    text-transform: uppercase;
    font-weight: bold;
  }

  .coach-verdict-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
  }

  .coach-verdict-desc {
    font-size: 11px;
    color: var(--muted);
    margin: 4px 0 0 0;
    max-width: 320px;
  }

  .coach-section-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 12px;
  }

  .coach-bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .coach-bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    color: var(--muted);
    margin-bottom: 2px;
  }

  .dc-track-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    overflow: hidden;
  }

  .dc-fill-bar {
    height: 100%;
    border-radius: 3px;
    width: 0;
    transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .dc-fill-bar.duelists { background: #ff5757; box-shadow: 0 0 6px rgba(255,87,87,0.3); }
  .dc-fill-bar.initiators { background: #ffd700; box-shadow: 0 0 6px rgba(255,215,0,0.3); }
  .dc-fill-bar.controllers { background: #00d4e0; box-shadow: 0 0 6px rgba(0,212,224,0.3); }
  .dc-fill-bar.sentinels { background: #3ecf8e; box-shadow: 0 0 6px rgba(62,207,142,0.3); }
  .dc-fill-bar.entry { background: linear-gradient(90deg, #ff4655, #ff8080); }
  .dc-fill-bar.defense { background: linear-gradient(90deg, #3ecf8e, #00f2fe); }
  .dc-fill-bar.retake { background: linear-gradient(90deg, #ffb01f, #f53b57); }
  .dc-fill-bar.synergy { background: linear-gradient(90deg, #8c46ff, #e8ff47); }

  .coach-metrics-section, .coach-insights-section {
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 16px;
  }

  .coach-insights {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .coach-insights-empty {
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    padding: 16px;
  }

  .dc-insight-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 11px;
    line-height: 1.4;
    border-left: 3px solid transparent;
  }

  .dc-insight-card.good {
    background: rgba(62, 207, 142, 0.04);
    border-color: var(--win);
    color: #fff;
  }

  .dc-insight-card.warn {
    background: rgba(250, 68, 84, 0.04);
    border-color: var(--loss);
    color: #fff;
  }

  .dc-insight-card.tip {
    background: rgba(232, 255, 71, 0.04);
    border-color: #e8ff47;
    color: #fff;
  }

  .dc-insight-card-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  @media (max-width: 992px) {
    .coach-grid {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }
    .coach-view { padding: 14px; }
  }

  @media (max-width: 480px) {
    .dc-btn-row {
      flex-direction: column;
      gap: 8px;
    }
    .dc-btn-row button {
      width: 100%;
      flex: none;
    }
  }
</style>

<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { currentView } from '../../lib/appStore';
  import { latestPatch, allPatches } from '../../lib/patchStore';
  import {
    evaluateDraft, buildAroundMe, getAgentIconUrl, getRoleClass,
    MAPS, MAP_DISPLAY, DRAFT_MAP_RECOMMENDATIONS, getAgentDisplayName
  } from '../../lib/draft-engine';
  import ProComps from './ProComps.svelte';
  import AgentSelectorModal from './AgentSelectorModal.svelte';
  import { createShareCard } from '../../lib/api';

  const API_BASE = import.meta.env.PUBLIC_API_URL || '';

  export let playerAgentPool = {};

  let draftSlots = [null, null, null, null, null];
  let activeSlotIndex = null;
  let selectedMap = 'ascent';
  let evaluation = null;
  let savedComps = [];
  let selectorOpen = false;
  let selectedPatch = 'latest';

  let exportOpen = false;
  let exportLoading = false;
  let exportLoaded = false;
  let exportImgPreview = '';
  let exportShareUrl = '';
  let exportLoadingTxt = 'GENERATING DRAFT CARD...';
  let clipboardVisible = false;
  let templateText = '';

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
    selectedPatch = 'latest';
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

  async function exportDraftPNG() {
    const selected = draftSlots.filter(s => s !== null);
    if (selected.length < 5) {
      showToast('Select all 5 agents first.');
      return;
    }
    exportOpen = true;
    exportLoading = true;
    exportLoaded = false;
    exportImgPreview = '';
    exportShareUrl = '';
    exportLoadingTxt = 'GENERATING DRAFT CARD...';

    await tick();

    try {
      if (typeof html2canvas === 'undefined') {
        exportLoadingTxt = 'Loading image generator...';
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const mapCapitalized = (MAP_DISPLAY[selectedMap] || selectedMap).toUpperCase();
      const score = evaluation?.score ?? 0;
      const verdictTitle = evaluation?.verdictTitle || 'Draft';
      const verdictDesc = evaluation?.verdictDesc || '';

      const agentLineupHtml = draftSlots.map(ag => {
        const rawIcon = getAgentIconUrl(ag);
        let icon = rawIcon ? `/api/image?url=${encodeURIComponent(rawIcon)}` : '';
        if (icon && !icon.startsWith('http')) {
          icon = `${API_BASE}${icon}`;
        }
        const name = getAgentDisplayName(ag);
        return `<div style="display:flex; flex-direction:column; align-items:center; gap:4px; width:75px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:10px; box-sizing:border-box;">
          <img src="${icon}" style="width:38px; height:38px; border-radius:50%; border:2px solid rgba(255,68,84,0.3); display:block;">
          <span style="display:block; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:800; text-transform:uppercase; color:#fff; text-align:center; line-height:1.4; margin-top:4px; overflow:hidden; width:100%; white-space:nowrap; text-overflow:ellipsis; padding-bottom:2px;">${name}</span>
        </div>`;
      }).join('');

      const roleBarsHtml = evaluation.roleBars.map(bar => {
        const pct = Math.min((bar.current / bar.target) * 100, 100);
        const color = bar.id === 'duelists' ? '#ff4655' : bar.id === 'initiators' ? '#ffb01f' : bar.id === 'controllers' ? '#00f2fe' : '#3ecf8e';
        const label = bar.id.charAt(0).toUpperCase() + bar.id.slice(1);
        return `<table style="width:100%; border-collapse:collapse; margin-bottom:8px; border:none; padding:0;">
          <tr style="border:none; padding:0;">
            <td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:left; padding:0 0 4px 0; border:none; line-height:1.2;">${label}</td>
            <td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:right; padding:0 0 4px 0; border:none; line-height:1.2;">${bar.current} / ${bar.target}</td>
          </tr>
          <tr style="border:none; padding:0;">
            <td colspan="2" style="padding-top:4px; padding-bottom:0; border:none;">
              <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; width:100%; display:block;">
                <div style="width:${pct}%; height:100%; background:${color}; display:block;"></div>
              </div>
            </td>
          </tr>
        </table>`;
      }).join('');

      const metrics = evaluation.metrics;
      const metricsHtml = `<table style="width:100%; border-collapse:collapse; margin-bottom:8px; border:none; padding:0;"><tr style="border:none; padding:0;"><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:left; padding:0 0 4px 0; border:none; line-height:1.2;">Site Entry & Exec</td><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:right; padding:0 0 4px 0; border:none; line-height:1.2;">${metrics.entry}%</td></tr><tr style="border:none; padding:0;"><td colspan="2" style="padding-top:4px; padding-bottom:0; border:none;"><div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; width:100%; display:block;"><div style="width:${metrics.entry}%; height:100%; background:linear-gradient(90deg, #ff4655, #ff8080); display:block;"></div></div></td></tr></table><table style="width:100%; border-collapse:collapse; margin-bottom:8px; border:none; padding:0;"><tr style="border:none; padding:0;"><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:left; padding:0 0 4px 0; border:none; line-height:1.2;">Defensive Delay</td><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:right; padding:0 0 4px 0; border:none; line-height:1.2;">${metrics.defense}%</td></tr><tr style="border:none; padding:0;"><td colspan="2" style="padding-top:4px; padding-bottom:0; border:none;"><div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; width:100%; display:block;"><div style="width:${metrics.defense}%; height:100%; background:linear-gradient(90deg, #3ecf8e, #00f2fe); display:block;"></div></div></td></tr></table><table style="width:100%; border-collapse:collapse; margin-bottom:8px; border:none; padding:0;"><tr style="border:none; padding:0;"><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:left; padding:0 0 4px 0; border:none; line-height:1.2;">Retake & Scouting</td><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:right; padding:0 0 4px 0; border:none; line-height:1.2;">${metrics.retake}%</td></tr><tr style="border:none; padding:0;"><td colspan="2" style="padding-top:4px; padding-bottom:0; border:none;"><div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; width:100%; display:block;"><div style="width:${metrics.retake}%; height:100%; background:linear-gradient(90deg, #ffb01f, #f53b57); display:block;"></div></div></td></tr></table><table style="width:100%; border-collapse:collapse; margin-bottom:8px; border:none; padding:0;"><tr style="border:none; padding:0;"><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:left; padding:0 0 4px 0; border:none; line-height:1.2;">Synergy Factor</td><td style="font-size:8px; font-family:'DM Mono',monospace; color:#7e7e8a; text-align:right; padding:0 0 4px 0; border:none; line-height:1.2;">${metrics.synergy}%</td></tr><tr style="border:none; padding:0;"><td colspan="2" style="padding-top:4px; padding-bottom:0; border:none;"><div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; width:100%; display:block;"><div style="width:${metrics.synergy}%; height:100%; background:linear-gradient(90deg, #8c46ff, #e8ff47); display:block;"></div></div></td></tr></table>`;

      const insightsHtml = evaluation.insights.slice(0, 3).map(ins => {
        const borderColor = ins.type === 'warn' ? '#ff4655' : ins.type === 'tip' ? '#e8ff47' : '#3ecf8e';
        const bgColor = ins.type === 'warn' ? 'rgba(255,70,85,0.04)' : ins.type === 'tip' ? 'rgba(232,255,71,0.04)' : 'rgba(62,207,142,0.04)';
        return `<div style="background:${bgColor}; border:1px solid ${borderColor}; padding:8px 12px; border-radius:8px; display:flex; gap:8px; align-items:start; font-size:10px; color:#fff; line-height:1.4; text-align:left; margin-bottom:6px;">
          <span style="font-size:11px; flex-shrink:0;">${ins.icon}</span>
          <span>${ins.text}</span>
        </div>`;
      }).join('') || '<div style="font-size:9px; color:#7e7e8a; text-align:center; line-height:1.4; padding:8px 0;">No custom insights triggered for this comp.</div>';

      const container = document.getElementById('dc-export-container');
      if (!container) { exportOpen = false; return; }

      container.innerHTML = `
        <div id="dc-capture-target" style="width:480px; padding:24px; background:linear-gradient(135deg, #141416 0%, #0d0d0f 100%); border:2px solid #ff4655; border-radius:16px; color:#fff; font-family:'Barlow Condensed',sans-serif; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(255,70,85,0.2); padding-bottom:12px; margin-bottom:16px;">
            <div>
              <div style="font-size:22px; font-weight:900; letter-spacing:1px; color:#ff4655; text-transform:uppercase; line-height:1;">VALTRACKER</div>
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:#7e7e8a; text-transform:uppercase; margin-top:2px;">VCT Coach Verdict</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:18px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1;">${mapCapitalized}</div>
              <div style="font-family:'DM Mono',monospace; font-size:9px; color:#7e7e8a; text-transform:uppercase; margin-top:2px;">MAP SETTINGS</div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; gap:6px; margin-bottom:16px;">
            ${agentLineupHtml}
          </div>
          <div style="display:flex; align-items:center; gap:16px; background:rgba(255,70,85,0.04); border:1px solid rgba(255,70,85,0.12); padding:12px; border-radius:12px; margin-bottom:16px; box-sizing:border-box;">
            <div style="width:56px; height:56px; border-radius:50%; border:3px solid #ff4655; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(255,70,85,0.1); flex-shrink:0; box-sizing:border-box;">
              <div style="font-size:20px; font-weight:900; color:#ff4655; line-height:1;">${score}</div>
              <div style="font-size:7px; color:#7e7e8a; font-weight:bold; text-transform:uppercase; margin-top:3px;">SCORE</div>
            </div>
            <div style="text-align:left;">
              <div style="font-size:15px; font-weight:800; text-transform:uppercase; color:#fff; line-height:1.1;">${verdictTitle}</div>
              <div style="font-size:10px; color:#7e7e8a; margin:3px 0 0 0; line-height:1.2;">${verdictDesc}</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:2px;">📊 Role Balance</div>
              ${roleBarsHtml}
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:2px;">⚡ Coordination</div>
              ${metricsHtml}
            </div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#ff4655; margin-bottom:8px; text-align:left;">⚡ Coach Analysis Insights</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${insightsHtml}
            </div>
          </div>
        </div>
      `;

      showToast('Generating infographic card...');

      const el = document.getElementById('dc-capture-target');
      if (!el) { exportOpen = false; return; }

      // Wait for all images inside the capture target to load completely to prevent CORS caching issues
      const imgs = Array.from(el.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Wait for document fonts to be ready so that custom fonts (Barlow Condensed, DM Mono) are properly loaded and aligned
      if (document.fonts) {
        await document.fonts.ready;
      }

      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      exportImgPreview = canvas.toDataURL('image/png');

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          clipboardVisible = true;
        }
      } catch {
        clipboardVisible = false;
      }

      const mapName = (MAP_DISPLAY[selectedMap] || selectedMap).toUpperCase();
      templateText = `Drafted an epic 5-agent comp on ${mapName} rated ${score}/100 by VCT Coach!`;

      try {
        const res = await createShareCard({
          image: canvas.toDataURL('image/jpeg', 0.85),
          playerName: 'Draft Coach',
          playerTag: selectedMap,
          agentName: draftSlots.filter(Boolean).join(','),
          mapName: selectedMap,
          won: true,
          score: `${score}`
        });
        if (res.status === 'ok') {
          exportShareUrl = `${window.location.origin}/share/${res.share_id}`;
          templateText = templateText + ' ' + exportShareUrl;
        }
      } catch (e) {
        console.error('Share upload failed:', e);
      }

      exportLoading = false;
      exportLoaded = true;
    } catch (e) {
      console.error('[Draft Export Error]', e);
      exportLoadingTxt = 'Failed to generate card.';
      showToast('Export failed.');
      exportOpen = false;
    }
  }

  function shareDraft(platform) {
    const mapName = (MAP_DISPLAY[selectedMap] || selectedMap).toUpperCase();
    const score = evaluation?.score || 0;
    const title = `[ValTracker] Draft Coach — ${mapName} (Score: ${score}/100)`;
    const text = templateText;
    const encodedText = encodeURIComponent(text);

    if (platform === 'download') {
      const a = document.createElement('a');
      a.href = exportImgPreview;
      a.download = `valtracker_draft_${selectedMap}_${Date.now()}.png`;
      a.click();
    } else if (platform === 'twitter') {
      const urlWithBuster = exportShareUrl ? `${exportShareUrl}?v=${Date.now()}` : '';
      let cleanText = text;
      if (exportShareUrl && cleanText.includes(exportShareUrl)) {
        cleanText = cleanText.replace(exportShareUrl, '').trim();
      }
      const url = exportShareUrl
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanText)}&url=${encodeURIComponent(urlWithBuster)}`
        : `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(url, '_blank');
    } else if (platform === 'reddit') {
      const urlWithBuster = exportShareUrl ? `${exportShareUrl}?v=${Date.now()}` : '';
      const url = exportShareUrl
        ? `https://www.reddit.com/r/VALORANT/submit?url=${encodeURIComponent(urlWithBuster)}&title=${encodeURIComponent(title)}`
        : `https://www.reddit.com/r/VALORANT/submit?title=${encodeURIComponent(title)}`;
      window.open(url, '_blank');
    }
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

  $: scoreHex = evaluation
    ? evaluation.score >= 85 ? '#10b981'
      : evaluation.score >= 70 ? '#fa4454'
      : '#f43f5e'
    : '#a0a0ab';
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
        <!-- Map & Patch Selectors -->
        <div style="display:flex; gap:12px;">
          <div style="flex:1;">
            <label class="coach-label">Map</label>
            <select bind:value={selectedMap} on:change={handleMapChange} class="coach-select">
              {#each MAPS as map}
                <option value={map}>{MAP_DISPLAY[map]}</option>
              {/each}
            </select>
          </div>
          <div style="flex:0 0 140px;">
            <label class="coach-label">Patch</label>
            <select bind:value={selectedPatch} class="coach-select">
              <option value="latest">Latest ({$latestPatch || '...'})</option>
              {#each $allPatches as p}
                {#if p !== $latestPatch}
                  <option value={p}>{p}</option>
                {/if}
              {/each}
            </select>
          </div>
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
          <button class="fetch-btn dc-btn-primary" on:click={handleBuildAroundMe}>✨ Build Around Me</button>
          <button class="fetch-btn dc-btn-secondary" on:click={resetDraft}>↻ Clear</button>
        </div>

        <!-- Action Buttons Row 2 -->
        <div class="dc-btn-row">
          <button class="fetch-btn dc-btn-accent" on:click={saveCurrentDraft}>💾 Save Draft</button>
          <button class="fetch-btn dc-btn-export" on:click={exportDraftPNG}>📥 Export Lineup</button>
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
      <ProComps mapKey={selectedMap} patch={selectedPatch === 'latest' ? undefined : selectedPatch} />
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

<!-- Export Modal -->
{#if exportOpen}
  <div class="share-modal-overlay" class:open={exportOpen} on:click|self={() => exportOpen = false}>
    <div class="share-modal">
      <div class="share-modal-header">
        <div class="share-modal-title">Share Your Meta Comp Draft Card</div>
        <button class="share-modal-close" on:click={() => exportOpen = false}>&#10005;</button>
      </div>
      <div class="share-modal-body">
        {#if exportLoading}
          <div class="share-loading">
            <div class="share-spinner"></div>
            <div class="share-loading-txt">{exportLoadingTxt}</div>
          </div>
        {/if}
        {#if exportLoaded}
          <div class="share-loaded">
            <div class="share-preview-wrap">
              <img class="share-preview-img" src={exportImgPreview} alt="Draft Card Preview" />
              <div class="share-preview-badge">Draft Card Preview</div>
            </div>

            {#if clipboardVisible}
              <div class="share-clipboard-status">Copied to clipboard</div>
            {/if}

            <div>
              <div class="share-label">Post Template Text</div>
              <textarea class="share-textarea" bind:value={templateText}></textarea>
            </div>

            <div class="share-buttons">
              <button class="share-btn share-btn-twitter" on:click={() => shareDraft('twitter')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Post on X
              </button>
              <button class="share-btn share-btn-reddit" on:click={() => shareDraft('reddit')}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.23.73 4.29 1.97 5.95l-1.39 4.16c-.1.31.18.61.5.5l4.16-1.39C8.89 21.68 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.19 12.35c-.44.44-1.15.44-1.59 0L12 11.76l-2.6 2.6c-.44.44-1.15.44-1.59 0-.44-.44-.44-1.15 0-1.59l2.6-2.6-2.6-2.6c-.44-.44-.44-1.15 0-1.59.44-.44 1.15-.44 1.59 0l2.6 2.6 2.6-2.6c.44.44.44 1.15 0 1.59l-2.6 2.6 2.6 2.6c.44.44.44 1.15 0 1.59z"/></svg>
                Post on Reddit
              </button>
              <button class="share-btn share-btn-download" on:click={() => shareDraft('download')}>
                Download PNG
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Hidden container for draft card (filled by exportDraftPNG via innerHTML) -->
<div id="dc-export-container" style="position:absolute; left:-9999px; top:0;"></div>

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

  .dc-btn-export {
    flex: 1;
    margin: 0;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    color: #fff;
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

  .share-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .share-modal-overlay.open { display: flex; }

  .share-modal {
    max-width: 600px;
    width: 95%;
    background: linear-gradient(180deg, var(--surface, #0b0b0e) 0%, rgba(20,20,20,0.98) 100%);
    border: 1px solid rgba(250, 68, 84, 0.4);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }

  .share-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(250, 68, 84, 0.2);
  }

  .share-modal-title {
    color: var(--accent, #fa4454);
    font-size: 20px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .share-modal-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .share-modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 70vh;
    overflow-y: auto;
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
    color: var(--accent, #fa4454);
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
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.3);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .share-preview-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .share-preview-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.7);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .share-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 8px;
  }

  .share-btn {
    border: none;
    border-radius: 8px;
    padding: 12px 10px;
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
    transition: opacity 0.2s;
  }
  .share-btn:hover { opacity: 0.9; }

  .share-btn-twitter { background: #1d9bf0; color: #fff; }
  .share-btn-reddit { background: #ff4500; color: #fff; }
  .share-btn-download {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
  }
  .share-btn-download:hover { background: rgba(255,255,255,0.15); }

  .share-clipboard-status {
    text-align: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #3ecf8e;
    letter-spacing: 0.5px;
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
    height: 80px;
    background: var(--surface2, #18181c);
    border: 1px solid var(--border, rgba(255,255,255,0.05));
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
  .share-textarea:focus { border-color: rgba(255,70,85,0.5); }

  .share-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255,255,255,0.05);
    border-top-color: var(--accent, #fa4454);
    border-radius: 50%;
    animation: share-spin 0.8s linear infinite;
  }
  @keyframes share-spin { to { transform: rotate(360deg); } }
</style>

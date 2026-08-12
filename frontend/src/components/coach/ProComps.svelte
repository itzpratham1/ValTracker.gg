<script>
  import { getAgentIconUrl } from '../../lib/draft-engine';
  import { fetchMetaComps } from '../../lib/api';
  import { latestPatch, allPatches } from '../../lib/patchStore';

  export let mapKey = 'ascent';
  export let patch = undefined;

  let loading = true;
  let error = null;
  let proData = null;
  let emptyMessage = null;
  let lastFetchKey = '';

  $: fetchKey = `${mapKey}:${patch || 'latest'}`;
  $: if (fetchKey) {
    loadProComps();
  }

  async function loadProComps() {
    if (lastFetchKey === fetchKey && proData) return;

    const isInitialLoad = !proData;
    if (isInitialLoad) loading = true;
    error = null;

    try {
      const data = await fetchMetaComps(mapKey, patch);
      if (data.error || !data.total_comps_parsed) {
        proData = null;
        emptyMessage = data.message || 'No VCT pro data available yet for this map — data updates weekly.';
      } else {
        proData = data;
        emptyMessage = null;
        if (data.available_patches && data.available_patches.length > 0) {
          latestPatch.set(data.available_patches[0]);
          allPatches.set(data.available_patches);
        } else if (data.patch) {
          latestPatch.set(data.patch);
          allPatches.set([data.patch]);
        }
      }
      
      lastFetchKey = fetchKey;
    } catch (err) {
      console.error("Failed to load VCT Meta Comps:", err);
      if (isInitialLoad) error = "Failed to load pro composition data.";
    }

    if (isInitialLoad) loading = false;
  }

  function getAgentMiniIcon(ag) {
    return getAgentIconUrl(ag);
  }
</script>

<div class="section-label visible" style="margin-top: 10px; margin-bottom: 0;">
  <span class="sl-text">Compare Against the Pros</span>
  <div class="sl-line"></div>
</div>
<div class="card pro-comps-card" data-tour="coach-vct-meta">
  {#if loading}
    <div class="pro-comps-loading">Loading pro data...</div>
  {:else if error}
    <div class="pro-comps-error">{error}</div>
  {:else if !proData}
    <div class="pro-comps-empty">{emptyMessage}</div>
  {:else}
    <!-- Pro Compositions Side-by-Side -->
    <div class="pro-compositions-grid">
      <!-- Meta Favorite -->
      <div class="pro-comp-box accent-box">
        <div class="pro-comp-header">
          <span class="pro-comp-label accent">VCT Meta Favorite</span>
          <span class="pro-comp-stat">{proData.most_played_comp.picks} Picks</span>
        </div>
        <div class="pro-comp-lineup">
          {#if proData.most_played_comp.agents && proData.most_played_comp.agents.length === 5}
            {#each proData.most_played_comp.agents as ag}
              {@const icon = getAgentMiniIcon(ag)}
              <div class="pro-agent-mini" title={ag.toUpperCase()}>
                {#if icon}
                  <img src={icon} alt={ag} />
                {:else}
                  <span>?</span>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="pro-comp-no-data">No data</div>
          {/if}
        </div>
        <div class="pro-comp-footer">
          <span>Most Played Comp</span>
          <span class="pro-comp-wr">{proData.most_played_comp.win_rate}% WR</span>
        </div>
      </div>

      <!-- Win Rate Champion -->
      <div class="pro-comp-box gold-box">
        <div class="pro-comp-header">
          <span class="pro-comp-label gold">Elite Win-Rate Champion</span>
          <span class="pro-comp-stat">{proData.highest_winrate_comp.picks} Picks</span>
        </div>
        <div class="pro-comp-lineup">
          {#if proData.highest_winrate_comp.agents && proData.highest_winrate_comp.agents.length === 5}
            {#each proData.highest_winrate_comp.agents as ag}
              {@const icon = getAgentMiniIcon(ag)}
              <div class="pro-agent-mini gold-ring" title={ag.toUpperCase()}>
                {#if icon}
                  <img src={icon} alt={ag} />
                {:else}
                  <span>?</span>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="pro-comp-no-data">No data</div>
          {/if}
        </div>
        <div class="pro-comp-footer">
          <span>Highest Win Rate Comp</span>
          <span class="pro-comp-wr gold">{proData.highest_winrate_comp.win_rate}% WIN</span>
        </div>
      </div>
    </div>

    <!-- Agent Heatmap -->
    <div class="pro-heatmap-section">
      <div class="pro-heatmap-header">
        <h4 class="pro-heatmap-title">VCT Agent Heatmap (<span class="accent">{proData.patch}</span>)</h4>
        <span class="pro-heatmap-meta">{Math.round(proData.total_comps_parsed / 2)} matches ({proData.total_comps_parsed} comps)</span>
      </div>
      <div class="pro-heatmap-grid">
        {#each Object.entries(proData.agent_stats).sort((a, b) => b[1].pick_rate - a[1].pick_rate) as [ag, val]}
          {@const icon = getAgentMiniIcon(ag)}
          <div class="pro-heatmap-item">
            <div class="pro-heatmap-item-header">
              <div class="pro-heatmap-agent">
                <div class="pro-heatmap-agent-icon">
                  {#if icon}
                    <img src={icon} alt={ag} />
                  {:else}
                    <span>?</span>
                  {/if}
                </div>
                <span class="pro-heatmap-agent-name">{ag.toUpperCase()}</span>
              </div>
              <span class="pro-heatmap-pr">PR: <strong class="accent">{val.pick_rate}%</strong></span>
            </div>
            <div class="dc-track-bar pro-bar">
              <div class="dc-fill-bar" style="width:{val.pick_rate}%; height:100%; background:linear-gradient(90deg, var(--accent), #ff8080); box-shadow: 0 0 8px rgba(250,68,84,0.4);"></div>
            </div>
            <div class="pro-heatmap-wr">
              Win Rate: <span class="wr-val {val.win_rate >= 50 ? 'good' : 'avg'}">{val.win_rate}%</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .pro-comps-card {
    padding: 20px;
    background: rgba(0,0,0,0.25);
    border: 1px solid var(--border);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .pro-comps-loading, .pro-comps-empty, .pro-comps-error {
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    padding: 24px;
  }

  .pro-comps-error {
    color: var(--loss);
  }

  .pro-compositions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .pro-comp-box {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .pro-comp-box.accent-box {
    border-color: rgba(250, 68, 84, 0.2);
    background: linear-gradient(135deg, rgba(250, 68, 84, 0.05) 0%, rgba(0,0,0,0.1) 100%);
  }

  .pro-comp-box.accent-box:hover {
    border-color: rgba(250, 68, 84, 0.4);
    box-shadow: 0 4px 20px rgba(250, 68, 84, 0.1);
  }

  .pro-comp-box.gold-box {
    border-color: rgba(255, 215, 0, 0.18);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(0,0,0,0.1) 100%);
  }

  .pro-comp-box.gold-box:hover {
    border-color: rgba(255, 215, 0, 0.35);
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.08);
  }

  .pro-comp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pro-comp-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .pro-comp-label.accent { color: var(--accent); }
  .pro-comp-label.gold { color: #ffd700; }

  .pro-comp-stat {
    font-size: 9px;
    font-family: 'DM Mono', monospace;
    color: var(--muted);
  }

  .pro-comp-lineup {
    display: flex;
    gap: 8px;
    justify-content: start;
    min-height: 48px;
    align-items: center;
  }

  .pro-agent-mini {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: #141416;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }

  .pro-agent-mini:hover {
    transform: translateY(-2px) scale(1.08);
    border-color: var(--accent);
    box-shadow: 0 6px 16px rgba(250, 68, 84, 0.3);
  }

  .pro-agent-mini.gold-ring:hover {
    border-color: #ffd700;
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.25);
  }

  .pro-agent-mini img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .pro-comp-no-data {
    font-size: 10px;
    color: var(--muted);
    text-align: center;
    width: 100%;
  }

  .pro-comp-footer {
    font-size: 9px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 8px;
  }

  .pro-comp-wr { color: #fff; font-weight: bold; }
  .pro-comp-wr.gold { color: #ffd700; font-weight: 900; }

  .pro-heatmap-section {
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 14px;
  }

  .pro-heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .pro-heatmap-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    margin: 0;
    letter-spacing: 0.5px;
  }

  .pro-heatmap-meta {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted);
  }

  .pro-heatmap-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .pro-heatmap-item {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.2s;
  }

  .pro-heatmap-item:hover {
    border-color: rgba(250, 68, 84, 0.2);
    background: rgba(250, 68, 84, 0.03);
  }

  .pro-heatmap-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 9px;
    font-family: 'DM Mono', monospace;
    color: var(--muted);
  }

  .pro-heatmap-agent {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .pro-heatmap-agent-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1c1c22;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.12);
    overflow: hidden;
    flex-shrink: 0;
  }

  .pro-heatmap-agent-icon img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .pro-heatmap-agent-name {
    color: #fff;
    font-weight: bold;
    font-size: 9px;
  }

  .pro-heatmap-pr {
    font-size: 9px;
    white-space: nowrap;
  }

  .pro-bar {
    height: 7px !important;
    border-radius: 4px;
  }

  .pro-heatmap-wr {
    font-size: 8.5px;
    color: var(--muted);
    text-align: right;
  }

  .wr-val.good { color: #3ecf8e; font-weight: bold; }
  .wr-val.avg { color: rgba(255,255,255,0.6); }

  .accent { color: var(--accent); }
  .gold { color: #ffd700; font-weight: bold; }

  /* Scrollbar styling for heatmap */
  .pro-heatmap-grid::-webkit-scrollbar { width: 4px; }
  .pro-heatmap-grid::-webkit-scrollbar-track { background: transparent; }
  .pro-heatmap-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  .pro-heatmap-grid::-webkit-scrollbar-thumb:hover { background: rgba(250,68,84,0.3); }

  @media (max-width: 768px) {
    .pro-compositions-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .pro-heatmap-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .pro-comp-box { padding: 10px; }
    .pro-agent-mini { width: 32px; height: 32px; }
    .pro-comp-label { font-size: 10px; }
    .pro-comp-footer { font-size: 8.5px; }
    .pro-heatmap-title { font-size: 11px; }
  }
</style>

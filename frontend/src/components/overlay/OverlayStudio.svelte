<script>
  import { player } from '../../lib/appStore';
  import { onMount } from 'svelte';

  let name = '';
  let tag = '';
  let region = 'ap';
  let variant = 'competitive';
  let scale = 1.0;

  let colors = {
    accent: { picker: '#e8ff47', text: 'e8ff47' },
    bg: { picker: '#0f0f12', text: 'rgba(15, 15, 18, 0.85)' },
    text: { picker: '#f4f4f7', text: 'f4f4f7' },
    border: { picker: '#333333', text: 'rgba(255, 255, 255, 0.08)' }
  };

  let statsList = [
    { key: 'rank', label: 'Current Rank', checked: true },
    { key: 'peak', label: 'Peak Rank', checked: true },
    { key: 'winrate', label: 'Win Rate %', checked: true },
    { key: 'kd', label: 'K/D Ratio', checked: true },
    { key: 'acs', label: 'Avg ACS', checked: true },
    { key: 'avg_kills', label: 'Avg Kills', checked: false },
    { key: 'assists', label: 'Assists', checked: false },
    { key: 'daily_wl', label: 'Session W/L', checked: false },
    { key: 'session_winrate', label: 'Session Win %', checked: false },
    { key: 'session_kd', label: 'Session K/D', checked: false },
    { key: 'session_acs', label: 'Session ACS', checked: false }
  ];

  let containerWidth = 700;
  let containerHeight = 480;

  onMount(() => {
    if ($player.name && $player.tag) {
      name = $player.name;
      tag = $player.tag;
      region = $player.region || 'ap';
    }
  });

  function handleColorChange(key, type, val) {
    if (type === 'picker') {
      colors[key].picker = val;
      colors[key].text = val.replace('#', '');
    } else {
      colors[key].text = val;
      let cleaned = val.trim();
      if (!cleaned.startsWith('#')) cleaned = '#' + cleaned;
      if (/^#[0-9A-F]{3,8}$/i.test(cleaned)) {
        colors[key].picker = cleaned.substring(0, 7);
      }
    }
  }

  function copyObsUrl() {
    if (!name || !tag) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      if (window.showToast) window.showToast('OBS URL copied to clipboard!');
    });
  }

  let previewWidth = 600;
  let previewHeight = 200;

  $: {
    if (variant === 'center') {
      previewWidth = 720;
      previewHeight = 120;
    } else if (variant === 'flexible') {
      previewWidth = 320;
      previewHeight = 480;
    } else {
      previewWidth = 600;
      previewHeight = 200;
    }
  }

  $: previewScale = (() => {
    let scaleW = 1.0;
    if (previewWidth > (containerWidth - 40)) {
      scaleW = (containerWidth - 40) / previewWidth;
    }
    let scaleH = 1.0;
    if (previewHeight > (containerHeight - 40)) {
      scaleH = (containerHeight - 40) / previewHeight;
    }
    return Math.min(scaleW, scaleH);
  })();

  $: generatedUrl = (() => {
    if (!name || !tag) return '';
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://valtracker.live';
    let url = `${host}/overlay?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&variant=${variant}`;
    
    if (colors.accent.text) url += `&accent=${encodeURIComponent(colors.accent.text)}`;
    if (colors.bg.text) url += `&bg=${encodeURIComponent(colors.bg.text)}`;
    if (colors.text.text) url += `&text=${encodeURIComponent(colors.text.text)}`;
    if (colors.border.text) url += `&border=${encodeURIComponent(colors.border.text)}`;
    if (scale !== 1.0) url += `&scale=${scale}`;

    if (variant === 'flexible') {
      const active = statsList.filter(s => s.checked).map(s => s.key);
      if (active.length > 0) {
        url += `&stats=${active.join(',')}`;
      }
    }
    return url;
  })();
</script>

<div class="overlay-studio-container">
  <!-- Header Banner -->
  <div class="overlay-studio-header-banner">
    <h2>OBS Stream Overlay Studio</h2>
    <p>Design premium, real-time telemetry overlays for your stream. Configure color schemes, layout scaling, and stats packages, then paste the generated URL into an OBS Browser Source.</p>
  </div>

  <!-- Dashboard Split Grid -->
  <div class="overlay-studio-grid">
    
    <!-- LEFT PANEL: Simulated Live Stream Preview -->
    <div class="overlay-studio-preview-col">
      <div class="overlay-studio-label">Live Overlay Preview (Scale Simulator)</div>
      <div class="overlay-studio-canvas" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
        <div class="overlay-studio-backdrop"></div>
        
        {#if !name || !tag}
          <div style="font-family:'DM Mono',monospace; font-size:11px; color:var(--muted); text-align:center; padding: 40px; z-index: 2;">
            Enter a player's Name and Tag to generate the stream overlay preview.
          </div>
        {:else}
          <div class="overlay-studio-sandbox" style="width: {previewWidth * previewScale}px; height: {previewHeight * previewScale}px; display: flex; align-items: center; justify-content: center; position: relative;">
            <iframe src={generatedUrl} style="border: none; background: transparent; width: {previewWidth}px; height: {previewHeight}px; overflow: hidden; transform: scale({previewScale}); transform-origin: center center; position: absolute;" scrolling="no" title="Stream Overlay Preview"></iframe>
          </div>
        {/if}
      </div>
    </div>

    <!-- RIGHT PANEL: Settings Sidebar -->
    <div class="overlay-studio-settings-col">
      <!-- 1. Profile Linker -->
      <div class="overlay-settings-group">
        <h3>1. Link Player Profile</h3>
        <div class="overlay-settings-row">
          <input class="overlay-studio-input overlay-studio-name-input" type="text" placeholder="Name" bind:value={name} autocomplete="off" spellcheck="false">
          <span class="overlay-studio-hash">#</span>
          <input class="overlay-studio-input overlay-studio-tag-input" type="text" placeholder="TAG" bind:value={tag} maxlength="8" autocomplete="off" spellcheck="false">
          <select class="overlay-studio-select" bind:value={region}>
            <option value="ap">AP</option>
            <option value="na">NA</option>
            <option value="eu">EU</option>
            <option value="kr">KR</option>
          </select>
        </div>
      </div>

      <!-- 2. Select Layout Preset -->
      <div class="overlay-settings-group">
        <h3>2. Select Layout Preset</h3>
        <select class="overlay-studio-select-large" bind:value={variant}>
          <option value="competitive">Competitive Overlay (Agent History & Rank Info)</option>
          <option value="center">Center HUD Overlay (Horizontal Bar HUD)</option>
          <option value="flexible">Flexible Stats Panel (Vertical Custom Checklist)</option>
        </select>
      </div>

      <!-- 3. Flexible Stats selection -->
      {#if variant === 'flexible'}
        <div class="overlay-settings-group">
          <h3>3. Select Display Stats</h3>
          <div class="stats-checklist-grid">
            {#each statsList as item}
              <label class="chk-label">
                <input type="checkbox" bind:checked={item.checked}>
                {item.label}
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 4. Theme customization -->
      <div class="overlay-settings-group">
        <h3>3. Customize Colors &amp; Scale</h3>
        <div class="colors-controls-grid">
          <div class="color-picker-control">
            <label>Accent Color</label>
            <div class="color-picker-input-wrap">
              <input type="color" value={colors.accent.picker} on:input={(e) => handleColorChange('accent', 'picker', e.target.value)}>
              <input type="text" value={colors.accent.text} on:input={(e) => handleColorChange('accent', 'text', e.target.value)}>
            </div>
          </div>
          <div class="color-picker-control">
            <label>Background</label>
            <div class="color-picker-input-wrap">
              <input type="color" value={colors.bg.picker} on:input={(e) => handleColorChange('bg', 'picker', e.target.value)}>
              <input type="text" value={colors.bg.text} on:input={(e) => handleColorChange('bg', 'text', e.target.value)}>
            </div>
          </div>
          <div class="color-picker-control">
            <label>Text Color</label>
            <div class="color-picker-input-wrap">
              <input type="color" value={colors.text.picker} on:input={(e) => handleColorChange('text', 'picker', e.target.value)}>
              <input type="text" value={colors.text.text} on:input={(e) => handleColorChange('text', 'text', e.target.value)}>
            </div>
          </div>
          <div class="color-picker-control">
            <label>Border Color</label>
            <div class="color-picker-input-wrap">
              <input type="color" value={colors.border.picker} on:input={(e) => handleColorChange('border', 'picker', e.target.value)}>
              <input type="text" value={colors.border.text} on:input={(e) => handleColorChange('border', 'text', e.target.value)}>
            </div>
          </div>
        </div>
        <div class="scale-slider-control">
          <div class="scale-slider-header">
            <label>Overlay Scale (OBS Multiplier)</label>
            <span class="scale-slider-val">{scale.toFixed(2)}x</span>
          </div>
          <input type="range" min="0.5" max="1.5" step="0.05" bind:value={scale} class="scale-range-input">
        </div>
      </div>

      <!-- 5. Generate Link & Setup Guide -->
      <div class="overlay-settings-group final-link-box">
        <h3>4. Generate OBS URL</h3>
        <div class="obs-url-row">
          <input type="text" readonly value={generatedUrl || 'Please enter name and tag first'} on:click={(e) => e.target.select()} class="obs-url-input">
          <button class="fetch-btn copy-url-btn" on:click={copyObsUrl}>Copy URL</button>
        </div>
        
        <div class="obs-setup-guide">
          <h4>How to add to OBS Studio:</h4>
          <ol>
            <li>In OBS, click <strong>+</strong> under the <em>Sources</em> panel.</li>
            <li>Select <strong>Browser Source</strong> and name it (e.g. "Valorant Overlay").</li>
            <li>Paste the copied URL into the <strong>URL</strong> field.</li>
            <li>Set the Width and Height based on your layout:
              <ul>
                <li>Competitive: <strong>600 x 200</strong></li>
                <li>Center HUD: <strong>720 x 120</strong></li>
                <li>Flexible Panel: <strong>320 x 480</strong></li>
              </ul>
            </li>
            <li>Click <strong>OK</strong> and position it on your stream canvas!</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .overlay-studio-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 16px;
    padding-bottom: 110px;
    overflow-x: hidden;
  }

  .overlay-studio-header-banner {
    background: linear-gradient(135deg, rgba(250, 68, 84, 0.12) 0%, rgba(20, 20, 22, 0.6) 100%);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
    width: 100%;
  }

  .overlay-studio-header-banner h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 900;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 1.5px;
    margin: 0;
  }

  .overlay-studio-header-banner p {
    font-size: 13px;
    color: var(--muted, #9494a0);
    margin: 0;
    max-width: 700px;
    line-height: 1.5;
  }

  .overlay-studio-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .overlay-studio-preview-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .overlay-studio-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted, #9494a0);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .overlay-studio-canvas {
    background: radial-gradient(circle, rgba(25, 25, 30, 0.6) 0%, rgba(5, 5, 8, 0.95) 100%);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    height: 440px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    width: 100%;
    box-sizing: border-box;
  }

  .overlay-studio-settings-col {
    background: var(--surface, #121216);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .overlay-settings-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    padding-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .overlay-settings-group:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }

  .overlay-settings-group h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 15px;
    text-transform: uppercase;
    color: var(--accent, #fa4454);
    letter-spacing: 0.5px;
    margin: 0;
  }

  .overlay-settings-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .overlay-studio-name-input {
    flex: 1 1 0%;
    min-width: 0;
    background: var(--surface2, #1a1a22);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    height: 38px;
    box-sizing: border-box;
    outline: none;
  }

  .overlay-studio-hash {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--muted, #9494a0);
    font-weight: 700;
    flex-shrink: 0;
  }

  .overlay-studio-tag-input {
    width: 70px;
    flex-shrink: 0;
    background: var(--surface2, #1a1a22);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    color: #fff;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    height: 38px;
    box-sizing: border-box;
    outline: none;
    font-family: 'DM Mono', monospace;
  }

  .overlay-studio-select {
    width: 65px;
    flex-shrink: 0;
    background: var(--surface2, #1a1a22);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    color: #fff;
    padding: 8px 6px;
    border-radius: 6px;
    font-size: 12px;
    height: 38px;
    box-sizing: border-box;
    outline: none;
    font-family: 'DM Mono', monospace;
    cursor: pointer;
  }

  .overlay-studio-select-large {
    background: var(--surface2, #1a1a22);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    color: #fff;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    font-size: 13px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .colors-controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .color-picker-control {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .color-picker-control label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #9494a0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .color-picker-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface2, #1a1a22);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    padding: 4px 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .color-picker-input-wrap input[type="text"] {
    flex: 1 1 0%;
    min-width: 0;
    background: transparent;
    border: none;
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    outline: none;
    width: 100%;
  }

  .scale-slider-control {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .scale-slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .scale-slider-header label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted, #9494a0);
  }

  .scale-slider-val {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--accent, #fa4454);
    font-weight: 700;
  }

  .scale-range-input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    accent-color: var(--accent, #fa4454);
    cursor: pointer;
    margin: 4px 0 0 0;
    display: block;
  }

  .final-link-box {
    border: 1px solid rgba(250, 68, 84, 0.2);
    background: rgba(250, 68, 84, 0.03);
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .obs-url-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .obs-url-input {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    background: var(--surface2, #1a1a22) !important;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1)) !important;
    color: #fff !important;
    padding: 10px 12px;
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    outline: none;
    text-overflow: ellipsis;
    -webkit-appearance: none;
  }

  .copy-url-btn {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    background: var(--accent, #fa4454);
    color: #ffffff;
    font-weight: 800;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    letter-spacing: 1px;
    text-transform: uppercase;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .obs-setup-guide {
    font-size: 12px;
    color: var(--muted, #9494a0);
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    padding-top: 12px;
    width: 100%;
    box-sizing: border-box;
    padding-right: 12px;
    white-space: normal;
    word-break: break-word;
  }

  .obs-setup-guide h4 {
    color: #fff;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    text-transform: uppercase;
    margin: 0 0 6px 0;
    letter-spacing: 0.5px;
  }

  .obs-setup-guide ol {
    padding-left: 16px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    line-height: 1.4;
    white-space: normal;
  }

  .obs-setup-guide li, .obs-setup-guide strong {
    white-space: normal !important;
    word-break: break-word !important;
    text-overflow: clip !important;
  }

  .obs-setup-guide ul {
    margin-top: 2px;
    padding-left: 16px;
    color: var(--accent, #fa4454);
    list-style-type: square;
  }

  @media (max-width: 900px) {
    .overlay-studio-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .overlay-studio-canvas {
      height: 280px;
    }
  }

  @media (max-width: 600px) {
    .overlay-studio-container {
      padding: 12px;
      padding-bottom: 110px;
    }
    .overlay-studio-header-banner {
      padding: 14px;
      margin-bottom: 14px;
    }
    .overlay-studio-header-banner h2 {
      font-size: 22px;
    }
    .overlay-studio-settings-col {
      padding: 14px;
    }
  }
</style>

<script>
  import { player } from '../../lib/appStore';
  import { onMount } from 'svelte';
  import OnboardingGuide from '../shared/OnboardingGuide.svelte';

  let name = '';
  let tag = '';
  let region = 'ap';
  let variant = 'competitive';
  let scale = 1.0;
  let copied = false;
  let obsGuideOpen = false;
  let tourOpen = false;

  let monitorEl;
  let showScrollToPreview = false;

  // Theme presets
  const THEME_PRESETS = [
    { name: 'Val Red',    accent: 'fa4454', bg: 'rgba(15,15,18,0.92)',   text: 'f4f4f7', border: 'rgba(250,68,84,0.15)' },
    { name: 'Neon',       accent: 'e8ff47', bg: 'rgba(10,12,10,0.92)',   text: 'f0f7e0', border: 'rgba(232,255,71,0.15)' },
    { name: 'Ice Blue',   accent: '4af3ff', bg: 'rgba(8,14,20,0.92)',    text: 'e8f4ff', border: 'rgba(74,243,255,0.15)' },
    { name: 'Ghost',      accent: 'ffffff', bg: 'rgba(0,0,0,0.75)',       text: 'cccccc', border: 'rgba(255,255,255,0.12)' },
    { name: 'Jade',       accent: '3ecf8e', bg: 'rgba(8,18,14,0.92)',    text: 'e0f7ee', border: 'rgba(62,207,142,0.15)' },
  ];

  let colors = {
    accent: { picker: '#fa4454', text: 'fa4454' },
    bg:     { picker: '#0f0f12', text: 'rgba(15,15,18,0.92)' },
    text:   { picker: '#f4f4f7', text: 'f4f4f7' },
    border: { picker: '#333333', text: 'rgba(250,68,84,0.15)' }
  };

  let statsList = [
    { key: 'rank',            label: 'Current Rank',   checked: true },
    { key: 'peak',            label: 'Peak Rank',      checked: true },
    { key: 'winrate',         label: 'Win Rate %',     checked: true },
    { key: 'kd',              label: 'K/D Ratio',      checked: true },
    { key: 'acs',             label: 'Avg ACS',        checked: true },
    { key: 'avg_kills',       label: 'Avg Kills',      checked: false },
    { key: 'assists',         label: 'Assists',        checked: false },
    { key: 'daily_wl',        label: 'Session W/L',    checked: false },
    { key: 'session_winrate', label: 'Session Win %',  checked: false },
    { key: 'session_kd',      label: 'Session K/D',    checked: false },
    { key: 'session_acs',     label: 'Session ACS',    checked: false },
  ];

  let containerWidth = 700;
  let containerHeight = 480;

  onMount(() => {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('valtracker_tour_overlay')) {
      localStorage.setItem('valtracker_tour_overlay', 'true');
      setTimeout(() => {
        tourOpen = true;
      }, 700);
    }

    if ($player.name && $player.tag) {
      name = $player.name;
      tag  = $player.tag;
      region = $player.region || 'ap';
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qName = urlParams.get('name') || urlParams.get('player');
      const qTag = urlParams.get('tag');
      const qRegion = urlParams.get('region');
      if (qName) name = qName;
      if (qTag) tag = qTag;
      if (qRegion) region = qRegion;
    }

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && monitorEl) {
      const observer = new IntersectionObserver(([entry]) => {
        showScrollToPreview = !entry.isIntersecting;
      }, { threshold: 0.15 });
      observer.observe(monitorEl);
      return () => observer.disconnect();
    }
  });

  function scrollToMonitor() {
    if (monitorEl) {
      monitorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleColorChange(key, type, val) {
    if (type === 'picker') {
      colors[key].picker = val;
      colors[key].text   = val.replace('#', '');
    } else {
      colors[key].text = val;
      let cleaned = val.trim();
      if (!cleaned.startsWith('#')) cleaned = '#' + cleaned;
      if (/^#[0-9A-F]{3,8}$/i.test(cleaned)) {
        colors[key].picker = cleaned.substring(0, 7);
      }
    }
  }

  function applyTheme(preset) {
    colors = {
      accent: { picker: '#' + preset.accent, text: preset.accent },
      bg:     { picker: '#0f0f12',            text: preset.bg },
      text:   { picker: '#' + preset.text,    text: preset.text },
      border: { picker: '#333333',            text: preset.border },
    };
  }

  function copyObsUrl() {
    if (!name || !tag) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      copied = true;
      setTimeout(() => copied = false, 2000);
      if (window.showToast) window.showToast('OBS URL copied to clipboard!');
    });
  }

  function openPreview() {
    if (generatedUrl) window.open(generatedUrl, '_blank');
  }

  function resetScale() { scale = 1.0; }

  let previewWidth  = 600;
  let previewHeight = 200;

  $: {
    if (variant === 'center') {
      previewWidth  = 720;
      previewHeight = 120;
    } else if (variant === 'flexible') {
      previewWidth  = 320;
      previewHeight = 480;
    } else {
      previewWidth  = 600;
      previewHeight = 200;
    }
  }

  $: previewScale = (() => {
    if (!containerWidth || !containerHeight) return 1.0;
    const padding = (typeof window !== 'undefined' && window.innerWidth < 600) ? 20 : 36;
    let scaleW = 1.0;
    if (previewWidth > (containerWidth - padding)) scaleW = (containerWidth - padding) / previewWidth;
    let scaleH = 1.0;
    if (previewHeight > (containerHeight - padding)) scaleH = (containerHeight - padding) / previewHeight;
    return Math.min(scaleW, scaleH);
  })();

  $: generatedUrl = (() => {
    if (!name || !tag) return '';
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://valtracker.live';
    let url = `${host}/overlay/widget?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&variant=${variant}`;
    if (colors.accent.text) url += `&accent=${encodeURIComponent(colors.accent.text)}`;
    if (colors.bg.text)     url += `&bg=${encodeURIComponent(colors.bg.text)}`;
    if (colors.text.text)   url += `&text=${encodeURIComponent(colors.text.text)}`;
    if (colors.border.text) url += `&border=${encodeURIComponent(colors.border.text)}`;
    if (scale !== 1.0)      url += `&scale=${scale}`;
    if (variant === 'flexible') {
      const active = statsList.filter(s => s.checked).map(s => s.key);
      if (active.length > 0) url += `&stats=${active.join(',')}`;
    }
    return url;
  })();

  // Dynamic step number for Colors section
  $: colorStepNum = variant === 'flexible' ? 4 : 3;
  $: urlStepNum   = variant === 'flexible' ? 5 : 4;

  const PRESET_CARDS = [
    {
      value: 'competitive',
      label: 'Competitive',
      desc:  'Agent history + rank',
      icon:  `<svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="28" rx="4" fill="rgba(0,0,0,0.5)"/>
        <circle cx="8" cy="14" r="5" fill="currentColor" opacity="0.8"/>
        <rect x="16" y="10" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.7"/>
        <rect x="16" y="15" width="14" height="2" rx="1" fill="currentColor" opacity="0.4"/>
        <circle cx="36" cy="8" r="2.5" fill="currentColor" opacity="0.5"/>
        <circle cx="40" cy="8" r="2.5" fill="currentColor" opacity="0.3"/>
      </svg>`,
    },
    {
      value: 'center',
      label: 'Center HUD',
      desc:  'Horizontal stats bar',
      icon:  `<svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="28" rx="4" fill="rgba(0,0,0,0.5)"/>
        <rect x="2" y="11" width="40" height="6" rx="3" fill="currentColor" opacity="0.15"/>
        <rect x="4" y="12" width="8" height="4" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="14" y="12" width="8" height="4" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="24" y="12" width="8" height="4" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="34" y="12" width="6" height="4" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>`,
    },
    {
      value: 'flexible',
      label: 'Flexible',
      desc:  'Vertical custom panel',
      icon:  `<svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="28" rx="4" fill="rgba(0,0,0,0.5)"/>
        <rect x="14" y="3" width="16" height="5" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="10" y="10" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="10" y="15" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="10" y="20" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5"/>
      </svg>`,
    },
  ];
</script>

<div class="ost-container">

  <!-- ═══ HEADER BANNER ═══ -->
  <div class="ost-header" style="position:relative;" data-tour="overlay-studio">
    <div class="ost-header-top-row">
      <div class="ost-header-left">
        <div class="ost-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/>
            <rect x="2" y="7" width="13" height="10" rx="2"/>
            <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" opacity="0.5"/>
          </svg>
        </div>
        <div class="ost-header-title-group">
          <h2>OBS Stream Overlay Studio</h2>
          <div class="ost-header-badge">
            <span class="ost-live-dot"></span>LIVE DATA
          </div>
        </div>
      </div>
      <button class="tour-btn-trigger" on:click={() => tourOpen = true} title="Launch Feature Tour">
        <span style="color:var(--accent,#fa4454);">⚡</span> Feature Tour
      </button>
    </div>
    <p class="ost-header-desc">Design real-time telemetry overlays for your stream. Configure layouts, color themes, and stats — then drop the generated URL into an OBS Browser Source.</p>
  </div>

  <!-- ═══ MAIN GRID ═══ -->
  <div class="ost-grid">

    <!-- LEFT: Stream Monitor Preview -->
    <div class="ost-preview-col">
      <div class="ost-preview-label">
        <span>Live Overlay Preview</span>
        <span class="ost-preview-hint">Scale Simulator</span>
      </div>
      <div
        class="ost-monitor"
        class:flexible-mode={variant === 'flexible'}
        bind:this={monitorEl}
        bind:clientWidth={containerWidth}
        bind:clientHeight={containerHeight}
      >
        <!-- Scanline grid texture -->
        <div class="ost-monitor-grid"></div>

        <!-- LIVE badge -->
        <div class="ost-monitor-live-badge">
          <span class="ost-live-dot small"></span>
          LIVE
        </div>

        <!-- Corner decorations -->
        <div class="ost-corner tl"></div>
        <div class="ost-corner tr"></div>
        <div class="ost-corner bl"></div>
        <div class="ost-corner br"></div>

        {#if !name || !tag}
          <div class="ost-monitor-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/>
              <rect x="2" y="7" width="13" height="10" rx="2"/>
            </svg>
            <p>Enter a player name &amp; tag<br>to preview the overlay</p>
          </div>
        {:else}
          <div class="ost-monitor-sandbox"
            style="width:{previewWidth * previewScale}px; height:{previewHeight * previewScale}px;">
            <iframe
              src={generatedUrl}
              style="border:none; background:transparent; width:{previewWidth}px; height:{previewHeight}px; overflow:hidden; transform:scale({previewScale}); transform-origin:center center; position:absolute;"
              scrolling="no"
              title="Stream Overlay Preview">
            </iframe>
          </div>
        {/if}

        <!-- Bottom bar -->
        <div class="ost-monitor-bar">
          <span class="ost-monitor-res">{previewWidth} × {previewHeight}px</span>
          <span class="ost-monitor-brand">ValTracker.gg</span>
        </div>
      </div>
    </div>

    <!-- RIGHT: Settings Panel -->
    <div class="ost-settings">

      <!-- ── STEP 1: Link Profile ── -->
      <div class="ost-step">
        <div class="ost-step-head">
          <span class="ost-step-num">01</span>
          <h3>Link Player Profile</h3>
        </div>
        <div class="ost-profile-row">
          <input
            class="ost-input ost-input-name"
            type="text"
            placeholder="Riot Name"
            bind:value={name}
            autocomplete="off"
            spellcheck="false"
          >
          <span class="ost-hash">#</span>
          <input
            class="ost-input ost-input-tag"
            type="text"
            placeholder="TAG"
            bind:value={tag}
            maxlength="8"
            autocomplete="off"
            spellcheck="false"
          >
          <select class="ost-select-sm" bind:value={region}>
            <option value="ap">AP</option>
            <option value="na">NA</option>
            <option value="eu">EU</option>
            <option value="kr">KR</option>
          </select>
        </div>
      </div>

      <!-- ── STEP 2: Layout Preset ── -->
      <div class="ost-step">
        <div class="ost-step-head">
          <span class="ost-step-num">02</span>
          <h3>Select Layout</h3>
        </div>
        <div class="ost-preset-cards">
          {#each PRESET_CARDS as card}
            <button
              class="ost-preset-card {variant === card.value ? 'active' : ''}"
              on:click={() => variant = card.value}
              type="button"
            >
              <div class="ost-preset-icon" style="color: {variant === card.value ? '#' + colors.accent.text : 'rgba(255,255,255,0.4)'}">
                {@html card.icon}
              </div>
              <div class="ost-preset-info">
                <span class="ost-preset-label">{card.label}</span>
                <span class="ost-preset-desc">{card.desc}</span>
              </div>
              {#if variant === card.value}
                <div class="ost-preset-check">✓</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- ── STEP 3 (flexible only): Select Stats ── -->
      {#if variant === 'flexible'}
        <div class="ost-step" data-tour="overlay-stats">
          <div class="ost-step-head">
            <span class="ost-step-num">03</span>
            <h3>Select Display Stats</h3>
          </div>
          <div class="ost-stats-grid">
            {#each statsList as item}
              <label class="ost-chk">
                <input type="checkbox" bind:checked={item.checked}>
                <span class="ost-chk-box"></span>
                <span class="ost-chk-text">{item.label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- ── STEP 3/4: Colors & Scale ── -->
      <div class="ost-step" data-tour="overlay-themes">
        <div class="ost-step-head">
          <span class="ost-step-num">{colorStepNum < 10 ? '0' + colorStepNum : colorStepNum}</span>
          <h3>Colors &amp; Scale</h3>
        </div>

        <!-- Theme quick-presets -->
        <div class="ost-themes">
          {#each THEME_PRESETS as preset}
            <button
              class="ost-theme-chip"
              style="--chip-color: #{preset.accent}"
              on:click={() => applyTheme(preset)}
              type="button"
              title={preset.name}
            >
              <span class="ost-theme-dot" style="background: #{preset.accent}"></span>
              {preset.name}
            </button>
          {/each}
        </div>

        <!-- Color pickers grid -->
        <div class="ost-colors-grid">
          {#each [
            { key: 'accent', label: 'Accent' },
            { key: 'bg',     label: 'Background' },
            { key: 'text',   label: 'Text' },
            { key: 'border', label: 'Border' }
          ] as c}
            <div class="ost-color-field">
              <label class="ost-color-label">{c.label}</label>
              <div class="ost-color-wrap">
                <div class="ost-color-swatch" style="background: #{colors[c.key].picker.replace('#','')}">
                  <input
                    type="color"
                    value={colors[c.key].picker}
                    on:input={(e) => handleColorChange(c.key, 'picker', e.target.value)}
                  >
                </div>
                <input
                  class="ost-color-text"
                  type="text"
                  value={colors[c.key].text}
                  on:input={(e) => handleColorChange(c.key, 'text', e.target.value)}
                >
              </div>
            </div>
          {/each}
        </div>

        <!-- Scale slider -->
        <div class="ost-scale">
          <div class="ost-scale-header">
            <label>Overlay Scale</label>
            <div class="ost-scale-right">
              <span class="ost-scale-val">{scale.toFixed(2)}×</span>
              {#if scale !== 1.0}
                <button class="ost-scale-reset" on:click={resetScale} type="button">Reset</button>
              {/if}
            </div>
          </div>
          <div class="ost-scale-track">
            <input type="range" min="0.5" max="1.5" step="0.05" bind:value={scale} class="ost-range">
            <div class="ost-scale-ticks">
              <span>0.5×</span>
              <span>1.0×</span>
              <span>1.5×</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── STEP 4/5: Generate URL ── -->
      <div class="ost-step ost-step-url" data-tour="overlay-url">
        <div class="ost-step-head">
          <span class="ost-step-num">{urlStepNum < 10 ? '0' + urlStepNum : urlStepNum}</span>
          <h3>Generate OBS URL</h3>
        </div>

        <div class="ost-url-box">
          <input
            type="text"
            readonly
            value={generatedUrl || 'Enter name & tag to generate your URL'}
            on:click={(e) => e.target.select()}
            class="ost-url-input"
          >
        </div>

        <div class="ost-url-actions">
          <button
            class="ost-copy-btn {copied ? 'copied' : ''}"
            on:click={copyObsUrl}
            disabled={!generatedUrl}
            type="button"
          >
            {#if copied}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy URL
            {/if}
          </button>
          <button
            class="ost-preview-btn"
            on:click={openPreview}
            disabled={!generatedUrl}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open Preview
          </button>
        </div>

        <!-- OBS Setup Guide (accordion) -->
        <div class="ost-guide-accordion">
          <button
            class="ost-guide-toggle"
            on:click={() => obsGuideOpen = !obsGuideOpen}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            How to add to OBS Studio
            <svg class="ost-guide-chevron {obsGuideOpen ? 'open' : ''}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {#if obsGuideOpen}
            <div class="ost-guide-body">
              <ol>
                <li>In OBS, click <strong>+</strong> under the <em>Sources</em> panel.</li>
                <li>Select <strong>Browser Source</strong> and name it (e.g. "Valorant Overlay").</li>
                <li>Paste the copied URL into the <strong>URL</strong> field.</li>
                <li>Set Width × Height based on your layout:
                  <ul>
                    <li>Competitive: <strong>600 × 200</strong></li>
                    <li>Center HUD: <strong>720 × 120</strong></li>
                    <li>Flexible Panel: <strong>320 × 480</strong></li>
                  </ul>
                </li>
                <li>Click <strong>OK</strong> and position it on your stream canvas!</li>
              </ol>
            </div>
          {/if}
        </div>
      </div>

    </div>
  </div>
</div>

<OnboardingGuide section="overlay" bind:open={tourOpen} onClose={() => tourOpen = false} />

<!-- Mobile Floating Jump to Preview Button -->
{#if showScrollToPreview}
  <button class="ost-floating-preview-btn" on:click={scrollToMonitor} type="button" aria-label="Jump to preview">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <span>Preview</span>
  </button>
{/if}

<style>
  /* ═══════════════════════════════════════
     CONTAINER
  ═══════════════════════════════════════ */
  .ost-container {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 20px 24px 110px;
    overflow-x: hidden;
  }

  /* ═══════════════════════════════════════
     HEADER BANNER
  ═══════════════════════════════════════ */
  .ost-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: linear-gradient(135deg, rgba(250,68,84,0.12) 0%, rgba(20,20,26,0.65) 60%, rgba(10,10,14,0.5) 100%);
    border: 1px solid rgba(250,68,84,0.2);
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  .ost-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(250,68,84,0.6), transparent);
  }

  .ost-header-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 4px;
    width: 100%;
  }

  .ost-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  .ost-header-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    background: rgba(250,68,84,0.12);
    border: 1px solid rgba(250,68,84,0.25);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fa4454;
  }

  .ost-header-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .ost-header-title-group h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 1.2px;
    margin: 0;
    line-height: 1.1;
  }

  .ost-header-desc {
    font-size: 13px;
    color: var(--muted, #9494a0);
    margin: 0;
    line-height: 1.55;
    max-width: 680px;
  }

  .ost-header-badge {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(250,68,84,0.12);
    border: 1px solid rgba(250,68,84,0.28);
    border-radius: 20px;
    padding: 4px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #fa4454;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  /* ═══════════════════════════════════════
     LIVE DOT
  ═══════════════════════════════════════ */
  .ost-live-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    background: #fa4454;
    border-radius: 50%;
    animation: livePulse 1.8s ease-in-out infinite;
  }
  .ost-live-dot.small {
    width: 6px;
    height: 6px;
  }

  @keyframes livePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }

  /* ═══════════════════════════════════════
     MAIN GRID
  ═══════════════════════════════════════ */
  .ost-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
    align-items: start;
  }

  .ost-preview-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: sticky;
    top: 16px;
  }

  .ost-preview-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted, #9494a0);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .ost-preview-hint {
    color: rgba(148,148,160,0.5);
  }

  /* ═══════════════════════════════════════
     STREAM MONITOR
  ═══════════════════════════════════════ */
  .ost-monitor {
    position: relative;
    background: #04040a;
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    height: 440px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 20px 60px rgba(0,0,0,0.7),
      inset 0 1px 0 rgba(255,255,255,0.05);
    transition: height 0.25s ease;
  }

  /* Scanline grid */
  .ost-monitor-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  /* Corner decorations */
  .ost-corner {
    position: absolute;
    width: 14px;
    height: 14px;
    pointer-events: none;
    z-index: 3;
  }
  .ost-corner.tl { top: 10px;    left: 10px;    border-top: 1.5px solid rgba(250,68,84,0.45); border-left: 1.5px solid rgba(250,68,84,0.45); }
  .ost-corner.tr { top: 10px;    right: 10px;   border-top: 1.5px solid rgba(250,68,84,0.45); border-right: 1.5px solid rgba(250,68,84,0.45); }
  .ost-corner.bl { bottom: 32px; left: 10px;    border-bottom: 1.5px solid rgba(250,68,84,0.45); border-left: 1.5px solid rgba(250,68,84,0.45); }
  .ost-corner.br { bottom: 32px; right: 10px;   border-bottom: 1.5px solid rgba(250,68,84,0.45); border-right: 1.5px solid rgba(250,68,84,0.45); }

  /* LIVE badge */
  .ost-monitor-live-badge {
    position: absolute;
    top: 12px;
    right: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(250,68,84,0.15);
    border: 1px solid rgba(250,68,84,0.3);
    border-radius: 4px;
    padding: 3px 8px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    color: #fa4454;
    letter-spacing: 1.5px;
    z-index: 3;
  }

  /* Empty state */
  .ost-monitor-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    z-index: 2;
  }
  .ost-monitor-empty p {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(148,148,160,0.5);
    line-height: 1.6;
    margin: 0;
  }

  /* Sandbox (iframe wrapper) */
  .ost-monitor-sandbox {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  /* Bottom bar */
  .ost-monitor-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 26px;
    background: rgba(0,0,0,0.65);
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    z-index: 3;
  }
  .ost-monitor-res,
  .ost-monitor-brand {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(148,148,160,0.45);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* ═══════════════════════════════════════
     SETTINGS PANEL
  ═══════════════════════════════════════ */
  .ost-settings {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--surface, #111115);
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    border-radius: 14px;
    overflow: hidden;
  }

  /* ── Step blocks ── */
  .ost-step {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ost-step:last-child {
    border-bottom: none;
  }

  .ost-step-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ost-step-num {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #fa4454;
    background: rgba(250,68,84,0.10);
    border: 1px solid rgba(250,68,84,0.2);
    border-radius: 4px;
    padding: 2px 7px;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .ost-step-head h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 0.8px;
    margin: 0;
  }

  /* ── Profile inputs ── */
  .ost-profile-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .ost-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    height: 40px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .ost-input:focus {
    border-color: rgba(250,68,84,0.5);
    box-shadow: 0 0 0 3px rgba(250,68,84,0.12);
  }
  .ost-input::placeholder {
    color: rgba(148,148,160,0.45);
    font-size: 12px;
  }
  .ost-input-name {
    flex: 1 1 0%;
    min-width: 0;
  }
  .ost-input-tag {
    width: 76px;
    flex-shrink: 0;
    font-family: 'DM Mono', monospace;
  }

  .ost-hash {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: rgba(148,148,160,0.5);
    font-weight: 700;
    flex-shrink: 0;
  }

  .ost-select-sm {
    width: 66px;
    flex-shrink: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #fff;
    padding: 8px 6px;
    border-radius: 8px;
    font-size: 12px;
    height: 40px;
    box-sizing: border-box;
    outline: none;
    font-family: 'DM Mono', monospace;
    cursor: pointer;
  }

  /* ── Preset Cards ── */
  .ost-preset-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ost-preset-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s, transform 0.15s, box-shadow 0.18s;
    text-align: left;
    width: 100%;
    min-height: 52px;
    box-sizing: border-box;
    position: relative;
  }
  .ost-preset-card:hover {
    border-color: rgba(250,68,84,0.3);
    background: rgba(250,68,84,0.05);
    transform: translateY(-1px);
  }
  .ost-preset-card:active {
    transform: scale(0.98);
  }
  .ost-preset-card.active {
    border-color: rgba(250,68,84,0.5);
    background: rgba(250,68,84,0.08);
    box-shadow: 0 0 0 1px rgba(250,68,84,0.15), inset 0 0 20px rgba(250,68,84,0.04);
  }

  .ost-preset-icon {
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .ost-preset-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ost-preset-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 0.5px;
  }
  .ost-preset-desc {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(148,148,160,0.6);
  }
  .ost-preset-check {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    background: #fa4454;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    font-weight: 700;
  }

  /* ── Stats checklist ── */
  .ost-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 8px;
  }

  .ost-chk {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    user-select: none;
    font-family: 'DM Mono', monospace;
    padding: 4px 2px;
  }
  .ost-chk input[type="checkbox"] {
    display: none;
  }
  .ost-chk-box {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1.5px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.03);
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
    position: relative;
  }
  .ost-chk input:checked + .ost-chk-box {
    border-color: #fa4454;
    background: rgba(250,68,84,0.18);
  }
  .ost-chk input:checked + .ost-chk-box::after {
    content: '';
    position: absolute;
    left: 3px; top: 1px;
    width: 4px; height: 8px;
    border-right: 2px solid #fa4454;
    border-bottom: 2px solid #fa4454;
    transform: rotate(45deg);
  }
  .ost-chk-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Theme presets ── */
  .ost-themes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ost-theme-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 6px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 10.5px;
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.12s;
    white-space: nowrap;
  }
  .ost-theme-chip:hover {
    border-color: var(--chip-color, #fa4454);
    color: #fff;
    background: rgba(255,255,255,0.08);
  }
  .ost-theme-chip:active {
    transform: scale(0.96);
  }

  .ost-theme-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Color pickers ── */
  .ost-colors-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .ost-color-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ost-color-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(148,148,160,0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ost-color-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 5px 8px;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .ost-color-wrap:focus-within {
    border-color: rgba(250,68,84,0.4);
  }

  .ost-color-swatch {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .ost-color-swatch input[type="color"] {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    opacity: 0;
    cursor: pointer;
  }

  .ost-color-text {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.85);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    outline: none;
  }

  /* ── Scale slider ── */
  .ost-scale {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .ost-scale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ost-scale-header label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(148,148,160,0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ost-scale-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ost-scale-val {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #fa4454;
    font-weight: 700;
  }
  .ost-scale-reset {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(148,148,160,0.6);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    padding: 2px 7px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ost-scale-reset:hover {
    color: #fff;
    border-color: rgba(255,255,255,0.2);
  }

  .ost-scale-track {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ost-range {
    width: 100%;
    accent-color: #fa4454;
    cursor: pointer;
    margin: 4px 0;
    height: 6px;
  }
  .ost-scale-ticks {
    display: flex;
    justify-content: space-between;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(148,148,160,0.35);
    padding: 0 2px;
  }

  /* ── URL section ── */
  .ost-step-url {
    background: rgba(250,68,84,0.02);
    border-top: 1px solid rgba(250,68,84,0.12) !important;
  }

  .ost-url-box {
    width: 100%;
    box-sizing: border-box;
  }
  .ost-url-input {
    width: 100%;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    padding: 10px 12px;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    outline: none;
    box-sizing: border-box;
    text-overflow: ellipsis;
    cursor: text;
    -webkit-appearance: none;
  }

  .ost-url-actions {
    display: flex;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .ost-copy-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: linear-gradient(135deg, #fa4454 0%, #e03343 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    box-shadow: 0 4px 16px rgba(250,68,84,0.3);
    min-height: 44px;
  }
  .ost-copy-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff5666 0%, #fa4454 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(250,68,84,0.4);
  }
  .ost-copy-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .ost-copy-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }
  .ost-copy-btn.copied {
    background: linear-gradient(135deg, #3ecf8e 0%, #2eb879 100%);
    box-shadow: 0 4px 16px rgba(62,207,142,0.3);
  }

  .ost-preview-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.85);
    border-radius: 8px;
    padding: 12px 14px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    min-height: 44px;
  }
  .ost-preview-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.22);
    color: #fff;
  }
  .ost-preview-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ── OBS Guide accordion ── */
  .ost-guide-accordion {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    overflow: hidden;
  }

  .ost-guide-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.03);
    border: none;
    padding: 12px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.65);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, color 0.15s;
    min-height: 44px;
  }
  .ost-guide-toggle:hover {
    background: rgba(255,255,255,0.06);
    color: #fff;
  }

  .ost-guide-chevron {
    margin-left: auto;
    transition: transform 0.2s;
  }
  .ost-guide-chevron.open {
    transform: rotate(180deg);
  }

  .ost-guide-body {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 14px;
    background: rgba(0,0,0,0.25);
  }
  .ost-guide-body ol {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
  }
  .ost-guide-body strong {
    color: rgba(255,255,255,0.9);
  }
  .ost-guide-body em {
    color: rgba(148,148,160,0.8);
  }
  .ost-guide-body ul {
    margin-top: 4px;
    padding-left: 16px;
    color: #fa4454;
    list-style-type: square;
  }
  .ost-guide-body ul li {
    color: rgba(255,255,255,0.65);
  }
  .ost-guide-body ul strong {
    color: rgba(255,255,255,0.88);
  }

  /* Floating Scroll to Preview Button */
  .ost-floating-preview-btn {
    position: fixed;
    bottom: 85px;
    right: 18px;
    z-index: 999;
    background: #fa4454;
    color: #fff;
    padding: 9px 16px;
    border-radius: 24px;
    box-shadow: 0 6px 20px rgba(250,68,84,0.45);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    border: none;
    transition: transform 0.15s, background 0.15s;
    letter-spacing: 0.5px;
  }
  .ost-floating-preview-btn:hover {
    background: #ff5666;
    transform: translateY(-2px);
  }
  .ost-floating-preview-btn:active {
    transform: translateY(0);
  }

  /* ═══════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ═══════════════════════════════════════ */
  @media (max-width: 960px) {
    .ost-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .ost-preview-col {
      position: static;
    }
    .ost-monitor {
      height: 230px;
    }
    .ost-monitor.flexible-mode {
      height: 360px;
    }
  }

  @media (max-width: 600px) {
    .ost-container {
      padding: 12px 10px 100px;
    }
    .ost-header {
      padding: 16px;
      gap: 10px;
    }
    .ost-header-icon {
      width: 38px;
      height: 38px;
    }
    .ost-header-title-group h2 {
      font-size: 20px;
    }
    .ost-header-desc {
      font-size: 12px;
      line-height: 1.5;
    }
    .ost-themes {
      overflow-x: auto;
      flex-wrap: nowrap;
      padding-bottom: 4px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .ost-themes::-webkit-scrollbar {
      display: none;
    }
    .ost-url-actions {
      flex-direction: column;
      gap: 8px;
    }
    .ost-copy-btn,
    .ost-preview-btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .ost-monitor {
      height: 195px;
    }
    .ost-monitor.flexible-mode {
      height: 320px;
    }
    .ost-step {
      padding: 14px 14px;
      gap: 12px;
    }
    .ost-profile-row {
      display: flex;
      gap: 5px;
    }
    .ost-input-name {
      flex: 1 1 0%;
      min-width: 0;
    }
    .ost-input-tag {
      width: 68px;
    }
    .ost-select-sm {
      width: 60px;
      padding: 8px 2px;
    }
  }
</style>

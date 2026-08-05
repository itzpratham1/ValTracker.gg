# ValTracker Migration: Vanilla JS → Astro + Svelte

## Current Status: Phases 1-19 COMPLETE + Bug Fixes Done — Visual Parity In Progress

## Goal
Make the Astro + Svelte frontend visually identical to the old Flask site. The tracker loads and functions, but there are CSS/visual differences between the old Flask pages and the new Astro pages.

## How to Run Locally
```bash
# Terminal 1: Flask API (port 5000)
cd C:\Users\prath\Downloads\VALSTATS\v8
python api.py

# Terminal 2: Astro dev server (port 4321)
cd C:\Users\prath\Downloads\VALSTATS\v8\frontend
npm run dev
```
Then open http://localhost:4321 (landing) or http://localhost:4321/app?name=HARSH&tag=khel&region=ap&mode=competitive (tracker)

## Tech Stack Decisions
- **Frontend**: Astro + Svelte (client islands)
- **Backend**: Flask (API-only, `/api/*` routes only)
- **Styling**: Global CSS (existing 6,200 lines from `public/index.css`)
- **Charts**: Chart.js (via CDN or npm)
- **State**: Svelte stores
- **Build**: Vite (Astro default)
- **Hosting**: Render (two services: frontend + API)

## Project Structure
```
valtracker/
├── frontend/                    # Astro project
│   ├── src/
│   │   ├── layouts/Layout.astro
│   │   ├── pages/
│   │   │   ├── index.astro        # / Landing
│   │   │   ├── app.astro          # /app Main tracker (client:only="svelte")
│   │   │   ├── overlay.astro      # /overlay OBS
│   │   │   └── 404.astro
│   │   ├── components/
│   │   │   ├── tracker/           # All tracker components
│   │   │   ├── landing/           # Landing page components
│   │   │   ├── shared/            # Toast, Footer, ProfileShare
│   │   │   ├── esports/           # EsportsHub
│   │   │   ├── store/             # SkinsStore
│   │   │   ├── coach/             # DraftCoach
│   │   │   └── overlay/           # Overlay
│   │   ├── lib/                   # TypeScript utils
│   │   └── styles/
│   │       ├── tokens.css         # CSS custom properties (--accent: #fa4454)
│   │       └── global.css         # 6,515 lines (copy of old index.css + .tracker-layout scoping)
│   ├── public/                    # Static assets (images, JS)
│   │   ├── landing.js             # Landing page animations
│   │   ├── stats_tracker_card.webp
│   │   └── Val_bot_analysis.webp
│   └── astro.config.mjs           # Vite proxy: /api -> localhost:5000
├── api.py                         # Flask API-only backend
├── public/                        # OLD Flask files (REFERENCE ONLY)
│   ├── index.html                 # Old tracker HTML (2,819 lines)
│   ├── index.js                   # Old tracker JS (13,120 lines)
│   ├── index.css                  # Old tracker CSS (6,514 lines)
│   ├── landing.html               # Old landing page (2,777 lines)
│   └── landing.js                 # Old landing JS (496 lines)
├── app.py                         # Old Flask monolith (REFERENCE ONLY)
├── render.yaml
└── Dockerfile
```

## Bugs Already Fixed (in previous sessions)
1. `MapCards.svelte:32` — `getAgentIcon` → `getAgentIconUrl` (was crashing render)
2. `Topbar.svelte:200` — `on:click={handleSearch}` → `on:click={() => handleSearch($player.name, $player.tag)}`
3. `ExportCard.svelte:136-138` — Reddit share `mapStr`/`agentStr` out of scope (inlined the expressions)
4. `AppShell.svelte` — Added `fetchWithTimeout()` with 15s AbortController timeout
5. `AppShell.svelte` — `API_BASE = import.meta.env.PUBLIC_API_URL || ''` for production routing
6. `AppShell.svelte` — 20s safety timeout in `onMount` prevents permanent loading
7. `AppShell.svelte` — Extract `.data` from API responses: `accountResData?.data`
8. `AppShell.svelte` — Removed broken reactive redirect to `/login`
9. `appStore.ts` — Default act changed to `v26a4` (current act, started June 24)
10. `constants.ts` — Added `v26a4` to `ACTS_TIMELINE` (start: June 24, end: Aug 19)
11. `index.astro` — Changed `/login` → `/app` on all 5 CTA links
12. `index.astro` — Reverted accent color to `#FF4655` (matching old Flask)
13. `Topbar.svelte` — Filter capsule: `border-radius: 30px`, `backdrop-filter: blur(10px)`, pill shape
14. `Topbar.svelte` — Fetch button: gradient pill style `linear-gradient(135deg, rgba(232,255,71,0.15), rgba(232,255,71,0.05))`
15. `Topbar.svelte` — Filter selects: `padding: 6px 22px 6px 26px`, `border-radius: 20px`, bordered
16. `TrackerView.svelte` — Reordered sections: Clutch(6), Accuracy(7), Weapons(8) matching old Flask
17. `TrackerNav.svelte` — Updated section numbers to match new ordering
18. `TrackerNav.svelte` — Added `activeSection` prop + `.active` class styling (accent color, bg, border, glow shadow)
19. `TrackerView.svelte` — Added `activeSection` tracking via `IntersectionObserver` + `onMount`
20. `TrackerView.svelte` — Passes `activeSection` to `TrackerNav`
21. `index.astro` + `global.css` — Unified accent color to `#fa4454` (matching tokens.css), replaced all hardcoded `rgba(255,70,85,...)` and `#ff4655`/`#ff3e54` with consistent values
22. `global.css` — Scoped all hero section selectors (34 total) under `.tracker-layout` to prevent bleed into landing page. Includes responsive media query overrides at 900px, 600px, 992px, 768px breakpoints.
23. `Topbar.svelte` — Renamed `.active-pill` → `.player-active-pill`, `.active-pill-avatar` → `.active-pill-avatar-wrap` to match global.css class names
24. `Topbar.svelte` — Renamed `.filter-capsule` → `.topbar-filter-capsule` to match global.css
25. `Topbar.svelte` — Renamed `.filter-select` → `.region-select` to match global.css (old uses `region-select` class on all selects)
26. `Topbar.svelte` — Added chevron icons (`<span class="chevron-icon">`) after each filter select (matching old HTML structure)
27. `Topbar.svelte` — Removed duplicate Utilities dropdown (was in both Topbar and TrackerNav; old version only has it in TrackerNav)
28. `Topbar.svelte` — Removed conflicting scoped `.filter-item` and `.filter-icon` styles (let global.css handle them — global uses `position: absolute` for icons inside filter items)
29. `Topbar.svelte` — Tab bar styling matched to old: `DM Mono` font 11px, container with `background: var(--surface2)`, `padding: 4px`, `border-radius: var(--radius-sm)`, `border: 1px solid var(--border)`

## CURRENT STATE OF global.css
- **6,772 lines** (was 6,515 — added ~257 lines of inline `<style>` overrides from old `index.html`)
- Hero section selectors scoped under `.tracker-layout` (34 selectors modified)
- All topbar, tracker-nav, dropdown, hero, stat card, match row, section, and responsive media query styles are present
- Hero section at lines ~449-660, fully scoped under `.tracker-layout`
- Responsive hero overrides at lines ~3183, ~3235, ~4740, ~4796 are all scoped under `.tracker-layout`
- **Lines 6772+**: Inline `<style>` overrides ported from old `index.html` (see "Inline Overrides Added" section below)

## Bugs Fixed This Session
30. `TrackerView.svelte` — Swapped HeroSection and TrackerNav order: Topbar → Hero → Nav → Content (matches old Flask layout)
31. `HeroSection.svelte` — Added `computeRankPrediction()` function (ported from old `index.js:7788-7831`), shows "At your current pace, you'll hit the Next Rank in ~X games."
32. `global.css` — Added `.hero-rank-prediction` styles (margin-top, font, color, border-top, padding)
33. `TrackerNav.svelte` — Removed Clutch and Accuracy from nav items (old Flask has 10 nav items, not 12). Sections still exist in page content, just not in nav bar.
34. `AppShell.svelte:112-113` — Changed `window.location.href = '/'` to `setPlayer({...loaded: false})` when no URL params (was causing redirect loop back to landing page)
35. `HeroSection.svelte` — Added `.hero-tag` CSS rule (was missing — class used in template but never defined)
36. `global.css` — **Added ALL inline `<style>` overrides from old `index.html`** (lines 17-84 and 1737-1851). This was the ROOT CAUSE of visual differences. See details below.
37. `wrappedEngine.ts` + `HeroSection.svelte` — Fixed Wrapped badge visibility. `isWrappedSeasonActive` now strictly checks if current date is within the last 7 days of the calendar month OR last 7 days of the Act (using `ACTS_TIMELINE`). Removed `matches.length >= 5` override fallback and wired `HeroSection.svelte` to use `isWrappedSeasonActive(matches, $player.act)` so the `⚡ WRAPPED` badge is only shown during recap windows or when URL explicitly contains `?wrapped=1`.

## Inline Overrides Added to global.css (from old index.html `<style>` block)
These rules existed ONLY in the old `index.html` inline `<style>` and were NEVER copied to `global.css`:

### Sticky topbar + scroll-hide (desktop)
```css
@media (min-width: 801px) {
  .topbar { position: sticky !important; top: 0; z-index: 1000; transition: transform 0.4s ...; will-change: transform; }
  .tracker-nav { position: sticky !important; top: calc(var(--topbar-height, 108px) - 1.5px); z-index: 999; transition: transform 0.4s ...; will-change: transform; }
  body.scrolled-down .topbar { transform: translateY(-100%); }
  body.scrolled-down .tracker-nav { transform: translateY(calc(-1 * var(--topbar-height, 108px) - 1.5px)); }
}
```

### Card performance optimization
```css
.card, .agent-bento, .impact-bento, .match-row, .match-panel, .hero-rank-block, .ai-card, .deep-trigger-card, .deep-card, .live-banner {
  backdrop-filter: none !important; background: rgba(11, 11, 15, 0.93) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ..., opacity 0.2s ..., border-color 0.15s ..., background-color 0.15s ...;
}
```

### Enhanced card hover
```css
.card:hover, .agent-bento:hover, .map-card-bento:hover, .impact-bento:hover, .match-row:hover, .deep-card:hover {
  transform: translateY(-4px); border-color: var(--accentborder);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(250, 68, 84, 0.15);
}
```

### Agent portrait hover
```css
.agent-bento:hover .agent-portrait {
  filter: saturate(1.2) contrast(1.15) drop-shadow(0 0 20px rgba(250, 68, 84, 0.35));
  transform: scale(1.08);
}
```

### Win rate bar gradient + glow
```css
.wr-fill, .sb-kd-fill { background: linear-gradient(90deg, #ff5757, var(--accent)); box-shadow: 0 0 10px rgba(250, 68, 84, 0.4); }
```

### Win/Loss text glow
```css
.wlv, .ai-stat-pill-val.good, .mr-result.win { text-shadow: 0 0 12px rgba(62, 207, 142, 0.4); }
.wl-block.losses .wlv, .mr-result.loss { text-shadow: 0 0 12px rgba(255, 87, 87, 0.4); }
```

### Card value text shadow
```css
.card-val, .impact-val, .hero-title, .streak-val { text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); }
```

### Map splash opacity/filter
```css
.map-splash { opacity: 0.8; filter: saturate(1.2) brightness(0.6); }
.map-card-bento:hover .map-splash { transform: scale(1.08); opacity: 1; filter: saturate(1.3) brightness(0.8); }
```

### Sticky header backdrop removal
```css
.topbar, .tracker-nav { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
```

### Loading bar styles
```css
.loading-progress-bar { transform: skewX(-15deg); border-radius: 0px; ... }
.loading-progress-fill { background: repeating-linear-gradient(90deg, var(--accent), var(--accent) 6px, transparent 6px, transparent 9px); ... }
```

### Mobile responsive overrides
```css
@media (max-width: 800px) { .topbar { position: relative; box-shadow: none; } .tracker-nav { position: sticky; top: 0; z-index: 9999; } }
@media (max-width: 600px) { .hero-right { flex-direction: column; } .hero-title .dim { display: inline-block; } }
```

## REMAINING VISUAL DIFFERENCES TO FIX

### Status: CSS overrides are now in global.css, but user reports they're not visible
The inline `<style>` overrides from old `index.html` have been added to global.css (lines 6772+). User says they still don't look right after hard refresh. **Next session should:**

1. **Verify CSS is actually loading** — Open DevTools → Network tab → check if global.css is being loaded (not cached). Check DevTools → Elements → Computed styles on `.card` to see if `background: rgba(11,11,15,0.93)` is applied.

2. **Check for CSS specificity conflicts** — The new global.css adds overrides at the END with `!important`. But Astro may process CSS differently. Check if the styles appear in the rendered HTML `<style>` tag.

3. **Compare screenshots pixel by pixel** — The user has old Flask screenshots. Need to systematically compare:
   - Hero banner: player card bg with dark overlay gradient
   - Topbar sub-row: player pill + filter capsule + selects + fetch button (spacing, fonts, colors)
   - Stat cards: borders, backgrounds, text shadows, hover effects
   - Win rate: gradient bar, glow effects, text colors
   - Nav bar: items, spacing, active state

4. **Potential issue: CSS ordering** — Astro may bundle CSS in a different order than expected. The inline overrides at the END of global.css need to come AFTER all base rules to win. Check the compiled output.

5. **Potential issue: Scoped style interference** — Some Svelte components may still have scoped styles overriding global.css. Topbar.svelte has minimal scoped styles (only `.topbar-logo`), but verify no other components have conflicting scoped styles.

6. **MatchPanel feature regression** — Old site has ~3000 lines of match panel logic (lobby rank, round dots, ability chips, kill feeds, eco breakdown, duel bars). New has placeholder tabs. This is a feature gap, not just styling.

## Key Architecture Notes

- `AppShell.svelte` uses `client:only="svelte"` — only renders client-side, skips SSR
- `checkUrlParams()` reads URL params on mount → calls `setPlayer()` → triggers reactive `fetchStats()`. When no params, shows LookupView (NOT redirect to landing — this was fixed this session)
- `fetchStats()` makes 4 parallel API calls via `fetchWithTimeout()` (30s timeout each)
- Catch block in `fetchStats()` calls `endFetch()` — sets `loaded: true` so TrackerView renders with null/empty data + shows toast error
- Vite proxy: `'/api': 'http://localhost:5000'` (dev mode only)
- Production: `PUBLIC_API_URL=https://valtracker-api.onrender.com` set in render.yaml
- `api.ts` `API_BASE` uses `import.meta.env.PUBLIC_API_URL || '/api'`
- `appStore.ts` default state: `region: 'ap'`, `mode: 'competitive'`, `act: 'v26a4'`
- `sanitizeTag()` in AppShell and Topbar reverses `®` (U+00AE) HTML entity corruption from `&region` URL param

## Key Architecture Notes

- `AppShell.svelte` uses `client:only="svelte"` — only renders client-side, skips SSR
- `checkUrlParams()` reads URL params on mount → calls `setPlayer()` → triggers reactive `fetchStats()`
- `fetchStats()` makes 4 parallel API calls via `fetchWithTimeout()` (15s timeout each)
- Catch block in `fetchStats()` calls `endFetch()` — sets `loaded: true` so TrackerView renders with null/empty data
- Vite proxy: `'/api': 'http://localhost:5000'` (dev mode only)
- Production: `PUBLIC_API_URL=https://valtracker-api.onrender.com` set in render.yaml
- `api.ts` `API_BASE` uses `import.meta.env.PUBLIC_API_URL || '/api'`
- `appStore.ts` default state: `region: 'ap'`, `mode: 'competitive'`, `act: 'v26a4'`

## How to Compare Old vs New
- Old Flask tracker: `public/index.html` (HTML) + `public/index.css` (CSS) + `public/index.js` (JS)
- Old Flask landing: `public/landing.html` (HTML+CSS+JS all in one)
- New Astro landing: `frontend/src/pages/index.astro`
- New Astro tracker: `frontend/src/components/tracker/*.svelte`

## Conventions
- Svelte components use `<script>` (not `<script lang="ts">` unless needed)
- CSS stays as global stylesheet (no scoped styles for consistency)
- API calls go through a central `api.ts` fetch wrapper
- All client-side logic ports to TypeScript in `src/lib/`
- Interactive components use `client:only="svelte"` to avoid SSR issues with localStorage
- Dynamic routes (e.g. share/[id]) use `export const prerender = false` for server rendering

# ValTracker Migration: Vanilla JS → Astro + Svelte

## Current Status: Phases 1-19 COMPLETE — Migration Done

## Goal
Migrate ValTracker.gg from Vanilla HTML/CSS/JS + Flask to Astro + Svelte frontend with Flask API-only backend.

## Tech Stack Decisions
- **Frontend**: Astro + Svelte (client islands)
- **Backend**: Flask (API-only, `/api/*` routes only)
- **Styling**: Global CSS (existing 6,200 lines)
- **Charts**: Chart.js (via CDN or npm)
- **State**: Svelte stores
- **Build**: Vite (Astro default)
- **Hosting**: Render (two services or combined)

## Project Structure (Target)
```
valtracker/
├── astro.config.mjs
├── package.json
├── public/                    # Static assets
├── src/
│   ├── layouts/Layout.astro
│   ├── pages/
│   │   ├── index.astro        # / Landing
│   │   ├── app.astro          # /app Main tracker
│   │   ├── overlay.astro      # /overlay OBS
│   │   ├── share/[id].astro   # /share/:id
│   │   └── 404.astro
│   ├── components/            # Svelte components
│   ├── lib/                   # TypeScript utils
│   └── styles/global.css
├── api.py                     # API-only Flask backend
├── render.yaml                # Render deployment config
├── Dockerfile                 # Container build
└── .env.example               # Environment variables template
```

## Migration Progress

### Phase 1: Scaffolding [x] 
- [x] Create Astro project in `frontend/` directory
- [x] Install Svelte integration
- [x] Configure astro.config.mjs
- [x] Set up package.json scripts
- [x] Move static assets to public/

### Phase 2: Layout & Routing [x]
- [x] Create Layout.astro (head, fonts, global CSS)
- [x] Create page routes (/, /app, /overlay, /share/:id, /404)
- [x] Set up global.css with existing design tokens

### Phase 3: Core Utilities [x]
- [x] Port constants.ts (ACTS_TIMELINE, AGENT_ROLES, AGENT_UUIDS, RANKS, etc.)
- [x] Port utils.ts (escapeHtml, expandTeamName, format helpers)
- [x] Port api.ts (fetch wrapper for Flask backend)
- [x] Port assets.ts (asset cache)

### Phase 4: Landing Page [x]
- [x] SearchForm.svelte
- [x] Bookmarks.svelte
- [x] RecentSearches.svelte
- [x] LoadingCard.svelte

### Phase 5: App Shell [x]
- [x] Topbar.svelte
- [x] HeroSection.svelte
- [x] PlayerSearch.svelte

### Phase 6: Stats Tracker [x]
- [x] StatCards.svelte
- [x] RankDisplay.svelte
- [x] processMatches.ts port

### Phase 7: Match History [x]
- [x] MatchHistory.svelte
- [x] MatchPanel.svelte
- [x] MatchScoreboard.svelte

### Phase 8: Charts [x]
- [x] RrGraph.svelte
- [x] PerfTrend.svelte

### Phase 9: Agent & Map Stats [x]
- [x] AgentCards.svelte
- [x] MapCards.svelte
- [x] WeaponLab.svelte

### Phase 10: AI Coaching [x]
- [x] ai-engine.ts port
- [x] ValBotCoach.svelte
- [x] DeepAnalysis.svelte

### Phase 11: Esports Hub [x]
- [x] EsportsHub.svelte
- [x] LiveMatches.svelte (integrated into EsportsHub overview)
- [x] Results.svelte / Upcoming.svelte / News.svelte (integrated into EsportsHub)

### Phase 12: Skins Store [x]
- [x] SkinsStore.svelte
- [x] FeaturedBundles.svelte
- [x] SkinModal.svelte

### Phase 13: Meta Comp Architect [x]
- [x] DraftCoach.svelte
- [x] AgentSelectorModal.svelte
- [x] ProComps.svelte
- [x] draft-engine.ts

### Phase 14: Stream Overlay [x]
- [x] Overlay.svelte

### Phase 15: Export & Sharing [x]
- [x] ExportCard.svelte
- [x] share/[id].astro (SSR)

### Phase 16: Head-to-Head [x]
- [x] H2H comparison page

### Phase 17: IndexedDB & Session [x]
- [x] indexeddb.ts port
- [x] session.ts port

### Phase 18: SEO [x]
- [x] Sitemap
- [x] Structured data

### Phase 19: Deployment [x]
- [x] Slim down Flask to API-only
- [x] Render config
- [x] Build pipeline

## How to Continue in Next Chat
1. Read this file (AGENTS.md) first
2. Find the last completed phase (marked with [x])
3. Start the next uncompleted phase
4. Mark phases as [x] when done
5. Update "Current Status" at the top

## Key Files to Reference
- `public/index.js` — 13,120 lines (all frontend logic)
- `public/index.html` — 2,819 lines (DOM structure)
- `public/index.css` — 6,200 lines (design system)
- `public/landing.html` — 2,777 lines (landing page)
- `public/landing.js` — 496 lines (landing animations)
- `public/overlay.html` + `overlay.js` + `overlay.css` — OBS overlay
- `app.py` — 2,366 lines (Flask backend)
- `frontend/src/components/landing/` — SearchForm, Bookmarks, RecentSearches, LoadingCard
- `frontend/src/components/tracker/` — Topbar, HeroSection, PlayerSearch, StatCards, RankDisplay, TrackerView, MatchHistory, MatchPanel, MatchScoreboard, RrGraph, PerfTrend, AgentCards, MapCards, WeaponLab, ValBotCoach, DeepAnalysis, ExportCard, HeadToHead
- `frontend/src/components/esports/` — EsportsHub (all esports sub-views integrated)
- `frontend/src/components/store/` — SkinsStore, FeaturedBundles, SkinModal
- `frontend/src/components/coach/` — DraftCoach, AgentSelectorModal, ProComps
- `frontend/src/components/overlay/` — Overlay
- `frontend/src/lib/draft-engine.ts` — evaluateDraft, buildAroundMe, DRAFT_MAP_RECOMMENDATIONS
- `frontend/src/lib/stores.ts` — Bookmarks + recent searches stores
- `frontend/src/lib/appStore.ts` — Player state, current view, fetch state
- `frontend/src/lib/processMatches.ts` — Core match processing engine (pure computation)
- `frontend/src/lib/ai-engine.ts` — AI coaching engine (buildStatsForAI, analyseStats)
- `frontend/src/lib/esports-vct.ts` — VCT_STAGE_DATA, VCT_VLR_EVENTS constants
- `frontend/src/lib/esports-utils.ts` — getEspHTML, getEsportsTeamLogoHtml, getTeamRegion, getMatchCardHtml
- `frontend/src/lib/indexeddb.ts` — IndexedDB match store (openDB, saveMatches, loadAllMatches, clearPlayerMatches)
- `frontend/src/lib/session.ts` — Profile persistence, MMR cache, session stats, recent comps
- `frontend/src/layouts/Layout.astro` — Global layout with SEO meta, OG tags, structured data (JSON-LD)
- `frontend/public/robots.txt` — Crawl directives for search engines
- `frontend/astro.config.mjs` — Sitemap integration, site URL, page priorities
- `api.py` — API-only Flask backend (no HTML routes)
- `render.yaml` — Render deployment config (frontend + API services)
- `Dockerfile` — Container build for combined deployment
- `.env.example` — Required environment variables template
- `api.py` — API-only Flask backend (no HTML routes)
- `render.yaml` — Render deployment config (frontend + API services)
- `Dockerfile` — Container build for combined deployment
- `.env.example` — Required environment variables template

## Conventions
- Svelte components use `<script>` (not `<script lang="ts">` unless needed)
- CSS stays as global stylesheet (no scoped styles for consistency)
- API calls go through a central `api.ts` fetch wrapper
- All client-side logic ports to TypeScript in `src/lib/`
- Interactive components use `client:only="svelte"` to avoid SSR issues with localStorage
- Dynamic routes (e.g. share/[id]) use `export const prerender = false` for server rendering

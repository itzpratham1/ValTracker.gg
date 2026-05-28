# ValTracker.gg — Full Technical Documentation

> **Version:** v8 | **Last Updated:** May 2026  
> **Live URL:** https://valtracker-gg.onrender.com  
> **GitHub:** https://github.com/itzpratham1/ValTracker.gg

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [File Structure](#3-file-structure)
4. [Backend — `app.py`](#4-backend--apppy)
   - [Server Setup](#41-server-setup)
   - [Middleware](#42-middleware)
   - [Rate Limiter](#43-rate-limiter)
   - [Caching System](#44-caching-system)
   - [HenrikDev Proxy](#45-henrikdev-proxy)
   - [Supabase Integration](#46-supabase-integration)
   - [Esports Routes](#47-esports-routes)
   - [Store Route](#48-store-route)
   - [Meta Comps Route](#49-meta-comps-route)
   - [Feedback System](#410-feedback-system)
5. [Frontend — `public/index.html`](#5-frontend--publicindexhtml)
   - [App Structure](#51-app-structure)
   - [Views / Modules](#52-views--modules)
   - [Tracker Module](#53-tracker-module)
   - [ValBot AI Coach](#54-valbot-ai-coach)
   - [Esports Module](#55-esports-module)
   - [Skins Store Module](#56-skins-store-module)
   - [Meta Comp Architect](#57-meta-comp-architect)
   - [Mobile Layout](#58-mobile-layout)
6. [Styling — `public/index.css`](#6-styling--publicindexcss)
7. [Data Files](#7-data-files)
8. [Environment Variables](#8-environment-variables)
9. [API Reference](#9-api-reference)
10. [Dependencies](#10-dependencies)
11. [Deployment](#11-deployment)
12. [Known Limitations & Gotchas](#12-known-limitations--gotchas)
13. [Utility Scripts](#13-utility-scripts)

---

## 1. Project Overview

ValTracker.gg is a full-stack, single-page Valorant stats tracker. It provides:

- **Real-time player statistics** — combat, performance, agents, maps, weapons, match history
- **Esports coverage** — live VCT match scores, upcoming fixtures, results, standings, news
- **Skins Store explorer** — featured bundles, complete cosmetics catalog with chroma swapper
- **Meta Comp Architect** — pro team composition analytics per map, per patch
- **AI Coach (ValBot)** — client-side performance analysis using pattern-matched heuristics

The entire UI is a **single HTML file** (`public/index.html`) — no frontend build step, no React, no Webpack. The backend is a **Flask Python app** (`app.py`) acting as:
1. A secure API proxy (hiding the HenrikDev API key from the browser)
2. A smart caching layer (in-memory + Supabase database persistence)
3. A VLR.gg scraper for esports data

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     User's Browser                        │
│                  public/index.html                        │
│         (Vanilla JS SPA — no framework, no build)         │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP fetch()
                          ▼
┌──────────────────────────────────────────────────────────┐
│              Flask Backend (app.py)                       │
│                                                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  In-Memory     │  │  VLR.gg      │  │  Supabase   │  │
│  │  Cache (dict)  │  │  Scraper     │  │  Database   │  │
│  │  TTL: 1-24h    │  │  (BS4)       │  │  (players + │  │
│  └────────────────┘  └──────────────┘  │   matches)  │  │
│                                        └─────────────┘  │
└──────────┬───────────────────────────────────────────────┘
           │ HTTP (proxied)
           ▼
┌──────────────────────────────┐
│  HenrikDev Valorant API      │
│  api.henrikdev.xyz           │
│  (Accounts, MMR, Matches)    │
└──────────────────────────────┘

Also external:
├── valorant-api.com     (Weapon skins, bundle metadata)
└── vlr.gg               (Esports matches, results, news, standings)
```

**Key design principle:** The browser **never** talks to HenrikDev directly. All requests go through the Flask proxy, which injects the API key server-side.

---

## 3. File Structure

```
v8/
├── app.py                      # Main Flask backend (1,629 lines)
├── requirements.txt            # Python dependencies (6 packages)
├── .env                        # Secret keys — NEVER commit to git
├── .gitignore
├── README.md
├── DOCUMENTATION.md            # This file
│
├── public/                     # Static files served by Flask
│   ├── index.html              # Entire frontend SPA (~11,500 lines)
│   ├── index.css               # All styles and design system (~4,400 lines)
│   ├── 404.html                # Custom 404 page
│   ├── valorant_v_logo.png     # Brand logo asset
│   ├── vct_pro_comps.json      # Meta comps database (VCT match compositions)
│   ├── vct_teams.json          # VCT team roster database (large, ~297KB)
│   └── vct_teams_new.json      # Lightweight updated team data
│
├── scrape_vlr_meta.py          # One-time scraper to build vct_pro_comps.json
├── build_vct_2026.py           # Builds vct_teams.json from VLR.gg
├── scrape_events.py            # Scrapes VCT event data
├── scrape_rosters.py           # Scrapes VCT team rosters
├── scrape_vct.py               # Core VCT scraping utilities
│
├── vlr_matches_backup.json     # Persistent fallback for VLR match data
├── vlr_results_backup.json     # Persistent fallback for VLR results
├── store_featured_backup.json  # Persistent fallback for store featured bundles
│
└── scratch/                    # Development debug scripts (not production)
    ├── check_api.py
    ├── check_db.py
    ├── test_match_details.py
    └── ...
```

---

## 4. Backend — `app.py`

### 4.1 Server Setup

```python
app = Flask(__name__, static_folder="public", static_url_path="")
```

- Serves all files from `/public/` as static assets
- `GET /` → serves `public/index.html` with `Cache-Control: no-cache` headers (so changes are always live)
- `GET 404` → serves `public/404.html`

**Environment variables loaded:**
```python
API_KEY        = os.getenv("HENRIKDEV_API_KEY")   # HenrikDev API auth
SUPABASE_URL   = os.getenv("SUPABASE_URL")         # Supabase project URL
SUPABASE_KEY   = os.getenv("SUPABASE_KEY")         # Supabase service role key
```

### 4.2 Middleware

**`optimize_response(response)`** — runs after every request:

1. **Cache-Control headers** injected based on file type:
   | Path Pattern | Cache Duration |
   |---|---|
   | `.css`, `.js` | 1 year (`immutable`) |
   | `.html`, `.svg`, `.png` | 24 hours |
   | `/api/v3/meta-comps`, `.json` | 10 minutes |

2. **On-the-fly Gzip compression** for `text/html`, `text/css`, `application/json`, `application/javascript` — only if client sends `Accept-Encoding: gzip` and response body is >500 bytes.

### 4.3 Rate Limiter

A zero-dependency in-memory rate limiter using a Python `dict`:

```python
rate_limit_records = {}  # IP → [timestamps]
```

- **Sliding window**: keeps only timestamps within the last 60 seconds
- **Bypass**: localhost, `192.168.*`, `10.*`, `172.*` are never rate-limited
- Default limits: `30/min` for esports/store, `120/min` for proxy API, `300/min` for image proxy
- Returns `429 Too Many Requests` when exceeded

### 4.4 Caching System

**Two-layer caching:**

#### Layer 1: In-Memory (Python dict)
```python
cache = {}  # URL → {"data": json, "timestamp": unix_time}
CACHE_TTL = 60  # 1 minute default
```
- Match lists: 60s TTL
- Match details (`v2/match/`): 86,400s (24h) — immutable historic data
- VLR esports data: 600s (10 min)
- News: 86,400s (24h)
- Standings: 3,600s (1h)

#### Layer 2: Supabase PostgreSQL (persistent)

Two tables:
- **`players_cache`** — player profiles (PUUID, name, tag, tier, MMR, card ID, stats JSON)
- **`matches_cache`** — compressed match records per player/PUUID

**Write-through caching**: successful API responses are immediately written to Supabase.  
**Read-through**: on next request within 15-minute TTL, data is served from DB (sub-second latency).

### 4.5 HenrikDev Proxy

**Route:** `GET/POST /api/<path>`

**Security — Allowlist:**
```python
ALLOWED_PROXY_PREFIXES = [
    "v3/mmr/",
    "v3/matches/",
    "v1/account/",
    "v1/stored-mmr-history/",
    "v2/match/",
    "v1/leaderboard/"
]
```
Any request to a path not in this list returns `403 Forbidden`.

**Match Intercept Flow** (for `v3/matches/`):
1. Check in-memory cache → serve if fresh
2. Fetch latest 20 matches from HenrikDev API
3. Resolve player PUUID (from DB cache or match data)
4. Compress each match with `compress_match_json()` (strips non-essential fields to fit DB free tier)
5. Archive all matches into `matches_cache` (Supabase upsert)
6. Fetch **all** archived matches for that player (up to 100) from DB
7. **Merge & deduplicate** live + archived matches by `match_id`
8. Sort by `game_start` descending → return merged list

This gives players their **full history beyond the 20-match API limit** for free.

**`compress_match_json(match_data)`** — strips each match to only:
- `metadata`: map, game_start, matchid, mode, queue, season, rounds_played
- `players.all_players`: puuid, name, tag, team, character, tier, K/D/A/score/HS/BS/LS
- `teams`: red/blue → has_won, rounds_won
- `rounds`: winning_team only

### 4.6 Supabase Integration

Helper: `supabase_request(method, table, data, params, headers)` — wraps all HTTP calls to the Supabase PostgREST API with automatic auth headers. Fails gracefully (returns `None`) if credentials are missing.

**`upsert_player(...)`** — smart merge: reads existing `stats_cache` JSON before upserting to avoid overwriting fields not present in the current update.

**`get_cached_player(name, tag)`** — case-insensitive `ilike` lookup.

**`is_player_fresh(cached_player, ttl_seconds=900)`** — parses ISO timestamp, computes age in seconds. 15-minute TTL by default.

### 4.7 Esports Routes

All routes under `/api/esports/`:

| Route | Function | Cache TTL | Source |
|---|---|---|---|
| `/api/esports/live` | `esports_live()` | 10 min | VLR.gg scraper |
| `/api/esports/results` | `esports_results()` | 10 min | VLR.gg scraper |
| `/api/esports/upcoming` | `esports_upcoming()` | 10 min | VLR.gg scraper |
| `/api/esports/news` | `esports_news()` | 24 hours | VLR.gg scraper → vlrggapi fallback → backup JSON → mock |
| `/api/esports/standings/<region>` | `esports_standings()` | 1 hour | VLR.gg rankings scraper |
| `/api/esports/event/<event_id>` | `esports_event_teams()` | 24 hours | VLR.gg event page scraper |

**VLR.gg Scraper** (`scrape_vlr_matches`, `scrape_vlr_results`):
- Uses `BeautifulSoup4` to parse VLR.gg HTML
- Extracts: match ID, teams, scores, event name, stage, state (live/unstarted/completed)
- Fallback chain: fresh scrape → expired memory cache → `vlr_matches_backup.json` → empty list

**Region mapping** for standings:
| API param | VLR.gg slug |
|---|---|
| `ap` | `asia-pacific` |
| `eu` | `europe` |
| `na` | `north-america` |
| `la` | `latin-america` |
| `mn` | `china` |

### 4.8 Store Route

**`GET /api/store/featured`**

3-layer fallback:
1. Serve `store_featured_backup.json` if file age < 24h
2. Fetch fresh from HenrikDev `v2/store-featured`, save to backup file
3. Serve expired backup file (graceful degradation)

### 4.9 Meta Comps Route

**`GET /api/v3/meta-comps?map=<map>&patch=<patch>`**

Reads `public/vct_pro_comps.json` (pre-built by `scrape_vlr_meta.py`) and computes:

1. **Filter** by map name (case-insensitive)
2. **Select patch**: defaults to latest available; auto-falls back to previous patch if current has <5 records
3. **Agent stats**: pick rate %, win rate %, raw picks/wins per agent
4. **Composition stats**: groups unique 5-agent lineups (sorted), ranks by:
   - **Most played**: sort by pick count desc
   - **Highest win rate**: filter ≥2 picks, sort by WR desc

### 4.10 Feedback System

| Route | Auth | Description |
|---|---|---|
| `POST /api/feedback` | None | Submit feedback — writes to `feedback.json` |
| `GET /api/admin/feedback?secret=<token>` | `ADMIN_SECRET` env var | Read all feedback records |

---

## 5. Frontend — `public/index.html`

A single HTML file (~11,500 lines). All JavaScript is inline `<script>` blocks. The file is organized into major sections:

### 5.1 App Structure

```
<head>
  ├── Google Fonts (Rajdhani, Exo 2, Barlow Condensed, DM Mono, Inter)
  ├── Chart.js (CDN, deferred)
  ├── html2canvas (CDN, deferred)
  └── index.css (versioned: ?v=12.16)

<body>
  ├── Landing page (#landing-screen)
  ├── Main app wrapper (#main-app)
  │   ├── Topbar (.topbar)
  │   │   ├── Logo + Tabs (.topbar-left)
  │   │   └── Filter Dropdowns (.topbar-right)
  │   ├── Tracker View (#tracker-view)
  │   ├── Esports View (#esports-view)
  │   ├── Store View (#store-view)
  │   └── Coach/Meta View (#coach-view)
  ├── Global Footer (#global-footer)
  └── Toast Notification (#toast)

<script> blocks (inline JS)
```

### 5.2 Views / Modules

The app has 4 top-level views toggled by `toggleMainView(view)`:

| View ID | Tab Label | JS Function |
|---|---|---|
| `#tracker-view` | Tracker | `loadPlayerStats()` |
| `#esports-view` | Esports | `loadEsportsView()` |
| `#store-view` | Skins Store | `loadStoreView()` |
| `#coach-view` | Meta Comp Architect | `loadCoachView()` |

### 5.3 Tracker Module

**Entry point:** Player name + tag input → `fetchStats(name, tag, region, mode, season)`

**Data fetched in parallel** using `Promise.all`:
1. Account info: `/api/v1/account/<name>/<tag>`
2. MMR/rank: `/api/v3/mmr/<region>/pc/<name>/<tag>`
3. Matches: `/api/v3/matches/<region>/<name>/<tag>?mode=<mode>&size=20`
4. MMR history: `/api/v1/stored-mmr-history/<region>/<name>/<tag>?size=20`

**Secondary navigation tabs** (sticky on mobile):
- **Combat** — KDA, ACS, headshot %, kills chart
- **Performance** — win rate, rating over time, trend lines (Chart.js)
- **Trend** — rolling averages, session performance
- **Agents** — per-agent stats table
- **Maps** — per-map win rate table
- **Weapons** — most used weapons
- **Matches** — match history list with expandable detail panels

**Match Detail Expansion:**
- Fetches `/api/v2/match/<match_id>` (cached 24h)
- Shows: scoreboard, round timeline (win/loss dots), kill feed, duel stats

**Features:**
- **Session Tracker**: `startSession()` / `stopSession()` — snapshots stats before/after, computes delta
- **Head-to-Head**: compares two players side by side
- **ValBot per-match**: AI analysis button on each match card
- **Export card**: `html2canvas` screenshot of stats summary
- **Share**: copies `?player=<name>&tag=<tag>&region=<region>` URL to clipboard

### 5.4 ValBot AI Coach

All analysis runs **100% client-side** — no API calls, no LLM costs.

**`analyseStats(matchData, playerName)`** — pattern-matched heuristics:
- Parses K/D/A, headshot %, ACS, win rate from match array
- Identifies strengths (e.g. "Excellent headshotting", "Strong entry fragger", "Consistent winner")
- Identifies weaknesses (e.g. "High death rate", "Low assist contribution")
- Generates coaching tips based on identified patterns
- Mental game advice section
- Agent recommendations based on playstyle

**Per-match ValBot:** same engine but scoped to a single match's player list.

### 5.5 Esports Module

Tabs: **Live | Upcoming | Results | News | Rankings | VCT 2026 Roadmap**

- Fetches data from backend `/api/esports/*`
- Team logos use `/api/image?url=<logo_url>` proxy to bypass VLR.gg hotlink protection
- VCT 2026 Roadmap: static interactive timeline with logos sourced from `public/vct_teams.json`

### 5.6 Skins Store Module

**Featured Bundles** tab:
- Fetches `/api/store/featured`
- Renders bundle cards with bundle name, weapon previews, price, discount, countdown timer

**Cosmetics Catalog** tab:
- Fetches `https://valorant-api.com/v1/weapons/skins` directly from the browser
- Client-side filtering by name, weapon type, tier
- Interactive chroma swapper: clicking color badges swaps the displayed skin image
- Level/finisher video previews via inline `<video>` elements

### 5.7 Meta Comp Architect

Tabs per Valorant map (Ascent, Bind, Haven, Split, Icebox, Breeze, Fracture, Pearl, Lotus, Sunset, Abyss)

For each map:
- Fetches `/api/v3/meta-comps?map=<map>&patch=latest`
- Renders: most played comp, highest win rate comp, per-agent pick/win rate bar charts
- Shows patch version and total matches analyzed
- Data source: `public/vct_pro_comps.json` (pre-scraped VCT pro match compositions)

### 5.8 Mobile Layout

Mobile breakpoints: `max-width: 800px` and `max-width: 480px`

**CSS Grid Topbar** (implemented in v12.16):
```
grid-template-columns: 1fr auto
├── Row 1, Col 1: Logo (V + VALTRACKER.GG)
├── Row 1, Col 2: Profile pill (ItzPratham... ★ □ ✎) OR search inputs
├── Row 2, span full: Mobile filter toggle pill (AP • Comp • V26 Act 3)
└── Row 3, span full: Tab navigation (horizontal scroll)
```

**Collapsible filter drawer** (`.topbar-right`):
- Hidden by default on mobile (`display: none`)
- Toggled by `mobile-filter-toggle` button
- JS only auto-expands it on desktop (`window.innerWidth > 800`)

---

## 6. Styling — `public/index.css`

~4,400 lines of vanilla CSS organized into sections:

| Section | Description |
|---|---|
| CSS Variables (`:root`) | Design tokens: colors, fonts, spacing, breakpoints |
| Reset & Base | Box-sizing, scrollbar, body background |
| Typography | Rajdhani headings, DM Mono numbers, Inter body |
| Glassmorphism | `.glass`, `.glass-card` — `backdrop-filter: blur()` panels |
| Topbar | Navigation bar, tabs, filter capsules |
| Landing | Full-screen landing with animated orbs |
| Tracker | Stats panels, charts, match cards, scoreboard |
| Esports | Match cards, news, standings, roadmap timeline |
| Store | Bundle cards, skin catalog grid, chroma badges |
| Coach | Meta comps, agent bars |
| Animations | `@keyframes` for pulse, glow, slide |
| `@media (max-width: 1100px)` | Tablet overrides |
| `@media (max-width: 800px)` | Mobile overrides (CSS Grid topbar) |
| `@media (max-width: 480px)` | Narrow phone overrides |

**Design system tokens:**
```css
--accent: #ff4655;      /* Valorant red */
--bg: #030304;          /* Near-black background */
--surface: #0d0d0f;     /* Card background */
--border: rgba(255,255,255,0.06);
--text: #e8e8ec;        /* Primary text */
--text-muted: #6b7280;  /* Secondary text */
```

---

## 7. Data Files

### `public/vct_pro_comps.json`
Pre-built by `scrape_vlr_meta.py`. Array of records:
```json
{
  "match_id": "...",
  "map_name": "Ascent",
  "agents": ["Jett", "Omen", "Sage", "Sova", "Killjoy"],
  "has_won": true,
  "patch_version": "10.04"
}
```

### `public/vct_teams.json`
Large team database (~297KB). Built by `build_vct_2026.py`. Contains rosters, logos, player lists for all VCT franchised and ascended teams.

### `vlr_matches_backup.json` / `vlr_results_backup.json`
Auto-saved fallback data from last successful VLR.gg scrape. Written after every successful scrape, read when VLR.gg is unreachable (Cloudflare blocks, etc.).

---

## 8. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HENRIKDEV_API_KEY` | **Yes** | Auth key for HenrikDev Valorant API |
| `SUPABASE_URL` | Optional | Supabase project URL (enables DB caching) |
| `SUPABASE_KEY` | Optional | Supabase service role key |
| `CORS_ALLOWED_ORIGINS` | Optional | Comma-separated allowed origins (defaults to render + localhost) |
| `ADMIN_SECRET` | Optional | Token to access `/api/admin/feedback` |
| `PORT` | Optional | Server port (default: 5000) |

---

## 9. API Reference

### Player Proxy Routes (HenrikDev passthrough)
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/account/<name>/<tag>` | Player account info (PUUID, level, card) |
| GET | `/api/v3/mmr/<region>/pc/<name>/<tag>` | Current rank, RR, peak rank |
| GET | `/api/v3/matches/<region>/<name>/<tag>` | Match history (merged live + archived) |
| GET | `/api/v1/stored-mmr-history/<region>/<name>/<tag>` | MMR history per act |
| GET | `/api/v2/match/<match_id>` | Full match details |
| GET | `/api/v1/leaderboard/<region>` | Top 500 leaderboard |

### Esports Routes
| Method | Route | Description |
|---|---|---|
| GET | `/api/esports/live` | Currently live VCT matches |
| GET | `/api/esports/upcoming` | Scheduled upcoming matches |
| GET | `/api/esports/results` | Completed match results |
| GET | `/api/esports/news` | Latest news from VLR.gg |
| GET | `/api/esports/standings/<region>` | Regional team rankings |
| GET | `/api/esports/event/<event_id>` | Teams in a specific VCT event |

### Store Routes
| Method | Route | Description |
|---|---|---|
| GET | `/api/store/featured` | Featured store bundles |

### Meta Routes
| Method | Route | Description |
|---|---|---|
| GET | `/api/v3/meta-comps?map=<map>&patch=<patch>` | Pro compositions analytics |

### Utility Routes
| Method | Route | Description |
|---|---|---|
| GET | `/api/image?url=<url>` | Image proxy (bypasses hotlink bans) |
| POST | `/api/clear-cache` | Clears in-memory server cache |
| POST | `/api/feedback` | Submit user feedback |
| GET | `/api/admin/feedback?secret=<token>` | Read all feedback (admin) |

---

## 10. Dependencies

### Python (requirements.txt)
| Package | Version | Use |
|---|---|---|
| `Flask` | 3.1.3 | Web framework |
| `requests` | 2.32.5 | HTTP client for API calls and VLR.gg scraping |
| `python-dotenv` | 1.2.2 | Load `.env` file |
| `Flask-Cors` | 6.0.2 | CORS headers |
| `gunicorn` | 21.2.0 | Production WSGI server |
| `beautifulsoup4` | 4.12.3 | HTML parsing for VLR.gg scraping |

### Frontend (CDN, no npm)
| Library | Version | Use |
|---|---|---|
| Chart.js | 4.4.1 | Performance/trend charts |
| html2canvas | 1.4.1 | Stats card screenshot export |
| Google Fonts | — | Rajdhani, Exo 2, Barlow Condensed, DM Mono, Inter |

---

## 11. Deployment

### Platform: Render (Free Tier)

| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Build command | `pip install -r requirements.txt` |
| Start command | `python app.py` |
| Instance type | Free (0.1 vCPU, 512 MB RAM) |
| Region | Oregon, US |
| Auto-deploy | Yes — on push to `main` branch |

### Keeping Alive
Render free instances sleep after 15 minutes of inactivity. **UptimeRobot** pings the site every 5 minutes to keep it awake.

### Production Server
`gunicorn` is installed but `python app.py` is used as the start command, which runs Flask's built-in server with `debug=False`. For higher traffic, the start command can be changed to:
```
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
```

---

## 12. Known Limitations & Gotchas

| Issue | Details |
|---|---|
| **VLR.gg Cloudflare blocks** | VLR.gg occasionally returns 403 due to Cloudflare. The scraper falls back to expired memory cache → persistent backup JSON. |
| **HenrikDev rate limits** | Free tier: 30 req/min. Supabase caching significantly reduces API calls for repeat lookups. |
| **Match history limit** | HenrikDev API returns max 20 matches per request. ValTracker extends this by merging with the Supabase `matches_cache` archive. |
| **Supabase free tier** | 500MB DB storage, 5GB bandwidth. `compress_match_json()` strips matches to ~1KB each to stay within limits. |
| **Single-worker memory cache** | In-memory cache is per-process. If gunicorn runs multiple workers, each has its own cache (no shared state). Acceptable for free tier with 1 worker. |
| **`overflow-x: clip` on body** | Must use `clip` not `hidden` — `hidden` breaks `position: sticky` on mobile Safari. |
| **Inline JS/CSS limits** | The single-file approach means index.html is ~600KB. Users get it gzipped to ~90KB. |
| **No auth system** | The app is entirely read-only (no Valorant login). Store data is global featured bundles, not user-specific inventory. |

---

## 13. Utility Scripts

| Script | Description |
|---|---|
| `scrape_vlr_meta.py` | Scrapes VCT match compositions from VLR.gg match pages, builds `vct_pro_comps.json` |
| `build_vct_2026.py` | Builds `vct_teams.json` from VLR.gg team pages (rosters, logos) |
| `scrape_events.py` | Fetches VCT event listings |
| `scrape_rosters.py` | Fetches player rosters per team |
| `fix_teams.py` / `fix_names.py` | Post-process team name normalization in JSON data |
| `kill_server.py` | Kills any running Flask server on the configured port |
| `test_hdev.py` | Tests HenrikDev API connectivity |
| `test_local_server.py` | Tests the local Flask server endpoints |

---

*Built with ❤️ by ItzPratham, 2026*

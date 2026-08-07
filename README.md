<div align="center">

<img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/logo.png" alt="ValTracker.gg Logo" width="100"/>

# ValTracker.gg

**A modern, full-stack Valorant stats tracker & esports analytics platform.**  
Real-time player stats · Astro + Svelte frontend · VCT Esports Hub · AI Coach · Skins Store · Meta comp analytics

[![Live Demo](https://img.shields.io/badge/Live%20Demo-valtracker--gg.onrender.com-ff4655?style=for-the-badge&logo=render)](https://valtracker-gg.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-itzpratham1%2FValTracker.gg-181717?style=for-the-badge&logo=github)](https://github.com/itzpratham1/ValTracker.gg)
[![Astro](https://img.shields.io/badge/Astro-5.0+-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5.0+-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com)

</div>

---

## 📸 Interface Preview

<div align="center">

| 🎯 Player Stats & Analytics | 🤖 ValBot AI Coach |
|---|---|
| <img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/stats_tracker_card.webp" alt="Stats Tracker Preview" width="400"/> | <img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/Val_bot_analysis.webp" alt="AI Coach Preview" width="400"/> |

| 🎮 VCT Esports Hub | 🛒 Live Skins Store |
|---|---|
| <img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/VCT_Esports.webp" alt="VCT Esports Preview" width="400"/> | <img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/skin_store.webp" alt="Skins Store Preview" width="400"/> |

</div>

---

## ⚡ Overview

**ValTracker.gg** is a high-performance, full-stack web application designed for Valorant players, esports fans, and content creators. Built with an ultra-fast **Astro + Svelte 5** client-island architecture and powered by a robust **Python Flask API** backend, ValTracker.gg offers deep stat tracking, real-time VCT esports coverage, live store bundle showcases, pro meta comp analysis, and interactive streaming overlays.

---

## ✨ Features

### 🎯 Player Stats & Analytics
| Feature | Description |
|---|---|
| **Combat Performance** | Track K/D ratio, ACS, Headshot %, KDA, and score trends |
| **Visual Charts** | Dynamic win rate and rank rating progression charts via Chart.js |
| **Agent Bento & Deep Stats** | Comprehensive per-agent win rates, K/D ratios, and pick frequencies |
| **Map & Weapon Breakdown** | Performance matrix across all competitive maps and weapon classes |
| **Match History & Breakdown** | Full per-match scoreboards, round timelines, kill feeds, and duel matrices |
| **Rank Pace Prediction** | Intelligent engine predicting matches needed to reach your next rank based on current pace |
| **Session Tracker** | Real-time session logger with live K/D tracker and performance summary |
| **Head-to-Head Comparison** | Side-by-side player stat comparisons |
| **Leaderboards** | Regional Top 500 leaderboard browsing across AP, NA, EU, KR, BR, LATAM |
| **⚡ Season Wrapped** | Automatic end-of-act & end-of-month player performance recap engine |
| **Export & Share** | Generate downloadable image stat cards (html2canvas) or share profile deep links |

### 🤖 ValBot AI Coach
- **Zero-Cost Client-Side AI**: Analyzes fetched match data locally in the browser — no costly LLM API fees.
- **Actionable Insights**: Evaluates combat performance, agent versatility, headshot accuracy, and mental game consistency.
- **Customized Tips**: Delivers tailored advice for rank progression based on recent performance metrics.

### 🎮 VCT Esports Hub
| Feature | Description |
|---|---|
| **Live Match Tracking** | Real-time VCT match scores scraped from VLR.gg with automatic fallbacks |
| **Upcoming Fixtures & Results** | Countdown timers for upcoming matches & archived tournament results |
| **Regional Rankings** | Global & regional VCT team standings updated automatically |
| **Esports News Feed** | Latest news aggregation with 3-tier fallback (Live Scrape → In-Memory Cache → JSON Backup) |
| **VCT Season Roadmap** | Interactive season timeline showcasing international leagues and Ascension teams |

### 🛒 Skins Store & Catalog
| Feature | Description |
|---|---|
| **Featured Bundles** | Live in-game store showcase with skin bundles, prices, and countdown timers |
| **Weapon Skin Catalog** | Filterable cosmetics database by tier, weapon category, and skin name |
| **Dynamic Chroma Swapper** | Interactive color variant badge swapper updating high-res skin renders live |
| **Finisher & Upgrade Previews** | Inline video player showcasing skin level VFX/SFX animations and finishers |

### 🧠 Meta Comp Architect & Tools
- **Pro Team Compositions**: Analyze VCT pro team lineups and pick rates per map and patch.
- **Draft Coach**: Interactive composition evaluation tool to optimize agent synergies.
- **OBS Stream Overlay**: Customizable transparent overlay for content creators to broadcast live stats in OBS Studio.

---

## 🛠 Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | [Astro 6](https://astro.build) | Server-side rendering, static site generation, fast page loading |
| **UI Components** | [Svelte 5](https://svelte.dev) | Interactive client-side islands, reactive stores, and UI state |
| **Styling** | Vanilla CSS Design System | Custom dark mode palette (`--accent: #fa4454`), glassmorphism, responsive Grid/Flexbox |
| **Backend API** | Python 3.10+ / Flask 3.1 | RESTful API proxy, CORS management, data caching, VLR scraping |
| **WSGI Server** | Gunicorn | High-concurrency production server |
| **Data Sources** | [HenrikDev Valorant API](https://docs.henrikdev.xyz) | Accounts, MMR ratings, match details, leaderboards |
| **Cosmetics API** | [valorant-api.com](https://valorant-api.com) | Weapon skins, store bundles, agent icons, map assets |
| **Esports Scraper** | BeautifulSoup4 | Scrapes live match scores, news, and standings from VLR.gg |
| **Database & Cache** | Supabase (PostgreSQL) | Player profile caching and extended match history storage |
| **Charts & Visuals** | Chart.js 4.5 | Interactive line charts and stat visualizations |
| **Export Utility** | html2canvas 1.4 | Client-side stats card image rendering |
| **Deployment** | Render / Vercel | Multi-service web deployment (Frontend + Flask API) |

---

## 📁 Project Structure

```
ValTracker.gg/
├── frontend/                   # Modern Astro + Svelte Frontend App
│   ├── src/
│   │   ├── components/        # Svelte UI Components
│   │   │   ├── tracker/       # Topbar, Hero, MatchRow, Bento, ValBot, Charts
│   │   │   ├── esports/       # Esports Hub, Live Matches, Rankings, News
│   │   │   ├── store/         # Store Bundles, Cosmetics, Chroma Swapper
│   │   │   ├── coach/         # Draft Coach & Meta Comp Architect
│   │   │   ├── overlay/       # OBS Streamer Overlay
│   │   │   └── shared/        # Toast, Footer, ProfileShare modal
│   │   ├── layouts/           # Layout.astro base template
│   │   ├── lib/               # API wrapper, TypeScript types, Svelte stores
│   │   ├── pages/             # App routing (index.astro, app.astro, overlay.astro, 404)
│   │   └── styles/            # tokens.css & global.css design tokens (~6,700 lines)
│   ├── public/                # Static assets, landing animations, fallback images
│   ├── astro.config.mjs       # Astro configuration & Vite proxy setup
│   └── package.json           # Frontend dependencies
│
├── api.py                      # Flask API Backend — endpoints, caching, scrapers (~1,600 lines)
├── gunicorn.conf.py            # Production WSGI server configuration
├── requirements.txt            # Python backend dependencies
├── render.yaml                 # Render infrastructure-as-code deployment manifest
├── Dockerfile                  # Container definition for backend services
├── DOCUMENTATION.md            # Comprehensive architecture documentation
└── public/                     # Backend static assets & scraped JSON database backups
```

---

## 🔌 API Reference Overview

The Flask backend provides a centralized CORS-enabled API proxy to securely interface with third-party Valorant endpoints without exposing client-side credentials.

### Tracker Endpoints
- `GET /api/v1/account/<name>/<tag>` — Retrieve player Riot account information
- `GET /api/v3/mmr/<region>/pc/<name>/<tag>` — Fetch player current rank, RR, and MMR tier
- `GET /api/v3/matches/<region>/<name>/<tag>` — Fetch recent match history (merged live + archive)
- `GET /api/v2/match/<match_id>` — Fetch detailed scoreboard, round timeline, and kill feed
- `GET /api/v1/leaderboard/<region>` — Top 500 leaderboard data by region

### Esports Endpoints
- `GET /api/esports/live` — Live VCT match scores
- `GET /api/esports/upcoming` — Upcoming fixtures calendar
- `GET /api/esports/results` — Tournament match results
- `GET /api/esports/news` — Scraped VLR.gg esports news feed
- `GET /api/esports/standings/<region>` — Team rankings and regional standings

### Store & Meta Endpoints
- `GET /api/store/featured` — Current in-game featured store bundles
- `GET /api/v3/meta-comps?map=<map>` — Pro team composition win rates and pick rates

---

## 🔑 Environment Variables

To run ValTracker.gg locally or deploy it to production, set up the following environment variables in a `.env` file in the root directory:

```env
# Required — HenrikDev Valorant API key (get free key at https://docs.henrikdev.xyz)
HENRIKDEV_API_KEY=your_henrikdev_api_key_here

# Optional — Supabase integration for persistent caching and extended match history
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# Optional — Production Frontend API URL override
PUBLIC_API_URL=https://valtracker-api.onrender.com
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **npm** or **pnpm**

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/itzpratham1/ValTracker.gg.git
   cd ValTracker.gg
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the project root:
   ```bash
   echo "HENRIKDEV_API_KEY=your_api_key_here" > .env
   ```

3. **Start the Flask Backend API (Terminal 1)**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt

   # Run the API server on http://localhost:5000
   python api.py
   ```

4. **Start the Astro + Svelte Frontend (Terminal 2)**
   ```bash
   cd frontend

   # Install Node dependencies
   npm install

   # Start the development server on http://localhost:4321
   npm run dev
   ```

5. **Access the Application**
   Open your browser and navigate to:
   - **Landing Page**: `http://localhost:4321`
   - **Tracker App**: `http://localhost:4321/app?name=HARSH&tag=khel&region=ap&mode=competitive`

---

## ☁️ Deployment

ValTracker.gg is configured for seamless deployment on **Render** (via `render.yaml`) or **Vercel**:

### Render Multi-Service Setup
- **Backend Service (`valtracker-api`)**: Python runtime running Gunicorn (`gunicorn -c gunicorn.conf.py api:app`).
- **Frontend Service (`valtracker-frontend`)**: Node runtime building Astro static pages and Svelte client bundles (`npm run build`).

---

## 🏗 Key Engineering Highlights

- **Astro + Svelte Island Architecture**: Delivers near-instant page load times for marketing pages while enabling granular client-side interactivity (`client:only="svelte"`) for player stats.
- **Dual-Layer Smart Caching**: In-memory dictionary cache (1–24h TTL) combined with Supabase PostgreSQL caching (15-min TTL) reduces external API latency and prevents rate-limiting.
- **Graceful Fallback Resilience**: Esports and store scrapers employ a 3-stage fallback strategy (Live Scrape → Memory Cache → Scraped JSON Backup) to guarantee 99.9% uptime.
- **Client-Side AI Coaching**: Operates on structured player data arrays directly within the user's browser, eliminating LLM API invocation costs and preserving user privacy.

---

## 📖 Documentation

For detailed technical specs, API schemas, and architecture diagrams, check out [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## 👤 Author

**ItzPratham**  
Website: [ValTracker.gg](https://valtracker-gg.onrender.com) · GitHub: [@itzpratham1](https://github.com/itzpratham1)

---

<div align="center">
Built with ❤️ for the Valorant Community.
</div>

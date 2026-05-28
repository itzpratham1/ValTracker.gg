<div align="center">

<img src="https://raw.githubusercontent.com/itzpratham1/ValTracker.gg/main/public/valorant_v_logo.png" alt="ValTracker.gg Logo" width="80"/>

# ValTracker.gg

**A premium, full-stack Valorant stats tracker.**  
Real-time match data · Esports coverage · AI coaching · Skins store · Meta analytics

[![Live Demo](https://img.shields.io/badge/Live%20Demo-valtracker--gg.onrender.com-ff4655?style=for-the-badge&logo=render)](https://valtracker-gg.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-itzpratham1%2FValTracker.gg-181717?style=for-the-badge&logo=github)](https://github.com/itzpratham1/ValTracker.gg)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com)

</div>

---

## ✨ Features

### 🎯 Tracker
| Feature | Description |
|---|---|
| **Combat Stats** | K/D ratio, ACS, headshot %, kills/deaths/assists per game |
| **Performance Trends** | Win rate over time, rating trends with Chart.js visualization |
| **Agent Stats** | Win rate, K/D, and pick frequency per agent |
| **Map Stats** | Win rate and performance breakdown per map |
| **Weapon Stats** | Most used weapons and their effectiveness metrics |
| **Match History** | Full per-match breakdown — scoreboard, round timeline, kill feed, duel stats |
| **ValBot AI Coach** | Client-side AI analysis — strengths, weaknesses, coaching tips, mental game. No API cost. |
| **Session Tracker** | Track K/D and wins within a play session with Start/Stop/Summary |
| **Head-to-Head** | Compare two players side by side |
| **Top 500 Leaderboard** | View ranked leaderboard by region |
| **Export Stats Card** | Screenshot and share your stats summary card via html2canvas |
| **Share Profile** | Copy a deep-link URL to any player's profile |

### 🎮 Esports
| Feature | Description |
|---|---|
| **Live Matches** | Real-time VCT match scores (VLR.gg scraper) |
| **Upcoming Matches** | Scheduled VCT fixtures with countdown |
| **Results** | Completed match results |
| **Rankings** | Regional team standings (VLR.gg scraped) |
| **News** | Latest esports news — BS4 scrape → public API fallback → cached backup |
| **VCT 2026 Roadmap** | Interactive season timeline with franchised + ascended teams |

### 🛒 Skins Store
| Feature | Description |
|---|---|
| **Featured Bundles** | Live in-game featured store bundles with prices and countdown timers |
| **Cosmetics Catalog** | Full weapon skins database — filter by name, weapon, tier |
| **Chroma Swapper** | Swap skin renders in real-time using color variant badges |
| **Finisher Previews** | Inline video player for VFX/SFX upgrade animations |

### 🧠 Meta Comp Architect
- Pro composition data scraped from VCT match history
- Per-map agent pick rates and win rates
- Most played & highest win rate 5-agent lineups per patch

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask 3.1.3, Gunicorn |
| **Frontend** | Vanilla HTML + CSS + JavaScript — single-page app, no framework, no build step |
| **Styling** | Custom CSS design system — glassmorphism, CSS Grid, Rajdhani/DM Mono fonts |
| **Valorant API** | [HenrikDev API](https://docs.henrikdev.xyz) — accounts, MMR, match history, store |
| **Cosmetics** | [valorant-api.com](https://valorant-api.com) — skins database, bundle metadata |
| **Esports Data** | VLR.gg HTML scraping (BeautifulSoup4) |
| **Database** | Supabase (PostgreSQL) — player profile cache + match history archive |
| **Charts** | Chart.js 4.4.1 |
| **Screenshot** | html2canvas 1.4.1 |
| **Hosting** | Render (free tier) |
| **CI/CD** | GitHub → Render auto-deploy on push to `main` |
| **Uptime** | UptimeRobot 5-minute ping |

---

## 📁 Project Structure

```
ValTracker.gg/
├── app.py                  # Flask backend — all API routes, proxy, caching (1,629 lines)
├── requirements.txt        # 6 Python dependencies
├── .env                    # Secret keys (NOT in git)
├── DOCUMENTATION.md        # Full technical documentation
│
└── public/                 # Static files served by Flask
    ├── index.html          # Complete frontend SPA (~11,500 lines)
    ├── index.css           # Design system + all styles (~4,400 lines)
    ├── 404.html            # Custom error page
    ├── vct_pro_comps.json  # Pre-scraped VCT pro compositions database
    └── vct_teams.json      # VCT team roster database
```

---

## 🔌 API Endpoints

### Tracker (HenrikDev Proxy)
| Route | Description |
|---|---|
| `GET /api/v1/account/<name>/<tag>` | Player account info |
| `GET /api/v3/mmr/<region>/pc/<name>/<tag>` | Current rank & MMR |
| `GET /api/v3/matches/<region>/<name>/<tag>` | Match history (live + archived, unlimited) |
| `GET /api/v2/match/<match_id>` | Full match detail |
| `GET /api/v1/stored-mmr-history/<region>/<name>/<tag>` | Act MMR history |
| `GET /api/v1/leaderboard/<region>` | Top 500 leaderboard |

### Esports
| Route | Description |
|---|---|
| `GET /api/esports/live` | Live VCT matches |
| `GET /api/esports/upcoming` | Upcoming matches |
| `GET /api/esports/results` | Completed results |
| `GET /api/esports/news` | Latest VLR.gg news |
| `GET /api/esports/standings/<region>` | Team rankings |

### Store & Meta
| Route | Description |
|---|---|
| `GET /api/store/featured` | Featured store bundles |
| `GET /api/v3/meta-comps?map=<map>` | Pro composition analytics |

### Utility
| Route | Description |
|---|---|
| `GET /api/image?url=<url>` | Image proxy (bypasses CORS/hotlinks) |
| `POST /api/feedback` | Submit user feedback |

---

## 🔑 Environment Variables

Create a `.env` file in the root:

```env
HENRIKDEV_API_KEY=your_api_key_here

# Optional — enables persistent player cache and unlimited match history
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
```

Get your free HenrikDev API key at: [docs.henrikdev.xyz](https://docs.henrikdev.xyz)

---

## 🚀 Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/itzpratham1/ValTracker.gg.git
cd ValTracker.gg

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
echo HENRIKDEV_API_KEY=your_key_here > .env

# 4. Start the server
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

---

## ☁️ Deployment (Render)

| Setting | Value |
|---|---|
| Platform | [Render](https://render.com) Free Tier |
| Runtime | Python 3 |
| Build command | `pip install -r requirements.txt` |
| Start command | `python app.py` |
| Auto-deploy | Every push to `main` |
| Live URL | https://valtracker-gg.onrender.com |

Add `HENRIKDEV_API_KEY` (and optionally `SUPABASE_URL` / `SUPABASE_KEY`) in Render → Settings → Environment Variables.

---

## 🏗 Architecture Highlights

- **Proxy architecture** — all HenrikDev API calls go through Flask to keep the API key server-side
- **Two-layer caching** — in-memory dict (1–24h TTL) + Supabase DB (15-min TTL) for instant repeat lookups
- **Match history merging** — combines live API data (20 matches) with Supabase archive for unlimited history
- **VLR.gg resilience** — 3-layer fallback: live scrape → expired memory cache → persistent backup JSON
- **Client-side AI** — ValBot analysis runs entirely in the browser using fetched data; zero LLM API cost
- **No frontend build step** — pure Vanilla JS/CSS, loads instantly with no bundler required
- **CSS Grid topbar** — mobile layout uses `grid-template-columns: 1fr auto` to guarantee logo + profile pill on the same row regardless of screen width
- **On-the-fly Gzip** — Flask middleware compresses HTML/CSS/JSON responses for all clients that support it

---

## 📱 Mobile Support

- Fully responsive down to 320px width
- CSS Grid topbar: logo and profile pill always on same row
- Collapsible filter drawer (AP · Mode · Season) — hidden by default, toggled by red pill button
- Horizontal scroll tab navigation with touch support
- Sticky secondary nav bar during scroll

---

## 📖 Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for the full technical reference:
- Complete backend architecture & data flow diagrams
- Every API endpoint with request/response details
- Caching system design
- Mobile CSS Grid layout breakdown
- Supabase integration details
- Known limitations and gotchas

---

## 👤 Author

**ItzPratham** — student at the National Institute of Technology, India  
Built as a personal project for the Valorant community 🎯

---

*Last updated: May 2026 · v8*

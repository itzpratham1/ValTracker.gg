# ValTracker.gg 🎯

> A premium Valorant stats tracker with real-time match data, esports coverage, AI-powered performance analysis, and a fully responsive cyberpunk UI.

**Live URL:** https://valtracker-gg.onrender.com  
**GitHub:** https://github.com/itzpratham1/ValTracker.gg

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment (Render)](#deployment-render)
- [Key Design Decisions](#key-design-decisions)

---

## ✨ Features

### Tracker
| Feature | Description |
|---|---|
| **Combat Stats** | K/D, ACS, headshot %, kills/deaths/assists per game |
| **Performance Trends** | Win rate over time, rating trends across sessions |
| **Agent Stats** | Win rate, K/D, and usage per agent |
| **Map Stats** | Win rate and performance breakdown per map |
| **Weapon Stats** | Most used weapons and their effectiveness |
| **Match History** | Detailed per-match breakdown with scoreboard, round timeline, kill feed, duel stats |
| **ValBot AI Coach** | Client-side AI analysis — strengths, weaknesses, coaching tips, mental game advice. No external API needed. |
| **ValBot Match Analysis** | Per-match AI breakdown of combat performance, map impact, and key moments |
| **Deep Game Analysis** | Advanced statistical deep-dives |
| **Performance Lab** | Experimental performance benchmarks and probability tools |
| **Session Tracker** | Track stats within a play session (Start/Stop/Summary) |
| **Head-to-Head Compare** | Compare two players side by side |
| **Top 500 Leaderboard** | View top ranked players |
| **Export Stats Card** | Export a shareable stats card image |
| **Share Profile** | Copy a shareable link to a profile |

### Esports
| Feature | Description |
|---|---|
| **Live Matches** | Live VCT match scores sourced from HenrikDev esports API |
| **Upcoming Matches** | Scheduled VCT matches |
| **Results** | Completed match results |
| **Rankings** | Regional team standings (scraped from VLR.gg) |
| **News** | Latest Valorant esports news (scraped from VLR.gg) |

### UI/UX
- Cyberpunk glassmorphism dark theme
- Fully **responsive mobile layout** with sticky navigation panel
- Smooth micro-animations and hover effects
- Toast notifications for user feedback
- Sticky secondary nav bar (Combat / Performance / Trend / Agents / Maps / Weapons / Matches)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask 3.1.3 |
| **Frontend** | Vanilla HTML, CSS, JavaScript (single-page app) |
| **API Source** | [HenrikDev API](https://docs.henrikdev.xyz) (Valorant data) |
| **Esports Data** | HenrikDev esports schedule + VLR.gg scraping (BeautifulSoup4) |
| **Hosting** | Render (free tier) |
| **Uptime Monitor** | UptimeRobot (5-min ping to prevent sleep) |
| **Version Control** | GitHub — `itzpratham1/ValTracker.gg` |
| **CORS** | Flask-CORS |
| **Server** | Gunicorn (production), Flask dev server (local) |
| **Caching** | In-memory server cache (1 min TTL for match data, 2 min for esports, 10 min for news, 1 hr for standings) |

---

## 📁 Project Structure

```
v8/
├── app.py                  # Flask backend — all API routes & proxy logic
├── requirements.txt        # Python dependencies
├── .env                    # Secret keys (NOT committed to git)
├── .gitignore
├── README.md
└── public/
    ├── index.html          # Entire frontend — single HTML file (~6500 lines)
    └── index.css           # All styles — design system, components, responsive (~2900 lines)
```

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Serves the frontend (`public/index.html`) |
| `GET` | `/api/v1/live-match/<region>/<name>/<tag>` | Live match detection (lockfile → history fallback → demo) |
| `GET/POST` | `/api/<path>` | Transparent proxy to HenrikDev Valorant API |
| `POST` | `/api/clear-cache` | Clears the in-memory server cache |
| `GET` | `/api/esports/live` | Live VCT matches |
| `GET` | `/api/esports/results` | Completed VCT matches |
| `GET` | `/api/esports/upcoming` | Upcoming VCT matches |
| `GET` | `/api/esports/news` | Latest news scraped from VLR.gg |
| `GET` | `/api/esports/standings/<region>` | Team rankings scraped from VLR.gg |

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
HENRIKDEV_API_KEY=your_api_key_here
```

Get your free API key at: https://docs.henrikdev.xyz

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- pip

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/itzpratham1/ValTracker.gg.git
cd ValTracker.gg

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env file
echo HENRIKDEV_API_KEY=your_key_here > .env

# 4. Start the server
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

---

## ☁️ Deployment (Render)

### Current Setup
- **Platform:** [Render](https://render.com) Free Tier
- **Live URL:** https://valtracker-gg.onrender.com
- **Auto-deploy:** Connected to `main` branch on GitHub — every push auto-deploys
- **Uptime:** Kept alive via [UptimeRobot](https://uptimerobot.com) (pings every 5 minutes)

### Render Configuration
| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python app.py` |
| Instance Type | Free (0.1 CPU, 512 MB RAM) |
| Region | Oregon (US West) |

### Environment Variables on Render
Add the following in Render → Settings → Environment Variables:
```
HENRIKDEV_API_KEY = your_api_key_here
```

---

## 🎨 Key Design Decisions

- **Single-file frontend**: All UI logic lives in `public/index.html` for simplicity and easy deployment — no build step required.
- **Client-side AI**: ValBot analysis (`analyseStats`) runs entirely in the browser using match data already fetched. No LLM API costs.
- **Proxy architecture**: All HenrikDev API calls go through the Flask backend to hide the API key from the browser.
- **In-memory caching**: Prevents hammering the HenrikDev rate limits. Cache resets on server restart (acceptable for free tier).
- **`overflow-x: clip` on body**: Using `clip` instead of `hidden` ensures `position: sticky` works correctly on mobile Safari/Chrome browsers.
- **No framework**: Pure Vanilla JS + CSS — zero dependencies on the frontend, loads instantly.

---

## 📱 Mobile Support

- Fully responsive down to 320px screen width
- Sticky secondary nav (`Combat / Performance / Trend / ...`) stays fixed at top while scrolling on mobile
- Collapsible nav-right (Session + Utilities) stacks vertically on small screens
- Horizontal scroll on match scoreboards with touch support

---

*Last updated: May 2026*

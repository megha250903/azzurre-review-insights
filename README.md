# azzurre-review-insights
# 🏨 Azzurro Hotels — Booking.com Review Intelligence Dashboard

A full-stack operations intelligence platform that automatically scrapes, deduplicates, AI-analyzes, and visualizes real Booking.com guest reviews across all 4 Azzurro Hotels properties in Sydney.

Built with **React 18 + Vite**, **Tailwind CSS**, **Node.js (ES Modules) + Express**, **MongoDB Atlas**, **Playwright**, and **Groq (Llama 3 8B) / Google Gemini 1.5 Flash**.

---

## 📍 Properties Covered

| Property | Slug | Booking.com URL | Reviews in DB |
|:---|:---|:---|:---:|
| **Olympic Hotel Paddington** | `olympic-paddington` | [booking.com/hotel/au/olympic-paddington](https://www.booking.com/hotel/au/olympic-paddington.html) | **122** |
| **Azzurro Pod Hotel Central Sydney** | `venus-surry-hills` | [booking.com/hotel/au/venus-surry-hills](https://www.booking.com/hotel/au/venus-surry-hills.html) | **80** |
| **Azzurro Pod Hotel Potts Point** | `venus-potts-point-sydney` | [booking.com/hotel/au/venus-potts-point-sydney](https://www.booking.com/hotel/au/venus-potts-point-sydney.html) | **40** |
| **Azzurro Pod Hotel Darling Harbour** | `chateau-de-venus` | [booking.com/hotel/au/chateau-de-venus](https://www.booking.com/hotel/au/chateau-de-venus.html) | **30** |
| **Total Real Reviews** | | | **272** |

> **Zero Mock Data:** 100% of reviews in MongoDB are authentic, live Booking.com guest submissions with real reviewer names (e.g. Farzaneh, Parker, Georgia, Dylan, Malcolm, Leif) and countries.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Live Playwright Automation Engine                          │
│  - Chromium + Stealth Flags (--disable-blink-features)      │
│  - Desktop Viewport (1366x768) + Accept-Language Headers    │
│  - Dynamic Modal Trigger (getByRole / accessibility tree)   │
│  - Multi-page Pagination (up to 15 pages per property)      │
│  - Line 0/1 DOM Text Parser (Guest Name & Country)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Deduplication & Storage Engine (MongoDB Atlas)             │
│  - SHA-256 Hash: slug + reviewerName + date + text          │
│  - Unique Compound Index on reviewHash                      │
│  - $set Upsert to update names and topics idempotently      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Operational Intelligence & AI Classification               │
│  - 8 Operational Buckets: Cleanliness, Check-in, Staff,     │
│    Noise, Facilities, Location, Room, Value                 │
│  - Primary: Groq (Llama 3 8B) for 15-word executive summary │
│  - Automated Fallback: Google Gemini 1.5 Flash              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Express.js REST API (Node 18+ ESM)                         │
│  - GET /api/reviews/:propertyKey (pagination, search, filter│
│  - GET /api/analytics/all & /compare/all (KPIs, WoW deltas) │
│  - POST /api/scraper/run (on-demand background re-scrape)   │
│  - node-cron daily schedule at 3:00 AM Sydney Time          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Azzurro Operations Dashboard (React 18 + Vite)             │
│  - Brand Theme: Warm Ivory (#FAF8F4), Poppins, Azure Blue   │
│  - Executive Operations Alert Banner (Rating drops)         │
│  - 8-Topic Operational Defect Matrix                        │
│  - 12-Month Sentiment Trendline & Donut Breakdown           │
│  - Live Operations Feed with Keyword Search & CSV Export    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB Atlas** account (or local MongoDB 6+)
- **Groq API Key** (free tier at [console.groq.com](https://console.groq.com))
- **Google Gemini API Key** (free tier at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Setup
```bash
git clone https://github.com/megha250903/azzurre-review-insights.git
cd azzurre-review-insights
```

### 2. Configure Environment Variables
Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install & Start Backend
```bash
cd server
npm install
npx playwright install chromium
npm run dev
# Backend running at http://localhost:5000
```

### 4. Install & Start Frontend
```bash
cd ../client
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 🔍 Review Collection & Scraping Methodology

### Why Headless Browser Scraping?
Booking.com does not offer a public REST API for property reviews. Attempting to fetch reviews with basic HTTP requests (Axios, Cheerio, or curl) results in Akamai/Cloudflare bot challenge screens (HTTP 202/403) or an empty HTML skeleton because review cards are dynamically hydrated inside a React modal.

### Technical Implementation:
1. **Accessibility Role Locator:**
   Booking.com uses different button class names and text across hotels (e.g. Olympic Paddington renders `"Pleasant · 124 reviews"` due to its 6.5 rating). Standard CSS selectors fail. The scraper utilizes Playwright's role locator:
   ```javascript
   page.getByRole('button', { name: /read all \d* reviews/i })
     .or(page.getByRole('button', { name: /pleasant.*reviews/i }))
     .or(page.getByRole('button', { name: /reviews/i }));
   ```
2. **Guest Name & Country Extraction:**
   Booking.com renders reviewer info in avatar wrappers where standard `h4` tags often return null or generic text. Inspecting the raw innerText revealed that **Line 0** contains the actual guest first name (Farzaneh, Georgia, Malcolm, Parker, Dylan) and **Line 1** contains the country (Australia, Bulgaria, etc.).
3. **Modal Pagination:**
   The scraper automates the `"Next page"` button (`button[aria-label="Next page"]`) through up to 15 pages per property, extracting 10 review cards per page.
4. **Idempotency & Deduplication:**
   Every review receives a deterministic SHA-256 hash:
   $$\text{hash} = \text{SHA256}(\text{slug} \parallel \text{reviewerName} \parallel \text{date} \parallel \text{normalizedText})$$
   MongoDB enforces a unique compound index on `reviewHash`, ensuring that repeat runs or manual refresh clicks never create duplicates.

---

## 🧠 Operational Topic Classification (8 Core Categories)

Reviews are categorized into the 8 mandatory operational focus areas:

| Operational Topic | Keyword Indicators |
|:---|:---|
| 🧼 **Cleanliness** | Clean, dirty, hygiene, smell, bathroom, shower, toilet, sheets |
| 🔑 **Check-in** | Check-in, key, reception, kiosk, code, delay, front desk, late |
| 🤝 **Staff** | Friendly, helpful, rude, service, Adrian, Florence, cleaner, manager |
| 🔊 **Noise** | Loud, noisy, quiet, sound, traffic, street, earplugs, snoring |
| 🚿 **Facilities** | Elevator, lift, kitchen, microwave, coffee, common area, luggage |
| 📍 **Location** | Station, central, walking distance, bus, CBD, stadium, close |
| 🛏️ **Room** | Bed, mattress, pillow, pod, curtain, aircon, fan, heating, window |
| 💰 **Value** | Affordable, cheap, price, worth, cost, expensive, budget |

---

## 📊 Operations Dashboard Features

1. **Executive Alert Banner:** Prominently flags properties experiencing rating decreases week-over-week (e.g. Olympic Paddington's rating shift) with immediate operational action items.
2. **8-Topic Operational Defect Matrix:** Visual defect distribution bars enabling hotel managers to identify top guest complaint areas at a glance.
3. **Sentiment Donut & 12-Month Trendline:** Recharts visualizations showing positive, neutral, and negative sentiment distribution alongside monthly historical ratings.
4. **Live Operations Feed:**
   - Filter by property (All 4 Properties, Central Sydney, Darling Harbour, Potts Point, Olympic Paddington).
   - Filter by sentiment (Positive Only, Negative Only / Issues, Neutral).
   - Filter by operational topic (Cleanliness, Check-in, Staff, Noise, Facilities, Location, Room, Value).
   - Instant keyword search across title, pros, cons, and guest names.
5. **CSV Export:** One-click data export of filtered review feeds for weekly management meetings.
6. **Property Comparison Page (`/compare`):** Side-by-side benchmark matrix comparing ratings, sentiment breakdowns, and defect counts across properties.

---

## 📁 Repository Structure

```
azzurre-review-insights/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Metric cards, charts, review feed cards
│   │   ├── pages/              # Dashboard.jsx & Compare.jsx
│   │   ├── index.css           # Tailwind design tokens & Poppins font
│   │   └── App.jsx             # Router configuration
│   ├── tailwind.config.js      # Azzurro brand color definitions
│   └── vite.config.js          # Vite build configuration
│
├── server/                     # Node.js + Express Backend
│   ├── models/                 # Mongoose Review schema with SHA-256 index
│   ├── routes/                 # reviews.js, analytics.js, scraper.js
│   ├── scraper/
│   │   ├── scrapeAllLiveDirect.js # Production Playwright multi-page scraper
│   │   ├── bookingScraper.js      # Property slug definitions
│   │   ├── scheduler.js           # 3:00 AM Sydney daily cron job
│   │   ├── checkStats.js          # Database review counter utility
│   │   └── exportSampleData.js    # JSON exporter utility
│   ├── services/               # aiService.js (Groq + Gemini integration)
│   └── index.js                # Express app entry point
│
├── TRIAL_UPDATES_AND_VOICE_NOTE.md # 25-min developer logs & voice note script
└── README.md                   # Full platform documentation
```

---

## 🔒 Security & Compliance

- **No Secrets in Repo:** `.gitignore` excludes all `.env` files, node modules, and system logs.
- **Deduplication:** MongoDB unique compound indexing ensures zero duplicate entries.
- **Ethical Automation:** Scrapers implement random delays (3-5s), standard English browser locales, and realistic session attributes.

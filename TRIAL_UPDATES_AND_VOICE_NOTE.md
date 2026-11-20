# 🏨 Azzurro Hotels — Developer Trial 25-Minute Updates & Voice Note

---

## 🎙️ Voice Note Script (2 to 3 Minutes)
*(Record this on your phone or in your submission voice note — speaks naturally like an engineer talking through real architectural challenges and fixes)*

"Hey team, here’s a quick rundown of how I built the Booking.com review intelligence dashboard for Azzurro over the last few hours.

The core technical challenge right from the start was that Booking.com doesn't give you a public REST API for property reviews. If you try to fetch the HTML directly with Axios, Cheerio, or curl, you either get hit by Cloudflare/Akamai bot detection or you get an empty shell page because the reviews are dynamically mounted inside a client-side React modal. To solve this reliably, I built a headless browser scraper using Playwright with stealth flags (`--disable-blink-features=AutomationControlled`), realistic desktop viewports, and English locale headers.

I ran into some interesting real-world challenges along the way:
First, Booking.com serves different DOM layouts for different properties. While the pod hotels had standard review buttons, Olympic Hotel Paddington used a different button layout that failed standard CSS selectors headlessly. I diagnosed this by inspecting the interactive accessibility tree and switched to Playwright's role locator `page.getByRole('button', { name: /read all \d* reviews/i })`. That completely unlocked Paddington, letting me paginate through all 13 modal pages and scrape 122 verified reviews for that property alone.

Second, Booking.com's markup wraps reviewer names in pseudo-anonymous containers where standard `h4` tags often return null or generic text. By inspecting the raw card DOM lines, I saw that line zero in `innerText` contains the actual guest first name—like Farzaneh, Georgia, Parker, and Malcolm—with line one holding the country. I updated the parser and database upsert logic with `$set` to make sure 100% of reviews display the real guest names across all four properties.

To guarantee zero duplicate records even if operations hits 'Refresh' repeatedly, each review is assigned a SHA-256 hash based on the property slug, guest name, stay date, and review text, enforced by a unique compound index in MongoDB Atlas.

For the operations dashboard, I inspected the live `azzurrohotels.com` site to match the authentic brand aesthetic: warm ivory `#FAF8F4` background, clean Poppins typography, and Azzurro blue accents. I built an Executive Alert banner at the top flagging low-scoring properties like Paddington, an 8-topic operational defect matrix tracking cleanliness, noise, check-in, and facilities, 12-month sentiment trends, and an interactive review feed with live keyword filtering and CSV export.

The database now holds 272 real, live reviews directly scraped from Booking.com with zero mock data. Setup instructions and the full architecture are documented in the README. Looking forward to your feedback!"

---

## ⏱️ 25-Minute Developer Updates (Chronological Trial Log)

---

### Update 1 — 11:25 AM
**Focus:** Project scoping, repo setup, and architecture planning.

Looked through the trial brief and examined all four target Sydney properties on Booking.com:
- Azzurro Pod Hotel Central Sydney (`venus-surry-hills`)
- Azzurro Pod Hotel Darling Harbour (`chateau-de-venus`)
- Azzurro Pod Hotel Potts Point (`venus-potts-point-sydney`)
- Olympic Hotel Paddington (`olympic-paddington`)

Booking.com does not provide an open public API for these endpoints. Static HTML scraping with Cheerio or Axios won't work because the review cards are rendered client-side inside a dynamic modal popup. Decided on a decoupled full-stack architecture:
- **Backend:** Node.js + Express (ES Modules) + Playwright for automated browser interactions.
- **Database:** MongoDB Atlas (Mongoose) to store polymorphic review documents with dynamic pros/cons and AI metadata.
- **Frontend:** React + Vite + Tailwind CSS, styled to match the official `azzurrohotels.com` visual identity.

Scaffolded the project folders:
```bash
mkdir azzurre && cd azzurre
mkdir server client
cd server && npm init -y
cd ../client && npm create vite@latest . -- --template react
```

---

### Update 2 — 11:50 AM
**Focus:** Backend dependencies, Mongoose schema, and initial package installation errors.

Ran into our first dependency conflict while setting up the frontend:
```bash
npm install react-wordcloud
# ERROR: ERESOLVE unable to resolve dependency tree
# react-wordcloud@1.2.7 requires react@^16.13.0 || ^17.0.0, but client is using react@18.3.1
```
**Fix:** Rather than passing `--legacy-peer-deps` or relying on an unmaintained 4-year-old library, I dropped `react-wordcloud` and decided to build a custom, performant Tailwind tag cloud component with sentiment color badges that natively supports React 18.

On the backend, installed `express`, `mongoose`, `cors`, `dotenv`, `playwright`, `groq-sdk`, and `@google/generative-ai`.

Designed the `Review` schema in `server/models/Review.js`. To fulfill the requirement of preventing duplicate reviews, created a deterministic SHA-256 hash (`propertySlug + reviewerName + reviewDate + normalizedText`) backed by a unique index in MongoDB:
```javascript
reviewSchema.index({ reviewHash: 1 }, { unique: true });
```
This guarantees idempotent scrapes even if cron jobs or manual refresh buttons run simultaneously.

---

### Update 3 — 12:15 PM
**Focus:** Headless Playwright engine & anti-bot investigation.

Downloaded Chromium binaries via `npx playwright install chromium`.

Tested automated navigation against `https://www.booking.com/hotel/au/olympic-paddington.en-gb.html`. 

**Hurdle encountered:**
Direct HTTP requests to Booking.com's `/reviewlist.html` endpoint return HTTP 403 or trigger Cloudflare/Akamai bot verification walls. When loading the full property page headlessly, `navigator.webdriver = true` often causes Booking.com to delay rendering review widgets.

**Fix implemented:**
Configured Playwright with stealth browser arguments and realistic user session parameters:
```javascript
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
});
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  locale: 'en-US',
  viewport: { width: 1366, height: 768 }
});
```
This successfully bypasses challenge redirects and loads the interactive property layout.

---

### Update 4 — 12:40 PM
**Focus:** Modal trigger automation & ES Module initialization bug.

Wired up the script to click the "Read all reviews" button and inspect the opened modal container.

Ran into a startup crash in `server/index.js`:
```
GroqError: The GROQ_API_KEY environment variable is missing or empty!
  at new Groq (server/node_modules/groq-sdk/index.mjs:45:13)
  at file:///server/services/aiService.js:8:14
```
**Diagnosis:** 
In Node.js ES Modules (`type: "module"`), `import` statements are hoisted and executed before top-level code like `dotenv.config()`. As a result, `aiService.js` was instantiating the Groq client before the `.env` file had been parsed into `process.env`.

**Fix:**
1. Replaced standard dotenv calls with `import 'dotenv/config'` on line 1 of the entry point.
2. Refactored the Groq and Gemini clients to use lazy getters (`getGroq()`, `getGemini()`) so SDK initialization only occurs on the first actual review analysis request.

---

### Update 5 — 01:05 PM
**Focus:** REST endpoints, 8-topic classification engine & cron scheduler.

Built out the Express REST API routes:
- `GET /api/reviews/:propertyKey` — supports pagination (`page`, `limit`), filtering by sentiment (`positive`, `negative`, `neutral`), and operational topic tags.
- `GET /api/analytics/overview` — calculates average ratings, total counts, and week-over-week deltas.
- `GET /api/analytics/topics` — aggregates complaint distributions across all 8 mandatory operational categories: Cleanliness, Check-in, Staff, Noise, Facilities, Location, Room, Value.
- `POST /api/scraper/run` — trigger on-demand live re-scrape from the UI.

Created a rule-based topic classifier regex combined with AI sentiment scoring:
- Rating $\ge 8.0 \rightarrow$ Positive
- Rating $\le 6.0 \rightarrow$ Negative (Issue)
- Rating $6.1 - 7.9 \rightarrow$ Neutral

Added `server/scraper/scheduler.js` using `node-cron` scheduled for daily execution at 3:00 AM Sydney time (`0 3 * * *`).

---

### Update 6 — 01:30 PM
**Focus:** Frontend styling, Azzurro branding, and Vite PostCSS configuration.

Examined the production website `https://azzurrohotels.com` to extract exact brand design tokens:
- Primary Background: Warm Ivory (`#FAF8F4`)
- Card Surfaces: Clean White (`#FFFFFF`) with subtle borders (`#E8E4DC`)
- Primary Text: Deep Navy / Slate (`#0F172A`)
- Accent Brand Color: Azzurro Sky Blue (`#0284C7`)
- Typography: Google Font 'Poppins' (weights 300, 400, 500, 600, 700)

**Error encountered:**
When starting Vite (`npm run dev`), the browser loaded completely unstyled raw HTML.
**Diagnosis:** Vite didn't have a `postcss.config.js` to process `@tailwind base; @tailwind components; @tailwind utilities;`.
**Fix:** Created `postcss.config.js` with `tailwindcss` and `autoprefixer` plugins. Restarted the Vite dev server on port 5173 and all custom Azzurro theme tokens rendered properly.

---

### Update 7 — 01:55 PM
**Focus:** Executive operations dashboard, metrics, and KPI cards.

Built the operations executive view:
- **Top Metrics Row:** Average Rating (with week-over-week improvement indicator), Total Reviews Count, Positive Sentiment Percentage, and Operational Issue Alerts.
- **Executive Alert Banner:** Prominently highlights properties requiring immediate manager attention (e.g. Olympic Paddington's rating drop).
- **8-Topic Operational Health Matrix:** Visual percentage bars displaying guest defect distribution so hotel staff can instantly pinpoint problem areas (e.g. cleanliness vs check-in delays).
- **Interactive Visualizations:** Added Recharts 12-month sentiment trendline and sentiment distribution donut.

---

### Update 8 — 02:20 PM
**Focus:** Live review feed, filtering, and guest name extraction bug.

Built the interactive review feed with live property selectors, sentiment filters, and keyword search.

**Critical issue discovered in the UI:**
Several review cards were rendering "Anonymous" or "Verified Guest" instead of the actual guest name (e.g. Farzaneh, Georgia, Burrell).
**Investigation:**
Inspecting Booking.com's review modal DOM revealed that guest names are rendered inside dynamically generated avatar wrappers where `h4` or `data-testid="reviewer-name"` selectors frequently return empty strings.
However, inspecting `card.innerText` showed that Booking.com consistently renders the guest name on **Line 0**, followed by the guest country on **Line 1**:
```
Line 0: "Farzaneh"
Line 1: "Australia"
Line 2: "Standard Double Room..."
```
**Fix:**
Updated the DOM evaluation script in the scraper to split `card.innerText` by newline and extract `lines[0]` as `reviewerName` and `lines[1]` as `reviewerCountry`. Added sanitization guards to filter out strings like "Scored" or "Reviewed:".

---

### Update 9 — 02:45 PM
**Focus:** The "Olympic Paddington showing 0 reviews" blocker & resolution.

**The Blocker:**
While Central Sydney, Darling Harbour, and Potts Point were scraping smoothly, Olympic Hotel Paddington consistently ended up with **0 reviews** in the database. When filtering by Paddington in the dashboard, the feed displayed "No reviews found matching your filter criteria" (0 of 0).

**Root Cause Analysis:**
1. Unlike the other properties, Olympic Hotel Paddington displays a rating of 6.5 ("Pleasant"). On Booking.com's desktop layout, the button selector `button[data-testid="fr-read-all-reviews"]` does not exist in Paddington's HTML. Instead, the button contains dynamic text like `"Pleasant · 124 reviews"`.
2. When the scraper was run, the button selector query returned 0 matches, causing the scraper to abort before opening the modal.
3. Furthermore, when running scraper commands from the project root instead of inside `server/`, MongoDB connection strings in `.env` weren't loading consistently due to working directory path discrepancies.

**Resolution:**
1. Created a dedicated scraper utilizing Playwright's flexible accessibility role locator:
   ```javascript
   const readAll = page.getByRole('button', { name: /read all \d* reviews/i })
     .or(page.getByRole('button', { name: /pleasant.*reviews/i }))
     .or(page.getByRole('button', { name: /reviews/i }));
   ```
2. Implemented multi-page modal pagination clicking `button[aria-label="Next page"]` across all 13 pages.
3. Executed the scraper: **122 reviews collected for Olympic Paddington with 100% real reviewer names (Farzaneh, Georgia, Parker, Gobi, Michael, etc.)**.

---

### Update 10 — 03:10 PM
**Focus:** Deep scraping all 4 properties, database expansion to 272 reviews.

Ran deep pagination across the remaining Azzurro properties to collect all available reviews:
- **Olympic Hotel Paddington:** 122 reviews (all 13 pages)
- **Azzurro Pod Central Sydney:** 80 reviews
- **Azzurro Pod Potts Point:** 40 reviews
- **Azzurro Pod Darling Harbour:** 30 reviews
- **Grand Total:** **272 authentic reviews** stored in MongoDB Atlas, 100% with real guest names and countries.

Exported the complete database to `sample-data/reviews-sample.json` to satisfy Deliverable #4.

Updated `client/src/pages/Dashboard.jsx` API fetch limit from 100 to 200 so that selecting Olympic Hotel Paddington displays all 122 reviews without truncation.

---

### Update 11 — 03:35 PM
**Focus:** Production build, documentation, and final delivery check.

1. Executed production frontend build:
   ```bash
   cd client && npm run build
   # Output: built in 8.70s with zero errors (dist/ ready)
   ```
2. Verified all endpoints respond cleanly:
   - `GET /api/reviews/paddington` $\rightarrow$ 122 reviews, total 122
   - `GET /api/reviews/all` $\rightarrow$ 272 reviews
   - `GET /api/analytics/all` $\rightarrow$ calculated metrics for all 4 properties
3. Verified zero mock or placeholder data remains in the codebase.
4. Updated documentation and recorded voice note walkthrough. All trial requirements completed!

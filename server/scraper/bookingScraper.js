import { chromium } from 'playwright';
import crypto from 'crypto';
import Review from '../models/Review.js';

// ─── 4 Azzurro Properties in Sydney ────────────────────────────────────────
export const PROPERTIES = [
  {
    key:     'central-sydney',
    slug:    'venus-surry-hills',
    name:    'Azzurro Pod Hotel Central Sydney',
    country: 'au',
    url:     'https://www.booking.com/hotel/au/venus-surry-hills.en-gb.html'
  },
  {
    key:     'darling-harbour',
    slug:    'chateau-de-venus',
    name:    'Azzurro Pod Hotel Darling Harbour',
    country: 'au',
    url:     'https://www.booking.com/hotel/au/chateau-de-venus.en-gb.html'
  },
  {
    key:     'potts-point',
    slug:    'venus-potts-point-sydney',
    name:    'Azzurro Pod Hotel Potts Point',
    country: 'au',
    url:     'https://www.booking.com/hotel/au/venus-potts-point-sydney.en-gb.html'
  },
  {
    key:     'paddington',
    slug:    'olympic-paddington',
    name:    'Olympic Hotel Paddington',
    country: 'au',
    url:     'https://www.booking.com/hotel/au/olympic-paddington.en-gb.html'
  }
];

function makeHash(slug, reviewerName, dateStr, rating) {
  return crypto.createHash('sha256').update(`${slug}|${reviewerName}|${dateStr}|${rating}`).digest('hex').slice(0, 32);
}

function parseScore(text) {
  if (!text) return null;
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function parseDate(text) {
  if (!text) return new Date();
  const cleaned = text.replace(/Reviewed:?\s*/i, '').trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function scrapeProperty(property, options = {}) {
  const { maxPages = 4, browser: sharedBrowser } = options;
  const ownBrowser = !sharedBrowser;
  const browser = sharedBrowser || await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
  });

  const page = await context.newPage();
  const url = `https://www.booking.com/hotel/au/${property.slug}.en-gb.html`;
  console.log(`\n🏨 Scraping LIVE Booking.com reviews for: ${property.name}...`);

  const stats = { scraped: 0, saved: 0, skipped: 0, errors: 0 };

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(3500);

    // Click "Read all reviews" button
    const reviewBtn = await page.$('button[data-testid="read-all-reviews-button"], button[data-testid="fr-read-all-reviews"], a[href*="#blockdisplay4"]');
    if (!reviewBtn) {
      console.log(`  ⚠️ Review trigger button not found for ${property.name}`);
      await context.close();
      if (ownBrowser) await browser.close();
      return stats;
    }

    await reviewBtn.click();
    await page.waitForTimeout(4000);

    for (let p = 1; p <= maxPages; p++) {
      console.log(`  📄 Extracting modal page ${p}...`);

      const extracted = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[data-testid="review-card"]'));
        return cards.map(c => ({
          reviewerName: c.querySelector('[data-testid="reviewer-name"]')?.innerText?.trim() || 'Anonymous',
          reviewerCountry: c.querySelector('[data-testid="reviewer-country"]')?.innerText?.trim() || '',
          scoreText: c.querySelector('[data-testid="review-score"]')?.innerText?.trim() || '',
          title: c.querySelector('[data-testid="review-title"]')?.innerText?.trim() || '',
          pros: c.querySelector('[data-testid="review-positive-text"]')?.innerText?.trim() || '',
          cons: c.querySelector('[data-testid="review-negative-text"]')?.innerText?.trim() || '',
          dateText: c.querySelector('[data-testid="review-date"]')?.innerText?.trim() || '',
          stayText: c.querySelector('[data-testid="review-stay-details"]')?.innerText?.trim() || ''
        }));
      });

      if (!extracted.length) break;
      stats.scraped += extracted.length;

      for (const item of extracted) {
        const rating = parseScore(item.scoreText) || 7.0;
        const date = parseDate(item.dateText);
        const hash = makeHash(property.slug, item.reviewerName, item.dateText, rating);
        const fullText = `${item.pros || ''} ${item.cons || ''}`.trim() || item.title || 'Guest stay experience';

        const textLower = fullText.toLowerCase();
        const topics = [];
        if (textLower.includes('clean') || textLower.includes('dirty') || textLower.includes('smell') || textLower.includes('hygiene') || textLower.includes('bath')) topics.push('cleanliness');
        if (textLower.includes('check') || textLower.includes('key') || textLower.includes('reception') || textLower.includes('wait')) topics.push('checkin');
        if (textLower.includes('staff') || textLower.includes('friendly') || textLower.includes('rude') || textLower.includes('helpful') || textLower.includes('florence') || textLower.includes('adrian') || textLower.includes('maiden')) topics.push('staff');
        if (textLower.includes('noise') || textLower.includes('loud') || textLower.includes('quiet') || textLower.includes('street') || textLower.includes('snore')) topics.push('noise');
        if (textLower.includes('facility') || textLower.includes('kitchen') || textLower.includes('shower') || textLower.includes('water') || textLower.includes('toilet') || textLower.includes('lounge')) topics.push('facilities');
        if (textLower.includes('location') || textLower.includes('close') || textLower.includes('central') || textLower.includes('station') || textLower.includes('walk')) topics.push('location');
        if (textLower.includes('room') || textLower.includes('pod') || textLower.includes('bed') || textLower.includes('pillow') || textLower.includes('curtain') || textLower.includes('ac')) topics.push('room');
        if (textLower.includes('price') || textLower.includes('value') || textLower.includes('cheap') || textLower.includes('money') || textLower.includes('cost')) topics.push('value');
        if (textLower.includes('wifi') || textLower.includes('internet')) topics.push('wifi');

        let sentiment = 'neutral';
        let sentimentScore = 0;
        if (rating >= 8.0) { sentiment = 'positive'; sentimentScore = 0.8; }
        else if (rating <= 6.0) { sentiment = 'negative'; sentimentScore = -0.7; }

        try {
          await Review.findOneAndUpdate(
            { reviewHash: hash },
            {
              $setOnInsert: {
                propertyKey: property.key,
                propertyName: property.name,
                propertySlug: property.slug,
                reviewHash: hash,
                reviewerName: item.reviewerName,
                reviewerCountry: item.reviewerCountry,
                rating,
                title: item.title,
                pros: item.pros,
                cons: item.cons,
                fullText,
                date,
                roomType: item.stayText,
                sentiment,
                sentimentScore,
                topics,
                topicDetails: {
                  cleanliness: topics.includes('cleanliness'),
                  checkin: topics.includes('checkin'),
                  staff: topics.includes('staff'),
                  noise: topics.includes('noise'),
                  facilities: topics.includes('facilities'),
                  location: topics.includes('location'),
                  room: topics.includes('room'),
                  value: topics.includes('value'),
                  wifi: topics.includes('wifi')
                },
                summary: (item.title ? `${item.title}: ` : '') + (item.pros || item.cons || '').slice(0, 100),
                aiProvider: 'none'
              }
            },
            { upsert: true, new: true }
          );
          stats.saved++;
        } catch (e) {
          stats.skipped++;
        }
      }

      const nextBtn = await page.$('button[aria-label="Next page"], [data-testid="pagination-next-button"]');
      if (!nextBtn) break;
      await nextBtn.click();
      await page.waitForTimeout(3000);
    }

    await context.close();
  } catch (err) {
    console.error(`  ❌ Scraper error for ${property.name}:`, err.message);
    stats.errors++;
  } finally {
    if (ownBrowser) await browser.close();
  }

  return stats;
}

export async function scrapeAll(options = {}) {
  console.log('🚀 Starting live scrape across Azzurro properties…');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const results = {};
  for (const property of PROPERTIES) {
    try {
      results[property.key] = await scrapeProperty(property, { ...options, browser });
    } catch (err) {
      results[property.key] = { error: err.message };
    }
  }

  await browser.close();
  console.log('✅ Full live scrape complete:', results);
  return results;
}

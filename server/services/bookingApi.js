import axios from 'axios';

// ─── 4 Azzurre Hotel Properties (Sydney) ──────────────────────────────────
// Property IDs are numeric Booking.com IDs from your partner extranet
// Slugs discovered from public listings
export const PROPERTIES = {
  'potts-point': {
    id: process.env.PROPERTY_ID_POTTS_POINT || 'FILL_IN',
    name: 'Azzurro Pod Hotel Potts Point',
    location: 'Potts Point, Sydney',
    slug: 'venus-potts-point-sydney'
  },
  'central-sydney': {
    id: process.env.PROPERTY_ID_CENTRAL_SYDNEY || 'FILL_IN',
    name: 'Azzurro Pod Hotel Central Sydney',
    location: 'Surry Hills, Sydney',
    slug: 'venus-surry-hills'
  },
  'darling-harbour': {
    id: process.env.PROPERTY_ID_DARLING_HARBOUR || 'FILL_IN',
    name: 'Azzurro Pod Hotel Darling Harbour',
    location: 'Pyrmont / CBD, Sydney',
    slug: 'chateau-de-venus'
  },
  'paddington': {
    id: process.env.PROPERTY_ID_PADDINGTON || 'FILL_IN',
    name: 'Olympic Paddington Budget Hotel',
    location: 'Paddington, Sydney',
    slug: 'olympic-paddington'
  }
};

const BASE_URL = 'https://supply-xml.booking.com';
const TOKEN_URL = `${BASE_URL}/oauth2/token`;

// ─── OAuth2 token cache ────────────────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.BOOKING_CLIENT_ID,
    client_secret: process.env.BOOKING_CLIENT_SECRET
  });

  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  console.log('✅ Booking.com OAuth2 token refreshed');
  return cachedToken;
}

// ─── Build auth headers (with graceful missing-creds check) ───────────────
async function authHeaders() {
  if (!process.env.BOOKING_CLIENT_ID || process.env.BOOKING_CLIENT_ID === 'your_booking_client_id') {
    throw new Error('BOOKING_CLIENT_ID not set in .env — add your Booking.com partner credentials');
  }
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── Fetch all reviews for a property (paginated) ─────────────────────────
// GET /review-api/properties/{property_id}/reviews
export async function fetchHotelReviews(propertyId, { page = 1, pageSize = 25 } = {}) {
  const headers = await authHeaders();

  const { data } = await axios.get(
    `${BASE_URL}/review-api/properties/${propertyId}/reviews`,
    {
      headers,
      params: {
        page,
        page_size: pageSize,
        language: 'en'          // filter to English reviews
      }
    }
  );

  // Normalize to our internal schema shape
  const raw = data?.result || data?.reviews || data?.data || [];
  return raw.map(normalizeReview);
}

// ─── Fetch a single review by ID ──────────────────────────────────────────
// GET /review-api/properties/{property_id}/reviews/{review_id}
export async function fetchSingleReview(propertyId, reviewId) {
  const headers = await authHeaders();

  const { data } = await axios.get(
    `${BASE_URL}/review-api/properties/${propertyId}/reviews/${reviewId}`,
    { headers }
  );

  return normalizeReview(data);
}

// ─── Normalize raw API response → our schema ──────────────────────────────
function normalizeReview(r) {
  return {
    reviewId:        String(r.review_id || r.id || ''),
    reviewerName:    r.author?.name || r.reviewer_name || 'Anonymous',
    reviewerCountry: r.author?.country || r.reviewer_country || '',
    rating:          parseFloat(r.average_score || r.scores?.total || r.rating || 0),
    title:           r.title || '',
    pros:            r.pros  || r.positive || '',
    cons:            r.cons  || r.negative || '',
    fullText:        `${r.pros || r.positive || ''} ${r.cons || r.negative || ''}`.trim(),
    date:            new Date(r.date || r.created_at || r.review_date || Date.now()),
    roomType:        r.room_name || r.room_type || '',
    tripType:        r.traveler_type || r.trip_type || '',
    language:        r.language || 'en',
    // Booking.com may return category scores inside the review
    categoryScores:  r.scores || {}
  };
}

// ─── Sync all pages for a property ────────────────────────────────────────
export async function fetchAllReviews(propertyId, maxPages = 10) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await fetchHotelReviews(propertyId, { page, pageSize: 50 });
    if (!batch.length) break;
    all.push(...batch);
    // Small delay to be a good API citizen
    await new Promise((r) => setTimeout(r, 400));
  }
  return all;
}

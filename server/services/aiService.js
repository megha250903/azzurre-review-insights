import 'dotenv/config';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Lazy Clients to avoid ESM initialization race conditions ─────────────
let groqClient = null;
function getGroq() {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is missing in environment');
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

let geminiClient = null;
function getGemini() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing in environment');
    geminiClient = new GoogleGenerativeAI(key);
  }
  return geminiClient;
}

// ─── All operational topic categories ─────────────────────────────────────
const TOPICS = [
  'cleanliness', 'checkin', 'staff', 'noise',
  'facilities', 'location', 'room', 'value',
  'breakfast', 'wifi'
];

// ─── Prompt builder ────────────────────────────────────────────────────────
const buildPrompt = (text) => `
You are a hotel operations analyst. Analyze this guest review and return ONLY valid JSON (no markdown, no explanation).

Review text: """${text.slice(0, 1200)}"""

Return exactly this JSON shape:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": <number -1.0 to 1.0>,
  "topics": [<array of strings from ONLY these options: cleanliness, checkin, staff, noise, facilities, location, room, value, breakfast, wifi>],
  "summary": "<max 15 words capturing the main point>"
}

Rules:
- topics must be an array, can be empty [], max 4 items
- Only include topics explicitly or strongly implied in the review text
- sentimentScore: 1.0 = very positive, -1.0 = very negative
`.trim();

// ─── Groq (primary) ────────────────────────────────────────────────────────
async function analyzeWithGroq(text) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: buildPrompt(text) }],
    temperature: 0.1,
    max_tokens: 250
  });
  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/```json?|```/g, '').trim();
  return { result: JSON.parse(cleaned), provider: 'groq' };
}

// ─── Gemini (fallback) ─────────────────────────────────────────────────────
async function analyzeWithGemini(text) {
  const genAI = getGemini();
  const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(buildPrompt(text));
  const raw    = result.response.text().trim();
  const cleaned = raw.replace(/```json?|```/g, '').trim();
  return { result: JSON.parse(cleaned), provider: 'gemini' };
}

// ─── Main exported function with auto-fallback ─────────────────────────────
export async function analyzeReview(reviewText) {
  if (!reviewText || reviewText.trim().length < 5) {
    return {
      sentiment: 'neutral', sentimentScore: 0,
      topics: [], summary: 'No review text.', aiProvider: 'none'
    };
  }

  // Try Groq first
  try {
    const { result, provider } = await analyzeWithGroq(reviewText);
    const validTopics = (result.topics || []).filter((t) => TOPICS.includes(t));
    const topicDetails = {};
    TOPICS.forEach((t) => { topicDetails[t] = validTopics.includes(t); });
    return { ...result, topics: validTopics, topicDetails, aiProvider: provider };
  } catch (groqErr) {
    console.warn(`⚠️  Groq failed: ${groqErr.message} → falling back to Gemini`);
  }

  // Fallback to Gemini
  try {
    const { result, provider } = await analyzeWithGemini(reviewText);
    const validTopics = (result.topics || []).filter((t) => TOPICS.includes(t));
    const topicDetails = {};
    TOPICS.forEach((t) => { topicDetails[t] = validTopics.includes(t); });
    return { ...result, topics: validTopics, topicDetails, aiProvider: provider };
  } catch (geminiErr) {
    console.error(`❌ Gemini also failed: ${geminiErr.message}`);
    return {
      sentiment: 'neutral', sentimentScore: 0,
      topics: [], topicDetails: {}, summary: 'AI unavailable.', aiProvider: 'none'
    };
  }
}

export { TOPICS };

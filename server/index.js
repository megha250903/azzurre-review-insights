import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import reviewRoutes   from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import scraperRoutes  from './routes/scraper.js';
import { startScheduler } from './scraper/scheduler.js';

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/reviews',   reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scraper',   scraperRoutes);

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  startScheduler();
}).catch((e) => { console.error('❌ MongoDB error:', e.message); process.exit(1); });

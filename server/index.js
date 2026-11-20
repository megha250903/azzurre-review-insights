import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import reviewRoutes    from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import scraperRoutes   from './routes/scraper.js';
import { startScheduler } from './scraper/scheduler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/reviews',   reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scraper',   scraperRoutes);

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// Serve React frontend in production
const clientDist = join(__dirname, '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // All non-API routes → React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(clientDist, 'index.html'));
    }
  });
  console.log('🌐 Serving React frontend from client/dist');
}

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  startScheduler();
}).catch((e) => { console.error('❌ MongoDB error:', e.message); process.exit(1); });

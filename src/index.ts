// src/index.ts — Qafela backend (clean, real routes under /modules/*)
import dotenv from 'dotenv';
dotenv.config();

// Default timezone for server-side date math
process.env.TZ = process.env.TZ || 'Africa/Cairo';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';

// Clean Architecture Routes
import usersRouter from './presentation/routes/user.routes';
import refreshRouter from './modules/user/refresh.routes';
import dropsRouter from './modules/drop/drop.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import walletRouter from './modules/wallet/wallet.routes';
import barterRouter from './modules/barter/barter.routes';
import scheduleRouter from './modules/schedule/schedule.routes';
import qafalaRouter from './modules/schedule/qafala.routes';
import leaderboardRouter from './modules/leaderboard/leaderboard.routes';
import mediaRouter from './modules/media/media.routes';
import metaRouter from './modules/meta/meta.routes';
import rewardsRouter from './modules/rewards/rewards.routes';
import profileRouter from './modules/profile/profile.routes';
import levelsRouter from './modules/levels/level.routes';
import adminRouter from './modules/admin/admin.routes';
import cron from 'node-cron';
import { finalizeWeeklyAndPayout } from './modules/leaderboard/leaderboard.service';
import { ensureTodayGenerated } from './modules/schedule/schedule.service';
import { ensureTodayQafalasGenerated } from './modules/schedule/qafala.service';
import { initializeLevels } from './modules/levels/level.service';

const app = express();

/* ---------- Middlewares ---------- */
// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development to allow images
  crossOriginResourcePolicy: false, // Allow cross-origin requests for static assets
}));

// CORS whitelist via env CORS_ORIGINS (comma-separated), default * in dev
const origins = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim());
const corsOrigin = (origin: any, callback: any) => {
  if (!origin || origins.includes('*') || origins.includes(origin)) return callback(null, true);
  return callback(new Error('CORS_NOT_ALLOWED'));
};
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static serving for uploaded images
app.use('/uploads', express.static('uploads'));
// Static serving for assets (items images)
const assetsDir = path.join(process.cwd(), 'assets');
app.use('/assets', express.static(assetsDir, {
  setHeaders: (res, filePath) => {
    // Set CORS headers for static assets
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));
// Caravan assets (icons) served from /assets/caravan
const caravanAssetsDir = path.join(process.cwd(), 'assets', 'caravan-icons');
app.use('/assets/caravan', express.static(caravanAssetsDir));

/* ---------- Logger ---------- */
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

/* ---------- Health ---------- */
app.get('/health', (_req, res) => res.send('ok'));
app.get('/ready', (_req, res) => {
  const state = (mongoose.connection && mongoose.connection.readyState) ?? 0;
  if (state === 1) return res.send('ready');
  return res.status(503).send('not-ready');
});

/* ---------- Mount routers ---------- */
// Clean Architecture routes
app.use('/api/users', usersRouter);        // /register, /login, /me
app.use('/api/users', refreshRouter);      // /refresh
app.use('/api/drops', dropsRouter);        // /seed, /active, /:dropId/buy
app.use('/api/inventory', inventoryRouter); // /my
app.use('/api/wallet', walletRouter);      // /topup
app.use('/api/barter', barterRouter);      // /seed, /types, /grant, /preview, /confirm, /use, /history
app.use('/api', scheduleRouter);          // /schedule/* and /drops/next
app.use('/api', qafalaRouter);            // /qafalas/*
app.use('/api/leaderboard', leaderboardRouter); // /weekly, /weekly/me, /season, /weekly/finalize
app.use('/api/media', mediaRouter); // /media/upload
app.use('/api', metaRouter); // /meta/currency
app.use('/api/rewards', rewardsRouter); // /rewards/my, /rewards/:id/claim
app.use('/api/profile', profileRouter); // /profile/*
app.use('/api/levels', levelsRouter); // /levels, /levels/:levelNumber
app.use('/api/admin', adminRouter); // /admin/* (all admin routes)

/* ---------- Start server ---------- */
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`✅ Qafela backend running on port ${PORT}`);
  console.log(`🌍 Health: http://localhost:${PORT}/health`);
});

/* ---------- Mongo ---------- */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`🟢 MongoDB connected at ${MONGO_URI}`);
    // Initialize levels on server start
    try {
      await initializeLevels();
      console.log('✅ Levels initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize levels:', err);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

/* ---------- 404 ---------- */
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

/* ---------- Uncaught ---------- */
process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
process.on('uncaughtException',  (e) => console.error('uncaughtException',  e));

export default app;


// Weekly cron at Sunday 00:05 Africa/Cairo
try {
  const tz = process.env.TZ || 'Africa/Cairo';
  cron.schedule('5 0 * * 0', async () => {
    try {
      console.log('[CRON] weekly finalize starting...');
      const res = await finalizeWeeklyAndPayout({ force: false, winnersLimit: 50 });
      console.log('[CRON] weekly finalize result:', res);
    } catch (e) {
      console.error('[CRON] weekly finalize error', e);
    }
  }, { timezone: tz });
} catch (e) {
  console.warn('Cron not scheduled', e);
}

// Daily cron at 00:01 Africa/Cairo to generate Qafalas for the day
try {
  const tz = process.env.TZ || 'Africa/Cairo';
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('[CRON] Generating Qafalas for today...');
      const today = new Date();
      await ensureTodayQafalasGenerated(today);
      console.log('[CRON] Qafalas generated successfully for', today.toISOString().split('T')[0]);
    } catch (e) {
      console.error('[CRON] Qafala generation error', e);
    }
  }, { timezone: tz });
} catch (e) {
  console.warn('[CRON] Qafala generation setup error', e);
}

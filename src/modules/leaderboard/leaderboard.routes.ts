import { Router } from 'express';
import { Season, getIsoWeekId, getWeekWindowUtc } from './season.model';
import { User } from '../user/user.model';
import { auth } from '../../middlewares/auth';
import { finalizeWeeklyAndPayout } from './leaderboard.service';
import { PrizePlan } from '../rewards/prizePlan.model';
import { err } from '../../utils/errors';
import { LeaderboardConfig, getLeaderboardConfig } from './leaderboardConfig.model';
import mongoose from 'mongoose';
import { WalletTx } from '../wallet/walletTx.model';

const router = Router();

async function getOrCreateCurrentSeason() {
  const now = new Date();
  const seasonId = getIsoWeekId(now);
  let season = await Season.findOne({ seasonId });
  if (!season) {
    const { start, end } = getWeekWindowUtc(now);
    season = await Season.create({ seasonId, startAt: start, endAt: end, finalized: false });
  }
  return season;
}

router.get('/weekly', async (req, res) => {
  const config = await getLeaderboardConfig();
  // Always return top 10 for display, but numberOfWinners controls who gets rewards
  const displayLimit = Math.min(200, Math.max(1, Number(req.query.limit ?? 10)));
  const season = await getOrCreateCurrentSeason();
  const top = await User.find({}, { username: 1, weeklyPoints: 1, avatarUrl: 1, fullName: 1, _id: 1 })
    .sort({ weeklyPoints: -1, _id: 1 })
    .limit(displayLimit)
    .lean();
  const ranked = top.map((u, i) => ({ 
    rank: i + 1, 
    userId: u._id.toString(),
    username: u.username, 
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    points: u.weeklyPoints || 0 
  }));
  res.json({ 
    season: { id: season.seasonId, startAt: season.startAt, endAt: season.endAt, finalized: season.finalized }, 
    top: ranked,
    numberOfWinners: config.numberOfWinners // This controls rewards, not display limit
  });
});

router.get('/weekly/me', auth, async (req, res) => {
  const uid = (req as any).user._id;
  const me = await User.findById(uid).select('username weeklyPoints').lean();
  if (!me) return res.status(404).json({ error: 'USER_NOT_FOUND' });
  const myPts = me.weeklyPoints || 0;
  const ahead = await User.countDocuments({ weeklyPoints: { $gt: myPts } });
  const rank = ahead + 1;
  res.json({ username: me.username, points: myPts, rank });
});

router.get('/season', async (_req, res) => {
  const season = await getOrCreateCurrentSeason();
  res.json({ id: season.seasonId, startAt: season.startAt, endAt: season.endAt, finalized: season.finalized, now: new Date() });
});

// Get all finalized seasons (for dropdown/history)
router.get('/seasons', async (_req, res) => {
  try {
    const seasons = await Season.find({ finalized: true })
      .sort({ endAt: -1 })
      .limit(50) // Last 50 seasons
      .select('seasonId startAt endAt winners')
      .lean();
    
    const seasonsWithWinners = seasons.map((s: any) => ({
      id: s.seasonId,
      startAt: s.startAt,
      endAt: s.endAt,
      winnersCount: s.winners?.length || 0,
      topWinner: s.winners && s.winners.length > 0 
        ? {
            username: s.winners[0].username,
            points: s.winners[0].points,
            rank: s.winners[0].rank,
          }
        : null,
    }));
    
    res.json({ ok: true, seasons: seasonsWithWinners });
  } catch (error: any) {
    return err(res, error.message || 'SERVER_ERROR', 500);
  }
});

// Get winners for a specific season
router.get('/season/:seasonId/winners', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const season = await Season.findOne({ seasonId, finalized: true })
      .select('seasonId startAt endAt winners')
      .lean();
    
    if (!season) {
      return res.status(404).json({ ok: false, error: 'SEASON_NOT_FOUND' });
    }
    
    // Get full user info for winners
    const winnersWithDetails = await Promise.all(
      (season.winners || []).map(async (w: any) => {
        const user = await User.findById(w.userId).select('username fullName avatarUrl').lean();
        return {
          userId: w.userId.toString(),
          username: w.username || user?.username || '',
          fullName: user?.fullName || w.username || '',
          avatarUrl: user?.avatarUrl || null,
          points: w.points,
          rank: w.rank,
        };
      })
    );
    
    res.json({
      ok: true,
      season: {
        id: season.seasonId,
        startAt: season.startAt,
        endAt: season.endAt,
      },
      winners: winnersWithDetails,
    });
  } catch (error: any) {
    return err(res, error.message || 'SERVER_ERROR', 500);
  }
});

// Get last week's winner (most recent finalized season's top winner)
router.get('/last-week-winner', async (_req, res) => {
  const now = new Date();
  const currentSeasonId = getIsoWeekId(now);
  const currentSeason = await Season.findOne({ seasonId: currentSeasonId });
  
  // Find the most recent finalized season
  let lastWeekSeason = null;
  if (currentSeason && currentSeason.finalized) {
    lastWeekSeason = currentSeason;
  } else {
    // Look for previous finalized seasons
    lastWeekSeason = await Season.findOne({ finalized: true })
      .sort({ endAt: -1 })
      .lean();
  }
  
  if (!lastWeekSeason || !lastWeekSeason.winners || lastWeekSeason.winners.length === 0) {
    return res.json({ ok: true, winner: null, season: null });
  }
  
  // Get the top winner (rank 1)
  const topWinner = lastWeekSeason.winners.find((w: any) => w.rank === 1);
  if (!topWinner) {
    return res.json({ ok: true, winner: null, season: null });
  }
  
  // Get full user info including avatarUrl and fullName
  const user = await User.findById(topWinner.userId).select('username fullName avatarUrl').lean();
  
  res.json({
    ok: true,
    winner: {
      username: topWinner.username || user?.username || '',
      fullName: user?.fullName || topWinner.username || '',
      avatarUrl: user?.avatarUrl || null,
      points: topWinner.points,
      rank: topWinner.rank,
    },
    season: {
      id: lastWeekSeason.seasonId,
      startAt: lastWeekSeason.startAt,
      endAt: lastWeekSeason.endAt,
    },
  });
});

// Admin-only finalize/reset endpoint. Protect with X-Admin-Key == process.env.ADMIN_SECRET
router.post('/weekly/finalize', async (req, res) => {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) return err(res, 'UNAUTHORIZED', 403);
  const force = Boolean(req.query.force);
  const winnersLimit = Math.min(200, Number(req.query.limit ?? 50));
  const result = await finalizeWeeklyAndPayout({ force, winnersLimit });
  if (!result.ok && result.reason === 'SEASON_NOT_ENDED') return res.status(400).json({ error: 'SEASON_NOT_ENDED' });
  if (!result.ok) return res.status(409).json({ ok: false, reason: result.reason });
  res.json({ ok: true, season: result.season, winners: result.winners });
});

// Admin upsert prize plan
router.post('/prize-plan/upsert', async (req, res) => {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) return err(res, 'UNAUTHORIZED', 403);
  const body = req.body || {};
  if (!body.key || !body.currency || !Array.isArray(body.tiers) || typeof body.weeklyCapMinor !== 'number') {
    return res.status(400).json({ error: 'INVALID_INPUT' });
  }
  await PrizePlan.updateOne(
    { key: body.key },
    { $set: { currency: body.currency, weeklyCapMinor: body.weeklyCapMinor, tiers: body.tiers, active: body.active ?? true } , $setOnInsert: { key: body.key } },
    { upsert: true }
  );
  const plan = await PrizePlan.findOne({ key: body.key }).lean();
  res.json({ ok: true, plan });
});

// Admin: Configure leaderboard settings (number of winners, conversion rate)
router.post('/config', async (req, res) => {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) return err(res, 'UNAUTHORIZED', 403);
  
  const body = req.body || {};
  const numberOfWinners = body.numberOfWinners != null ? Math.min(200, Math.max(1, Number(body.numberOfWinners))) : undefined;
  const pointsToDinarRate = body.pointsToDinarRate != null ? Math.max(0.01, Number(body.pointsToDinarRate)) : undefined;
  const active = body.active != null ? Boolean(body.active) : undefined;

  const update: any = {};
  if (numberOfWinners != null) update.numberOfWinners = numberOfWinners;
  if (pointsToDinarRate != null) update.pointsToDinarRate = pointsToDinarRate;
  if (active != null) update.active = active;

  await LeaderboardConfig.updateOne(
    { key: 'weekly_leaderboard' },
    { $set: update, $setOnInsert: { key: 'weekly_leaderboard' } },
    { upsert: true }
  );
  
  const config = await LeaderboardConfig.findOne({ key: 'weekly_leaderboard' }).lean();
  res.json({ ok: true, config });
});

// Get leaderboard configuration
router.get('/config', async (req, res) => {
  const config = await getLeaderboardConfig();
  res.json({ ok: true, config: {
    numberOfWinners: config.numberOfWinners,
    pointsToDinarRate: config.pointsToDinarRate,
    active: config.active,
  } });
});

// Winner withdrawal: Convert weeklyPoints to dinars
router.post('/withdraw', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const user = await User.findById(uid);
  if (!user) return err(res, 'USER_NOT_FOUND', 404);

  // Check if user is a winner in the current or previous finalized season
  const now = new Date();
  const currentSeasonId = getIsoWeekId(now);
  const currentSeason = await Season.findOne({ seasonId: currentSeasonId });
  
  // Check if current season is finalized (week ended)
  if (!currentSeason || !currentSeason.finalized) {
    // Check previous season
    const prevWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevSeasonId = getIsoWeekId(prevWeek);
    const prevSeason = await Season.findOne({ seasonId: prevSeasonId, finalized: true });
    
    if (!prevSeason || !prevSeason.winners || !prevSeason.winners.some((w: any) => w.userId.toString() === uid.toString())) {
      return res.status(400).json({ ok: false, error: 'NOT_A_WINNER' });
    }
  } else {
    // Current season is finalized, check if user is a winner
    if (!currentSeason.winners || !currentSeason.winners.some((w: any) => w.userId.toString() === uid.toString())) {
      return res.status(400).json({ ok: false, error: 'NOT_A_WINNER' });
    }
  }

  // Get conversion rate
  const config = await getLeaderboardConfig();
  const pointsToDinarRate = config.pointsToDinarRate || 0.1;
  
  // Calculate dinars from weeklyPoints
  const pointsToConvert = user.weeklyPoints || 0;
  if (pointsToConvert <= 0) {
    return res.status(400).json({ ok: false, error: 'NO_POINTS_TO_WITHDRAW' });
  }

  const dinarsToAdd = Math.floor(pointsToConvert * pointsToDinarRate);
  
  // Update user: add dinars, reset weeklyPoints
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.updateOne(
      { _id: uid },
      { 
        $inc: { 'wallet.dinar': dinarsToAdd },
        $set: { weeklyPoints: 0 }
      },
      { session }
    );

    // Create wallet transaction
    const updatedUser = await User.findById(uid).session(session);
    await WalletTx.create([{
      userId: uid,
      type: 'reward',
      amountDinar: dinarsToAdd,
      balanceAfter: updatedUser?.wallet?.dinar || 0,
      ref: { kind: 'leaderboard_withdrawal' },
      meta: {
        title: 'سحب نقاط الأسبوع',
        subtitle: `تحويل ${pointsToConvert} نقطة إلى ${dinarsToAdd} دينار`,
        icon: 'trophy',
        direction: 'in',
        tags: ['leaderboard', 'withdrawal'],
      },
      createdAt: new Date()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ 
      ok: true, 
      pointsConverted: pointsToConvert,
      dinarsAdded: dinarsToAdd,
      wallet: { dinar: updatedUser?.wallet?.dinar || 0 }
    });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    return err(res, 'WITHDRAWAL_FAILED', 500);
  }
});

export default router;

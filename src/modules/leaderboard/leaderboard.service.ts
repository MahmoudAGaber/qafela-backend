import mongoose from 'mongoose';
import { Season, getIsoWeekId, getWeekWindowUtc } from './season.model';
import { User } from '../user/user.model';
import { PrizePlan } from '../rewards/prizePlan.model';
import { WinnerPayout } from '../rewards/winnerPayout.model';
import { JobLock } from '../core/jobLock.model';
import { getLeaderboardConfig } from './leaderboardConfig.model';

export async function finalizeWeeklyAndPayout(opts?: { force?: boolean; winnersLimit?: number }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const now = new Date();
    const seasonId = getIsoWeekId(now);
    let season = await Season.findOne({ seasonId }).session(session);
    if (!season) {
      const { start, end } = getWeekWindowUtc(now);
      const created = await Season.create([{ seasonId, startAt: start, endAt: end, finalized: false }], { session });
      season = created[0];
    }

    if (season && now < season.endAt && !opts?.force) {
      await session.commitTransaction(); session.endSession();
      return { ok: false, reason: 'SEASON_NOT_ENDED' };
    }

    const lockKey = `weekly_finalize::${season.seasonId}`;
    try {
      await JobLock.create([{ key: lockKey }], { session });
    } catch {
      await session.abortTransaction(); session.endSession();
      return { ok: false, reason: 'ALREADY_RUNNING' };
    }

    // Get configurable number of winners from config or use provided limit
    const config = await getLeaderboardConfig();
    const defaultLimit = config.numberOfWinners || 10;
    const limit = Math.min(200, Math.max(1, opts?.winnersLimit ?? defaultLimit));
    const winnersRaw = await User.find({}, { username: 1, weeklyPoints: 1 })
      .sort({ weeklyPoints: -1, _id: 1 })
      .limit(limit)
      .session(session)
      .lean();
    const winners = winnersRaw.map((u, i) => ({ userId: u._id, username: u.username, points: u.weeklyPoints || 0, rank: i + 1 }));

    if (season) {
      season.finalized = true as any;
      (season as any).winners = winners as any;
      await season.save({ session });
    }

    // Apply prize plan
    const plan = await PrizePlan.findOne({ active: true }).session(session).lean();
    if (plan) {
      // enforce weekly cap
      let spent = 0;
      const payouts: any[] = [];
      for (const w of winners) {
        const tier = plan.tiers.find(t => w.rank >= t.minRank && w.rank <= t.maxRank);
        if (!tier) continue;
        if (spent + tier.amountMinor > plan.weeklyCapMinor) break;
        spent += tier.amountMinor;
        payouts.push({
          userId: w.userId,
          seasonId: season.seasonId,
          rank: w.rank,
          amountMinor: tier.amountMinor,
          currency: plan.currency,
          title: `جائزة المركز ${w.rank}`,
          description: `مكافأة أسبوعية للمركز ${w.rank}`,
          status: 'available',
          createdAt: new Date(),
        });
      }
      if (payouts.length) await WinnerPayout.insertMany(payouts, { session });
    }

    // Reset weekly points
    await User.updateMany({}, { $set: { weeklyPoints: 0 } }).session(session);

    // Prepare next season
    const nextStart = (season as any).endAt as Date;
    const nextEnd = new Date(nextStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextId = getIsoWeekId(nextStart);
    await Season.updateOne(
      { seasonId: nextId },
      { $setOnInsert: { seasonId: nextId, startAt: nextStart, endAt: nextEnd, finalized: false } },
      { upsert: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return { ok: true, season: season.seasonId, winners: winners.length };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
}

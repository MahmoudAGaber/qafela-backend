import mongoose from 'mongoose';
import { User } from '../user/user.model';
import { awardXp } from '../profile/xp.service';

/**
 * Check and update daily login streak
 * Awards XP based on streak length
 * @returns { streakUpdated: boolean, xpAwarded: number, currentStreak: number }
 */
export async function processDailyLogin(
  userId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<{ streakUpdated: boolean; xpAwarded: number; currentStreak: number }> {
  const user = await User.findById(userId).session(session || null);
  if (!user) {
    throw new Error('User not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const lastLoginDate = user.lastLoginDate
    ? new Date(user.lastLoginDate)
    : null;
  const lastLoginStr = lastLoginDate
    ? lastLoginDate.toISOString().split('T')[0]
    : null;

  let streakUpdated = false;
  let xpAwarded = 0;
  let currentStreak = user.loginStreak || 0;

  // Check if user already logged in today
  if (lastLoginStr === todayStr) {
    return { streakUpdated: false, xpAwarded: 0, currentStreak };
  }

  // Calculate days difference
  if (lastLoginDate) {
    const daysDiff = Math.floor(
      (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      currentStreak = (user.loginStreak || 0) + 1;
      streakUpdated = true;
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      currentStreak = 1;
      streakUpdated = true;
    } else {
      // Same day or future (shouldn't happen)
      return { streakUpdated: false, xpAwarded: 0, currentStreak };
    }
  } else {
    // First login ever - start streak
    currentStreak = 1;
    streakUpdated = true;
  }

  // Update longest streak if current is longer
  const longestStreak = Math.max(user.longestStreak || 0, currentStreak);

  // Award XP based on streak
  // Day 1: 10 XP, Day 2: 15 XP, Day 3: 20 XP, Day 4: 25 XP, Day 5+: 30 XP
  if (streakUpdated) {
    if (currentStreak === 1) {
      xpAwarded = 10;
    } else if (currentStreak === 2) {
      xpAwarded = 15;
    } else if (currentStreak === 3) {
      xpAwarded = 20;
    } else if (currentStreak === 4) {
      xpAwarded = 25;
    } else {
      xpAwarded = 30; // Day 5 and beyond
    }

    // Award bonus XP for milestone streaks
    if (currentStreak === 7) {
      xpAwarded += 50; // Weekly bonus
    } else if (currentStreak === 30) {
      xpAwarded += 200; // Monthly bonus
    } else if (currentStreak === 100) {
      xpAwarded += 500; // Century bonus
    }

    // Award XP
    await awardXp(userId, xpAwarded, { session });

    // Update user's login streak
    user.lastLoginDate = today;
    user.loginStreak = currentStreak;
    user.longestStreak = longestStreak;
    await user.save({ session });
  }

  return { streakUpdated, xpAwarded, currentStreak };
}




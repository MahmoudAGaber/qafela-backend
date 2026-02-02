import mongoose from "mongoose";
import { User } from "../user/user.model";
import { getLevelByNumber, getXPForNextLevel } from "../levels/level.service";

export function xpTargetFor(level: number) {
  // Use the new level system
  const base = 100;
  const step = 50;
  return base + Math.max(0, level - 1) * step;
}

export async function awardXp(
  userId: mongoose.Types.ObjectId,
  amount: number,
  opts?: { session?: mongoose.ClientSession }
) {
  if (!amount || amount <= 0) return null;
  const session = opts?.session ?? null;
  const user = await User.findById(userId).session(session);
  if (!user) return null;

  // Calculate total XP (current level XP + user's current XP)
  const currentLevelData = await getLevelByNumber(user.level);
  const currentLevelXPRequired = currentLevelData?.xpRequired ?? 0;
  const totalXP = currentLevelXPRequired + (user.xp ?? 0) + amount;

  // Update user XP
  user.xp = (user.xp ?? 0) + amount;
  user.stats = user.stats || ({} as any);

  // Check for level ups using the new level system
  let leveledUp = false;
  const maxLevel = 10;
  
  while (user.level < maxLevel) {
    const nextLevel = user.level + 1;
    const nextLevelData = await getLevelByNumber(nextLevel);
    
    if (!nextLevelData) break;
    
    if (totalXP >= nextLevelData.xpRequired) {
      // Level up!
      const currentLevelData = await getLevelByNumber(user.level);
      const currentLevelXPRequired = currentLevelData?.xpRequired ?? 0;
      
      // Calculate remaining XP for new level
      user.xp = totalXP - nextLevelData.xpRequired;
      user.level = nextLevel;
      user.xpToNext = getXPForNextLevel(nextLevel);
      user.stats.lastLevelUp = new Date();
      leveledUp = true;
    } else {
      // Update xpToNext for current level
      user.xpToNext = getXPForNextLevel(user.level);
      break;
    }
  }

  await user.save({ session });
  return { user, leveledUp };
}


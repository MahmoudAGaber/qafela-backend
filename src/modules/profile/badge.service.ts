import mongoose from "mongoose";
import { User } from "../user/user.model";
import { UserBadge } from "./userBadge.model";

interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  criteria:
    | { type: "drops_participation" }
    | { type: "legendary_purchase" }
    | { type: "barter_trades" };
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "drops_rookie",
    title: "مستكشف القوافل",
    description: "شارك في 10 عمليات شراء داخل القوافل.",
    icon: "camel",
    target: 10,
    criteria: { type: "drops_participation" },
  },
  {
    key: "legendary_collector",
    title: "جامع الأساطير",
    description: "احصل على عنصر نادر جدًا من القافلة.",
    icon: "crown",
    target: 1,
    criteria: { type: "legendary_purchase" },
  },
  {
    key: "barter_master",
    title: "خبير المقايضات",
    description: "أكمل 5 مقايضات ناجحة.",
    icon: "scales",
    target: 5,
    criteria: { type: "barter_trades" },
  },
];

export function getBadgeDefinitions() {
  return BADGE_DEFINITIONS;
}

async function incrementBadge(
  userId: mongoose.Types.ObjectId,
  def: BadgeDefinition,
  delta: number,
  session?: mongoose.ClientSession
) {
  if (!delta || delta <= 0) return;
  const badge = await UserBadge.findOneAndUpdate(
    { userId, badgeKey: def.key },
    {
      $setOnInsert: { target: def.target },
      $inc: { progress: delta },
    },
    { upsert: true, new: true, session }
  );

  if (!badge) return;

  if (badge.status === "locked" && badge.progress >= (badge.target || def.target)) {
    badge.status = "earned";
    badge.earnedAt = new Date();
    await badge.save({ session });
    await User.updateOne(
      { _id: userId },
      { $inc: { "stats.badgesEarned": 1 } },
      { session }
    );
  }
}

export async function recordDropPurchaseBadges(
  userId: mongoose.Types.ObjectId,
  opts: { quantity: number; rarity?: string },
  session?: mongoose.ClientSession
) {
  const dropsBadge = BADGE_DEFINITIONS.find((b) => b.criteria.type === "drops_participation");
  if (dropsBadge) {
    await incrementBadge(userId, dropsBadge, opts.quantity || 1, session);
  }
  if (opts.rarity && opts.rarity.toLowerCase() === "legendary") {
    const legendary = BADGE_DEFINITIONS.find((b) => b.criteria.type === "legendary_purchase");
    if (legendary) await incrementBadge(userId, legendary, 1, session);
  }
}

export async function recordBarterBadge(
  userId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const def = BADGE_DEFINITIONS.find((b) => b.criteria.type === "barter_trades");
  if (def) await incrementBadge(userId, def, 1, session);
}

export async function getUserBadges(userId: mongoose.Types.ObjectId) {
  const [defs, userBadges] = [BADGE_DEFINITIONS, await UserBadge.find({ userId }).lean()];
  const map = new Map(userBadges.map((b) => [b.badgeKey, b]));
  return defs.map((def) => {
    const doc = map.get(def.key);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      target: def.target,
      progress: doc?.progress ?? 0,
      status: doc?.status ?? "locked",
      earnedAt: doc?.earnedAt ?? null,
    };
  });
}


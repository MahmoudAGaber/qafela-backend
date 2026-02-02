import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "../../middlewares/auth";
import { User } from "../user/user.model";
import { getUserBadges } from "./badge.service";
import { formatWallet } from "../../utils/wallet";

const router = Router();

router.get("/overview", auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const user = await User.findById(uid).lean();
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });

  const badges = await getUserBadges(uid);
  const earned = badges.filter((b) => b.status !== "locked");

  res.json({
    user: {
      id: user._id,
      username: user.username,
      profile: user.profile ?? {},
    },
    level: {
      current: user.level ?? 1,
      xp: user.xp ?? 0,
      xpToNext: user.xpToNext ?? 100,
    },
    wallet: formatWallet(user.wallet),
    points: {
      lifetime: user.points ?? 0,
      weekly: user.weeklyPoints ?? 0,
    },
    stats: user.stats ?? {},
    badges: {
      earned: earned.length,
      highlights: earned.slice(0, 3),
    },
  });
});

router.get("/badges", auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const badges = await getUserBadges(uid);
  res.json({ badges });
});

router.patch("/", auth, async (req, res) => {
  const Schema = z.object({
    avatarUrl: z.string().url().max(500).optional(),
    bio: z.string().max(280).optional(),
    bannerColor: z.string().max(20).optional(),
  });
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT" });
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const update: any = {};
  if (parsed.data.avatarUrl !== undefined) update["profile.avatarUrl"] = parsed.data.avatarUrl;
  if (parsed.data.bio !== undefined) update["profile.bio"] = parsed.data.bio;
  if (parsed.data.bannerColor !== undefined) update["profile.bannerColor"] = parsed.data.bannerColor;
  const user = await User.findOneAndUpdate({ _id: uid }, { $set: update }, { new: true }).lean();
  res.json({ ok: true, profile: user?.profile ?? {} });
});

export default router;

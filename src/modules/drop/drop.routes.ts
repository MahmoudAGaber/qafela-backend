import { Router } from "express";
import mongoose from "mongoose";
import { Drop } from "./drop.model";
import { User } from "../user/user.model";
import { auth } from "../../middlewares/auth";
import { Inventory } from "../inventory/inventory.model";
import { WalletTx } from "../wallet/walletTx.model";
import { PurchaseLog } from "../order/purchaseLog.model";
import { err } from "../../utils/errors";
import { ensureTodayGenerated } from "../schedule/schedule.service";
import { IdempotencyKey } from "../core/idempotency.model";
import { z } from "zod";
import { rateLimit } from "../../middlewares/rateLimit";
import { awardXp } from "../profile/xp.service";
import { recordDropPurchaseBadges } from "../profile/badge.service";
import { formatWallet } from "../../utils/wallet";

const router = Router();

function withInitialStock<T extends { stock: number; initialStock?: number }>(items: T[]) {
  return items.map(item => ({
    ...item,
    initialStock: item.initialStock ?? item.stock,
  }));
}

/** (DEV) ????? Drop ??????? */
router.post("/seed", async (_req, res) => {
  const now = new Date();
  const later = new Date(Date.now() + 90 * 60 * 1000); // +1.5 ????
  await Drop.deleteMany({});
  const d = await Drop.create({
    name: "Caravan Drop",
    slot: "morning",
    startsAt: now,
    endsAt: later,
    isActive: true,
    items: withInitialStock([
      { title: "????? ????",  priceDinar: 120, givesPoints: 50,  barter: false, stock: 5,  rarity: "rare",      description: "????? ????? ??? ??????", visualId: "i1" },
      { title: "??? ????",    priceDinar: 200, givesPoints: 100, barter: false, stock: 2,  rarity: "legendary", description: "??? ?? ??? ?????",      visualId: "i2", maxPerUser: 1 },
      { title: "???? ????",   priceDinar: 80,  givesPoints: 0,   barter: true,  stock: 3,  rarity: "legendary", description: "???? ????????",        visualId: "i3" },
      { title: "???? ?????",  priceDinar: 50,  givesPoints: 20,  barter: false, stock: 10, rarity: "common",    description: "????? ???? ??????",     visualId: "i4" },
      { title: "????? ?????", priceDinar: 150, givesPoints: 70,  barter: false, stock: 4,  rarity: "rare",      description: "????? ?????",           visualId: "i5" },
      { title: "????? ?????",  priceDinar: 60,  givesPoints: 0,   barter: true,  stock: 6,  rarity: "rare",      description: "????? ????????",        visualId: "i6" },
    ]),
  });
  res.json({ ok: true, dropId: d._id });
});

/** ?????? ?????? ?????? */
router.get("/active", async (_req, res) => {
  const now = new Date();
  // Lazy-generate today's schedule if enabled
  try {
    const lazy = (process.env.ENABLE_LAZY_SCHEDULE ?? 'true').toLowerCase() !== 'false';
    if (lazy) await ensureTodayGenerated(now);
  } catch (e) {
    // proceed even if lazy generation fails; return current active drops
  }
  const drops = await Drop.find({
    startsAt: { $lte: now }, endsAt: { $gte: now }, isActive: true,
  }).select("name slot startsAt endsAt isActive items").lean();
  const normalized = drops.map(drop => ({
    ...drop,
    items: withInitialStock(((drop as any).items ?? []) as any[]),
  }));
  res.json({ drops: normalized });
});

router.get("/history", auth, async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const now = new Date();

  const purchasedDropIds = await PurchaseLog.distinct("dropId", { userId: uid });

  const endedDrops = await Drop.find({ endsAt: { $lte: now } })
    .sort({ endsAt: -1 })
    .limit(limit)
    .select("name slot startsAt endsAt items category scheduleId eventCode")
    .lean();

  const purchasedDrops = purchasedDropIds.length
    ? await Drop.find({ _id: { $in: purchasedDropIds } })
        .select("name slot startsAt endsAt items category scheduleId eventCode")
        .lean()
    : [];

  const dropMap = new Map<string, any>();
  for (const drop of [...endedDrops, ...purchasedDrops]) {
    dropMap.set(String(drop._id), drop);
  }

  const drops = Array.from(dropMap.values())
    .sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime())
    .slice(0, limit);

  if (drops.length === 0) return res.json({ history: [] });

  const dropIds = drops.map((d) => d._id);
  const [userLogs, globalStats] = await Promise.all([
    PurchaseLog.find({ userId: uid, dropId: { $in: dropIds } }).lean(),
    PurchaseLog.aggregate([
      { $match: { dropId: { $in: dropIds } } },
      {
        $group: {
          _id: "$dropId",
          totalQty: { $sum: "$qty" },
          buyers: { $addToSet: "$userId" },
        },
      },
    ]),
  ]);

  const statsMap = new Map<string, { totalQty: number; uniqueBuyers: number }>();
  for (const doc of globalStats) {
    statsMap.set(String(doc._id), {
      totalQty: doc.totalQty ?? 0,
      uniqueBuyers: Array.isArray(doc.buyers) ? doc.buyers.length : 0,
    });
  }

  type UserPurchase = {
    totalQty: number;
    totalSpent: number;
    items: Map<string, { itemId: mongoose.Types.ObjectId; qty: number; totalCost: number }>;
  };
  const userMap = new Map<string, UserPurchase>();
  for (const log of userLogs) {
    const key = String(log.dropId);
    let entry = userMap.get(key);
    if (!entry) {
      entry = { totalQty: 0, totalSpent: 0, items: new Map() };
      userMap.set(key, entry);
    }
    entry.totalQty += log.qty;
    entry.totalSpent += log.costDinar ?? 0;
    const itemKey = String(log.itemId);
    let item = entry.items.get(itemKey);
    if (!item) {
      item = { itemId: log.itemId, qty: 0, totalCost: 0 };
      entry.items.set(itemKey, item);
    }
    item.qty += log.qty;
    item.totalCost += log.costDinar ?? 0;
  }

  const history = drops.map((drop) => {
    const dropId = String(drop._id);
    const stats = statsMap.get(dropId);
    const userEntry = userMap.get(dropId);
    const itemMeta = new Map(
      ((drop.items ?? []) as any[]).map((itm: any) => [String(itm._id), itm])
    );
    const purchases = userEntry
      ? Array.from(userEntry.items.values()).map((p) => {
          const meta = itemMeta.get(String(p.itemId));
          return {
            itemId: p.itemId,
            key: meta?.key ?? null,
            title: meta?.title ?? "Item",
            rarity: meta?.rarity ?? null,
            visualId: meta?.visualId ?? null,
            qty: p.qty,
            totalCost: p.totalCost,
          };
        })
      : [];

    return {
      id: drop._id,
      name: drop.name,
      slot: drop.slot,
      startsAt: drop.startsAt,
      endsAt: drop.endsAt,
      status: drop.endsAt < now ? "completed" : "active",
      category: drop.category,
      scheduleId: drop.scheduleId,
      eventCode: drop.eventCode,
      totals: {
        soldItems: stats?.totalQty ?? 0,
        uniqueBuyers: stats?.uniqueBuyers ?? 0,
      },
      user: {
        participated: Boolean(userEntry),
        totalItems: userEntry?.totalQty ?? 0,
        totalSpent: userEntry?.totalSpent ?? 0,
        purchases,
      },
    };
  });

  res.json({ history });
});

/** Purchase history for a drop (per-user) */
router.get("/:dropId/purchases", auth, async (req, res) => {
  const { dropId } = req.params;
  const limitRaw = Number(req.query.limit ?? 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));

  let dropObjectId: mongoose.Types.ObjectId;
  try {
    dropObjectId = new mongoose.Types.ObjectId(dropId);
  } catch {
    return err(res, "INVALID_DROP_ID", 400);
  }

  const uid = (req as any).user._id;
  const logs = await PurchaseLog.find({ userId: uid, dropId: dropObjectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (!logs.length) return res.json({ purchases: [] });

  const dropDoc = await Drop.findOne({ _id: dropObjectId }).select("items").lean();
  const lookup = new Map<string, any>();
  if (dropDoc?.items?.length) {
    for (const item of withInitialStock(dropDoc.items as any[])) {
      lookup.set(String(item._id), item);
    }
  }

  const purchases = logs.map((log) => {
    const item = lookup.get(String(log.itemId));
    return {
      id: log._id,
      itemId: log.itemId,
      qty: log.qty,
      costDinar: log.costDinar,
      pointsGained: log.pointsGained,
      createdAt: log.createdAt,
      item: item ? {
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        visualId: item.visualId,
        rarity: item.rarity,
        givesPoints: item.givesPoints,
        initialStock: item.initialStock,
        stock: item.stock,
        barter: item.barter,
      } : null,
    };
  });

  res.json({ purchases });
});

/** ???? ???? ?? ?????? (??? ????? + ????? ???? + ????? Inventory) */
const buyLimiter = rateLimit({ windowMs: 60_000, max: 30 });
const BuySchema = z.object({ itemId: z.string().min(1), qty: z.number().int().positive().max(100) });
router.post("/:dropId/buy", auth, buyLimiter, async (req, res) => {
  const { dropId } = req.params;
  const parsed = BuySchema.safeParse(req.body);
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const { itemId, qty } = parsed.data;

  const now = new Date();
  const uid = (req as any).user._id;
  const uidObj = new mongoose.Types.ObjectId(uid);

  let itemObjectId: mongoose.Types.ObjectId;
  try {
    // Idempotency handling (TTL-backed)
    const idemKey = (req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string) || undefined;
    if (idemKey) {
      const up = await IdempotencyKey.updateOne(
        { userId: uidObj, key: idemKey },
        { $setOnInsert: { userId: uidObj, key: idemKey, endpoint: 'buy', createdAt: new Date() } },
        { upsert: true }
      );
      if (up.upsertedCount === 0) {
        const existing = await PurchaseLog.findOne({ userId: uidObj, idempotencyKey: idemKey });
        if (existing) {
          const stockLeft = (await Drop.findOne(
            { _id: existing.dropId, "items._id": existing.itemId },
            { "items.$": 1 }
          ).lean())?.items?.[0]?.stock ?? 0;
          return res.json({ ok: true, inventoryDelta: { itemId: existing.itemId, qty: existing.qty }, stockLeft, limits: {} });
        }
        return res.status(409).json({ ok: false, error: 'IDEMPOTENT_REPLAY' });
      }
    } itemObjectId = new mongoose.Types.ObjectId(itemId); }
  catch { return res.status(400).json({ error: "INVALID_ITEM_ID" }); }

  const useTx = (process.env.USE_TRANSACTIONS ?? "true").toLowerCase() === "true";
  const session = useTx ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    // Idempotency handling
    const idemKey = (req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string) || undefined;
    if (idemKey) {
      const existing = await PurchaseLog.findOne({ userId: uidObj, idempotencyKey: idemKey });
      if (existing) {
        // Return a stable response if the key already used
        const itemDoc = await Drop.findOne({ _id: existing.dropId }, { "items.$": 1 }).lean();
        const stockLeft = (await Drop.findOne(
          { _id: existing.dropId, "items._id": existing.itemId },
          { "items.$": 1 }
        ).lean())?.items?.[0]?.stock ?? 0;
        return res.json({
          ok: true,
          user: { /* cannot know user balance here without extra fetch; keep minimal */ },
          inventoryDelta: { itemId: existing.itemId, qty: existing.qty },
          stockLeft,
          limits: {}
        });
      }
    }
    // 1) ??? ?????? ? ??????
    const drop = await Drop.findOne({
      _id: dropId, isActive: true,
      startsAt: { $lte: now }, endsAt: { $gte: now },
      "items._id": itemObjectId,
    }).session(session as any);

    if (!drop) throw new Error("DROP_OR_ITEM_NOT_AVAILABLE");
    const item = drop.items.find(i => i._id.equals(itemObjectId));
    if (!item) throw new Error("DROP_OR_ITEM_NOT_AVAILABLE");
    if (item.stock < qty) throw new Error("NO_STOCK");

    // (???????) ???? ?????? maxPerUser
    if (item.maxPerUser) {
      // Per-drop cap per user
      const dropCap = Number(process.env.PER_DROP_PER_USER || '5');
      if (dropCap > 0) {
        const soFarDrop = await PurchaseLog.aggregate([
          { $match: { userId: uidObj, dropId: drop._id } },
          { $group: { _id: null, total: { $sum: "$qty" } } },
        ]).session(session as any);
        const totalInDrop = soFarDrop[0]?.total ?? 0;
        if (totalInDrop + qty > dropCap) throw new Error("ANTI_HOARDING_LIMIT");
      }

      // Rate-based cap per item per user (window)
      const perWindowSec = Number(process.env.PER_ITEM_WINDOW_SEC || '60');
      if (perWindowSec > 0) {
        const since = new Date(Date.now() - perWindowSec * 1000);
        const recent = await PurchaseLog.countDocuments({ userId: uidObj, itemId: item._id, createdAt: { $gte: since } }).session(session as any);
        if (recent >= 1) throw new Error("ANTI_HOARDING_LIMIT");
      }
      const soFar = await PurchaseLog.aggregate([
        { $match: { userId: uidObj, dropId: drop._id, itemId: item._id } },
        { $group: { _id: null, total: { $sum: "$qty" } } },
      ]).session(session as any);
      const boughtCount = soFar[0]?.total ?? 0;
      if (boughtCount + qty > item.maxPerUser) throw new Error("ANTI_HOARDING_LIMIT");
    }

    const cost = item.priceDinar * qty;
    const gain = item.barter ? 0 : item.givesPoints * qty;

    // 2) ???? ??????? ??????
    const dec = await Drop.updateOne(
      { _id: dropId, "items._id": itemObjectId, "items.stock": { $gte: qty } },
      { $inc: { "items.$.stock": -qty } }
    ).session(session as any);
    if (dec.modifiedCount === 0) throw new Error("NO_STOCK");

    // 3) ??? ??????? + ????? ??????
    const user = await User.findOneAndUpdate(
      { _id: uid, "wallet.dinar": { $gte: cost } },
      { $inc: { "wallet.dinar": -cost, points: gain, weeklyPoints: gain, "wallet.txCount": 1 } },
      { new: true }
    ).session(session as any);
    if (!user) {
      // ???? ??????? ?? ?????? ??? ????
      await Drop.updateOne(
        { _id: dropId, "items._id": itemObjectId },
        { $inc: { "items.$.stock": qty } }
      ).session(session as any);
      throw new Error("NOT_ENOUGH_FUNDS");
    }

    // 4) Inventory
    const inventoryFilter = item.barter
      ? { userId: uidObj, "items.typeKey": item.key ?? item.visualId ?? String(item._id) }
      : { userId: uidObj, "items.itemId": itemObjectId };
    const inventoryUpdate = item.barter
      ? {
          $inc: { "items.$.qty": qty },
          $set: {
            "items.$.title": item.title,
            "items.$.kind": "barter",
            "items.$.rarity": item.rarity,
            "items.$.points": item.givesPoints ?? 0,
            "items.$.icon": item.visualId ?? item.key ?? null,
            "items.$.barterAllowed": true,
          },
        }
      : {
          $inc: { "items.$.qty": qty },
          $set: {
            "items.$.title": item.title,
            "items.$.kind": "drop",
            "items.$.rarity": item.rarity,
            "items.$.barterAllowed": item.barter,
          },
        };
    const incRes = await Inventory.updateOne(
      inventoryFilter,
      inventoryUpdate,
      { session: session as any }
    );
    if (incRes.matchedCount === 0) {
      await Inventory.updateOne(
        { userId: uidObj },
        {
          $setOnInsert: { userId: uidObj },
          $push: {
            items: item.barter
              ? {
                  kind: "barter",
                  typeKey: item.key ?? item.visualId ?? String(item._id),
                  title: item.title,
                  icon: item.visualId ?? item.key ?? null,
                  rarity: item.rarity,
                  points: item.givesPoints ?? 0,
                  barterAllowed: true,
                  qty,
                  acquiredAt: new Date(),
                }
              : {
                  kind: "drop",
                  itemId: itemObjectId,
                  title: item.title,
                  rarity: item.rarity,
                  barterAllowed: item.barter,
                  qty,
                  acquiredAt: new Date(),
                },
          },
        },
        { upsert: true, session: session as any }
      );
    }

    // 5) Logs
    const logPayload: any = {
      userId: uidObj,
      dropId: drop._id,
      itemId: item._id,
      qty,
      costDinar: cost,
      pointsGained: gain,
      createdAt: new Date(),
    };
    if (idemKey) {
      logPayload.idempotencyKey = idemKey;
    }
    const logs = await PurchaseLog.create([logPayload], { session: session as any });
    if (idemKey) await IdempotencyKey.updateOne({ userId: uidObj, key: idemKey }, { $set: { refKind: 'order', refId: logs[0]._id } });

    await WalletTx.create([{
      userId: uidObj,
      type: "spend",
      amountDinar: -cost,
      balanceAfter: user.wallet.dinar,
      ref: { kind: "order", id: drop._id },
      meta: {
        title: "Drop purchase",
        subtitle: item.title,
        icon: item.visualId || "drop",
        direction: "out",
        tags: ["drop", String(drop.slot)],
      },
      createdAt: new Date()
    }], { session: session as any });
    if (idemKey) await IdempotencyKey.updateOne({ userId: uidObj, key: idemKey }, { $set: { refKind: 'order', refId: logs[0]._id } });

    const statsInc = {
      $inc: { "stats.dropsParticipated": 1, "stats.itemsPurchased": qty }
    };
    if (session) {
      await User.updateOne({ _id: uidObj }, statsInc, { session: session as any });
    } else {
      await User.updateOne({ _id: uidObj }, statsInc);
    }
    // Calculate XP based on item's givesXp and quantity
    const itemXp = item.barter ? 0 : (item.givesXp || 0); // No XP for barter items
    const xpGain = itemXp * qty; // XP = item XP * quantity
    if (xpGain > 0) {
      try {
        await awardXp(uidObj, xpGain, { session: session ?? undefined });
      } catch (e) {
        console.error("awardXp failed", e);
      }
    }
    try {
      await recordDropPurchaseBadges(
        uidObj,
        { quantity: qty, rarity: item.rarity },
        session ?? undefined
      );
    } catch (e) {
      console.error("recordDropPurchaseBadges failed", e);
    }

    if (session) await session.commitTransaction();

    // 6) ?? ????? ???????
    const stockLeft = (await Drop.findOne(
      { _id: dropId, "items._id": itemObjectId },
      { "items.$": 1 }
    ).lean())?.items?.[0]?.stock ?? 0;

    return res.json({
      ok: true,
      user: { points: user.points, wallet: formatWallet(user.wallet) },
      inventoryDelta: { itemId: item._id, title: item.title, qty },
      stockLeft,
      limits: {
        boughtThisItem: await PurchaseLog.countDocuments({ userId: uidObj, itemId: item._id }),
        maxPerUser: item.maxPerUser ?? null
      }
    });

  } catch (e: any) {
    if (session) await session.abortTransaction();
    const msg = e?.message || "BUY_FAILED";
    const allowed = new Set(["NOT_ENOUGH_FUNDS","NO_STOCK","DROP_OR_ITEM_NOT_AVAILABLE","ANTI_HOARDING_LIMIT","INVALID_INPUT","ITEM_IS_BARTER_ONLY","UNAUTHORIZED","IDEMPOTENT_REPLAY","BUY_FAILED"]);
    if (msg === "BUY_FAILED") {
      console.error("BUY_FAILED detail:", e);
      return res.status(400).json({
        ok: false,
        error: "BUY_FAILED",
        details: e?.message ?? String(e),
      });
    }
    if (!allowed.has(msg)) {
      console.error("BUY_FAILED detail:", e);
      return res.status(400).json({ ok: false, error: "BUY_FAILED", details: msg });
    }
    return err(res, msg, 400);
  } finally {
    if (session) session.endSession();
  }
});

export default router;

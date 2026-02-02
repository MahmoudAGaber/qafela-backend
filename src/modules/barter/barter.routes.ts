import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { err } from '../../utils/errors';
import { auth } from '../../middlewares/auth';
import { Inventory } from '../inventory/inventory.model';
import { User } from '../user/user.model';
import { WalletTx } from '../wallet/walletTx.model';
import { BarterType, BarterRecipe, BarterLog } from './barter.model';
import { Item } from '../item/item.model';
import { awardXp } from '../profile/xp.service';
import { recordBarterBadge } from '../profile/badge.service';
import { barterTypeLookup, caravanContent, isBarterItem } from '../../data/caravanContent';

const router = Router();

const LEGACY_FALLBACK_TYPES: Record<string, { key: string; name: string; icon: string; rarity: 'common'|'rare'|'epic'|'legendary'; points: number }> = {
  mystic_treasure: { key: 'mystic_treasure', name: 'Mystic Treasure', icon: 'gift', rarity: 'legendary', points: 150 },
  epic_box: { key: 'epic_box', name: 'Epic Box', icon: 'chest', rarity: 'epic', points: 80 },
  rare_box: { key: 'rare_box', name: 'Rare Box', icon: 'crate', rarity: 'rare', points: 40 },
  common_box: { key: 'common_box', name: 'Common Box', icon: 'box', rarity: 'common', points: 20 },
};

const barterDropLookup = new Map(
  caravanContent.drops.filter(isBarterItem).map((item) => [item.key, item])
);
const recipeLookup = new Map(
  caravanContent.recipes.map((recipe) => [orderPair(recipe.inputs[0], recipe.inputs[1]).join('+'), recipe.outputKey])
);

function mapBarterType(key: string) {
  const item = barterTypeLookup.get(key);
  if (item) {
    return {
      key: item.key,
      name: item.title_ar,
      icon: item.icon || item.key,
      rarity: item.rarity,
      points: item.points,
    };
  }
  return LEGACY_FALLBACK_TYPES[key];
}

function describeBarterKey(key: string) {
  const mapped = mapBarterType(key);
  if (mapped) return mapped;
  const dropItem = barterDropLookup.get(key);
  if (dropItem) {
    return {
      key: dropItem.key,
      name: dropItem.title_ar || dropItem.title_en || dropItem.key,
      icon: dropItem.icon || dropItem.key,
      rarity: dropItem.rarity,
      points: 0,
    };
  }
  return {
    key,
    name: key,
    icon: key,
    rarity: 'barter',
    points: 0,
  };
}

function orderPair(a: string, b: string) {
  return [a, b].sort() as [string, string];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fallbackFromRarity(r1: string, r2: string) {
  const pairKey = orderPair(r1, r2).join('+');
  const mappedKey = caravanContent.fallbacks[pairKey];
  if (mappedKey) {
    const mapped = mapBarterType(mappedKey);
    if (mapped) return mapped;
  }
  if (r1 === 'legendary' || r2 === 'legendary') return LEGACY_FALLBACK_TYPES.mystic_treasure;
  if (r1 === 'rare' && r2 === 'rare') return LEGACY_FALLBACK_TYPES.epic_box;
  const pair = new Set([r1, r2]);
  if (pair.has('rare') && pair.has('common')) return LEGACY_FALLBACK_TYPES.rare_box;
  return LEGACY_FALLBACK_TYPES.common_box;
}

function fallbackTypeByKey(key: string) {
  return mapBarterType(key);
}

async function decrementInventoryItem(
  uid: mongoose.Types.ObjectId,
  key: string,
  session?: mongoose.ClientSession
) {
  const trimmed = key.trim();
  const sessionOpts = session ? { session: session as any } : undefined;
  const update = { $inc: { 'items.$[target].qty': -1 } };
  const base = { userId: uid };
  const baseOptions = sessionOpts ? { ...sessionOpts } : {};

  const tryUpdate = async (arrayFilter: Record<string, any>) =>
    Inventory.updateOne(
      base,
      update,
      { ...baseOptions, arrayFilters: [arrayFilter] }
    );

  let res = await tryUpdate({ 'target.typeKey': trimmed, 'target.qty': { $gte: 1 } });
  if (res.modifiedCount === 0) {
    const regex = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
    res = await tryUpdate({ 'target.typeKey': regex, 'target.qty': { $gte: 1 } });
  }
  if (res.modifiedCount === 0) {
    res = await tryUpdate({ 'target.icon': trimmed, 'target.qty': { $gte: 1 } });
  }
  if (res.modifiedCount === 0) {
    const regex = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
    res = await tryUpdate({ 'target.icon': regex, 'target.qty': { $gte: 1 } });
  }
  if (res.modifiedCount === 0 && mongoose.Types.ObjectId.isValid(trimmed)) {
    res = await tryUpdate({ 'target.itemId': new mongoose.Types.ObjectId(trimmed), 'target.qty': { $gte: 1 } });
  }
  return res.modifiedCount > 0;
}

async function computeBarterOutcome(
  item1Key: string,
  item2Key: string,
  opts?: { allowFallback?: boolean }
) {
  const [k1, k2] = orderPair(item1Key, item2Key);
  const allowFallback = opts?.allowFallback !== false;
  const [typeA, typeB, itemA, itemB] = await Promise.all([
    BarterType.findOne({ key: k1, enabled: true }).lean(),
    BarterType.findOne({ key: k2, enabled: true }).lean(),
    Item.findOne({ key: k1 }).lean(),
    Item.findOne({ key: k2 }).lean(),
  ]);
  const inputA = typeA ?? itemA ?? barterDropLookup.get(k1);
  const inputB = typeB ?? itemB ?? barterDropLookup.get(k2);
  if (!inputA || !inputB) throw new Error('TYPE_NOT_FOUND');

  const recipeKey = orderPair(k1, k2).join('+');
  const recipe = await BarterRecipe.findOne({ key: recipeKey }).lean();
  let result: any;
  if (recipe) {
    const itemOut = await Item.findOne({ key: recipe.outputKey }).lean();
    const typeOut = !itemOut
      ? (barterTypeLookup.get(recipe.outputKey)
        ?? await BarterType.findOne({ key: recipe.outputKey, enabled: true }).lean())
      : null;
    const resolvedOut = itemOut ?? typeOut;
    if (!resolvedOut) throw new Error('OUTPUT_DISABLED');
    result = resolvedOut;
  } else if (!allowFallback) {
    throw new Error('NO_RECIPE');
  } else {
    const rarityA = 'rarity' in inputA ? String((inputA as any).rarity) : 'common';
    const rarityB = 'rarity' in inputB ? String((inputB as any).rarity) : 'common';
    result = fallbackFromRarity(rarityA, rarityB);
  }

  const normalizeInput = (item: any) => {
    if (item && typeof item.title_ar === 'string') {
      return {
        key: item.key,
        name: item.title_ar || item.title_en || item.key,
        icon: item.icon || item.key,
        rarity: item.rarity || 'barter',
        points: 0,
      };
    }
    if (item && typeof item.title === 'string') {
      return {
        key: item.key,
        name: item.title,
        icon: item.icon || item.key,
        rarity: item.rarity ?? 'common',
        points: item.points ?? item.givesPoints ?? 0,
      };
    }
    return {
      key: item?.key,
      name: item?.name ?? item?.key,
      icon: item?.icon ?? item?.key,
      rarity: item?.rarity ?? 'common',
      points: item?.points ?? item?.givesPoints ?? 0,
    };
  };

  const inputsMap = new Map<string, any>([
    [k1, normalizeInput(inputA)],
    [k2, normalizeInput(inputB)],
  ]);

  return {
    sortedKeys: [k1, k2] as [string, string],
    inputsMap,
    result: normalizeInput(result),
  };
}

function compactItem(item: any) {
  return {
    key: item?.key,
    name: item?.name ?? item?.key,
    icon: item?.icon ?? null,
    rarity: item?.rarity ?? null,
    points: item?.points ?? 0,
  };
}

// DEV: seed types
router.post('/seed', async (_req, res) => {
  await BarterType.deleteMany({});
  await BarterType.insertMany(
    caravanContent.barterTypes.map((bt) => ({
      key: bt.key,
      name: bt.title_ar,
      icon: bt.icon,
      rarity: bt.rarity,
      points: bt.points,
      source: bt.source,
      enabled: true,
    }))
  );
  await BarterRecipe.deleteMany({});
  await BarterRecipe.insertMany(
    caravanContent.recipes.map((recipe) => ({
      inputs: [...recipe.inputs].sort() as [string, string],
      key: orderPair(recipe.inputs[0], recipe.inputs[1]).join('+'),
      outputKey: recipe.outputKey,
    }))
  );
  res.json({ ok: true, types: await BarterType.countDocuments(), recipes: await BarterRecipe.countDocuments() });
});

// DEV: grant items to inventory
router.post('/grant', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const Schema = z.object({ items: z.array(z.object({ key: z.string().min(1), qty: z.number().int().positive().max(1000) })).nonempty() });
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return err(res, 'INVALID_INPUT', 400);
  const grants = parsed.data.items;
  for (const g of grants) {
    const t = await BarterType.findOne({ key: g.key, enabled: true }).lean();
    if (!t) continue;
    const q = Math.max(1, Number(g.qty || 1));
    const r = await Inventory.updateOne(
      { userId: uid, 'items.typeKey': t.key },
      { $inc: { 'items.$.qty': q }, $set: { 'items.$.title': t.name, 'items.$.icon': t.icon, 'items.$.rarity': t.rarity, 'items.$.points': t.points, 'items.$.kind': 'barter' } }
    );
    if (r.matchedCount === 0) {
      await Inventory.updateOne(
        { userId: uid },
        { $setOnInsert: { userId: uid }, $push: { items: { kind: 'barter', typeKey: t.key, title: t.name, icon: t.icon, rarity: t.rarity, points: t.points, qty: q, acquiredAt: new Date() } } },
        { upsert: true }
      );
    }
  }
  res.json({ ok: true });
});

router.get('/types', async (_req, res) => {
  const types = await BarterType.find({ enabled: true }).lean();
  res.json({ types });
});

router.get('/recipes', async (_req, res) => {
  const [recipes, items, types] = await Promise.all([
    BarterRecipe.find({}).lean(),
    Item.find({}).lean(),
    BarterType.find({ enabled: true }).lean(),
  ]);
  const itemsMap = new Map(items.map((item) => [item.key, item]));
  const typesMap = new Map(types.map((type) => [type.key, type]));
  const describeKey = (key: string) => {
    const item = itemsMap.get(key);
    if (item) {
      return { key: item.key, name: item.title, icon: item.icon || item.key, rarity: item.rarity, points: item.givesPoints ?? 0 };
    }
    const type = typesMap.get(key);
    if (type) {
      return { key: type.key, name: type.name, icon: type.icon || type.key, rarity: type.rarity, points: type.points };
    }
    const mapped = mapBarterType(key);
    if (mapped) return mapped;
    const dropItem = barterDropLookup.get(key);
    if (dropItem) {
      return {
        key: dropItem.key,
        name: dropItem.title_ar || dropItem.title_en || dropItem.key,
        icon: dropItem.icon || dropItem.key,
        rarity: dropItem.rarity,
        points: 0,
      };
    }
    return { key, name: key, icon: key, rarity: 'barter', points: 0 };
  };
  const mapped = recipes.map((recipe) => ({
    inputs: recipe.inputs.map((key) => describeKey(key)),
    result: describeKey(recipe.outputKey),
  }));
  const fallbackRules = Object.entries(caravanContent.fallbacks).map(([combo, key]) => ({
    combo,
    result: describeBarterKey(key),
  }));
  res.json({ recipes: mapped, fallbackRules });
});

router.post('/preview', auth, async (req, res) => {
  const Schema = z.object({ item1Key: z.string().min(1), item2Key: z.string().min(1) }).refine(v => v.item1Key !== v.item2Key);
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return err(res, 'INVALID_INPUT', 400);
  try {
    const outcome = await computeBarterOutcome(parsed.data.item1Key, parsed.data.item2Key, { allowFallback: false });
    return res.json({ ok: true, result: compactItem(outcome.result) });
  } catch (e: any) {
    const code = e?.message || 'BARTER_FAILED';
    return err(res, code as any, 400);
  }
});

router.post('/confirm', auth, async (req, res) => {
  const Schema = z.object({ item1Key: z.string().min(1), item2Key: z.string().min(1) }).refine(v => v.item1Key !== v.item2Key);
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return err(res, 'INVALID_INPUT', 400);
  const { item1Key, item2Key } = parsed.data;
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  try {
    const outcome = await computeBarterOutcome(item1Key, item2Key, { allowFallback: false });
    const executeConfirm = async (session?: mongoose.ClientSession) => {
      const sessionOpts = session ? { session: session as any } : undefined;

      for (const key of outcome.sortedKeys) {
        const dec = await decrementInventoryItem(uid, key, session);
        if (!dec) throw new Error('NOT_ENOUGH_ITEMS');
      }

      const resultItem = outcome.result;
      const inc = await Inventory.updateOne(
        { userId: uid, 'items.typeKey': resultItem.key },
        { $inc: { 'items.$.qty': 1 }, $set: { 'items.$.title': resultItem.name, 'items.$.icon': resultItem.icon, 'items.$.rarity': resultItem.rarity, 'items.$.points': resultItem.points, 'items.$.kind': 'barter' } },
        sessionOpts
      );
      if (inc.matchedCount === 0) {
        await Inventory.updateOne(
          { userId: uid },
          {
            $setOnInsert: { userId: uid },
            $push: {
              items: {
                kind: 'barter',
                typeKey: resultItem.key,
                title: resultItem.name ?? resultItem.key,
                icon: resultItem.icon,
                rarity: resultItem.rarity,
                points: resultItem.points ?? 0,
                qty: 1,
                acquiredAt: new Date(),
              },
            },
          },
          { upsert: true, ...(sessionOpts ?? {}) }
        );
      }

      const input1 = outcome.inputsMap.get(item1Key);
      const input2 = outcome.inputsMap.get(item2Key);

      if (session) {
        await BarterLog.create([
          {
            userId: uid,
            item1Key,
            item2Key,
            resultKey: resultItem.key,
            item1Name: input1?.name,
            item1Icon: input1?.icon,
            item1Rarity: input1?.rarity,
            item2Name: input2?.name,
            item2Icon: input2?.icon,
            item2Rarity: input2?.rarity,
            resultName: resultItem.name,
            resultIcon: resultItem.icon,
            resultRarity: resultItem.rarity,
            resultPoints: resultItem.points,
            createdAt: new Date(),
            used: false,
          },
        ], { session } as any);
      } else {
        await BarterLog.create([
          {
            userId: uid,
            item1Key,
            item2Key,
            resultKey: resultItem.key,
            item1Name: input1?.name,
            item1Icon: input1?.icon,
            item1Rarity: input1?.rarity,
            item2Name: input2?.name,
            item2Icon: input2?.icon,
            item2Rarity: input2?.rarity,
            resultName: resultItem.name,
            resultIcon: resultItem.icon,
            resultRarity: resultItem.rarity,
            resultPoints: resultItem.points,
            createdAt: new Date(),
            used: false,
          },
        ]);
      }

      await User.updateOne(
        { _id: uid },
        { $inc: { "stats.barterTrades": 1 } },
        sessionOpts
      );
      await awardXp(uid, 25, session ? { session } : undefined);
      await recordBarterBadge(uid, session);

      return resultItem;
    };

    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      const resultItem = await executeConfirm(session);
      await session.commitTransaction();
      session.endSession();
      return res.json({ ok: true, result: compactItem(resultItem) });
    } catch (e: any) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      const message = String(e?.message || '');
      if (message.includes('Transaction numbers are only allowed')) {
        const resultItem = await executeConfirm();
        return res.json({ ok: true, result: compactItem(resultItem) });
      }
      const code = e?.message || 'BARTER_FAILED';
      return err(res, code as any, 400);
    }
  } catch (e: any) {
    const code = e?.message || 'BARTER_FAILED';
    return err(res, code as any, 400);
  }
});

router.post('/use', auth, async (req, res) => {
  const Schema = z.object({ key: z.string().min(1) });
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return err(res, 'INVALID_INPUT', 400);
  const { key } = parsed.data;
  const uid = new mongoose.Types.ObjectId((req as any).user._id);

  const dec = await Inventory.findOneAndUpdate(
    { userId: uid, 'items.typeKey': key, 'items.qty': { $gte: 1 } },
    { $inc: { 'items.$.qty': -1 } },
    { new: true }
  ).lean();
  if (!dec) return res.status(400).json({ error: 'NOT_ENOUGH_QTY' });

  const logDoc = await BarterLog.findOneAndUpdate(
    { userId: uid, resultKey: key, used: false },
    { $set: { used: true } },
    { sort: { createdAt: 1 }, new: true }
  ).lean();

  const typeDoc = await BarterType.findOne({ key }).lean();
  const fallbackMeta = fallbackTypeByKey(key);
  const points = logDoc?.resultPoints ?? typeDoc?.points ?? fallbackMeta?.points ?? 0;

  const user = await User.findOneAndUpdate({ _id: uid }, { $inc: { points, weeklyPoints: points } }, { new: true });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });

  await WalletTx.create({
    userId: uid,
    type: 'reward',
    amountDinar: 0,
    balanceAfter: user.wallet.dinar,
    ref: { kind: 'prize' },
    meta: { title: 'Barter reward', icon: 'barter', direction: 'in' },
    createdAt: new Date()
  });

  res.json({ ok: true, points: user.points });
});

router.get('/history', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const logs = await BarterLog.find({ userId: uid }).sort({ createdAt: -1 }).lean();
  const keys = Array.from(new Set(logs.flatMap(l => [l.item1Key, l.item2Key, l.resultKey])));
  const typeDocs = await BarterType.find({ key: { $in: keys } }).lean();
  const typeLookup = new Map(typeDocs.map(t => [t.key, t]));

  function resolveMeta(log: any, key: string, prefix: 'item1'|'item2'|'result') {
    const base = typeLookup.get(key) || fallbackTypeByKey(key);
    const nameField = `${prefix}Name` as const;
    const iconField = `${prefix}Icon` as const;
    const rarityField = `${prefix}Rarity` as const;
    const pointsField = prefix === 'result' ? 'resultPoints' : undefined;
    return {
      key,
      name: log[nameField] ?? base?.name ?? key,
      icon: log[iconField] ?? base?.icon ?? null,
      rarity: log[rarityField] ?? base?.rarity ?? null,
      points: pointsField ? (log[pointsField] ?? base?.points ?? 0) : undefined,
    };
  }

  const history = logs.map(log => ({
    id: String(log._id),
    createdAt: log.createdAt,
    used: log.used,
    inputs: [
      resolveMeta(log, log.item1Key, 'item1'),
      resolveMeta(log, log.item2Key, 'item2'),
    ],
    result: resolveMeta(log, log.resultKey, 'result'),
  }));

  res.json({ history });
});

export default router;

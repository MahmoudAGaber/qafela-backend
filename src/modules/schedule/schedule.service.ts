import mongoose from 'mongoose';
import { Drop } from '../drop/drop.model';
import { CaravanSchedule, DropTemplate, SeasonalEvent, getDateIdUTC, ScheduleCategory } from './schedule.model';
import {
  caravanContent,
  CaravanDropDefinition,
  baseRarity,
  isBarterItem,
  isNormalItem,
} from '../../data/caravanContent';

const MINUTE = 60 * 1000;

export const DAILY_WINDOWS = {
  morning: { startHour: 8, endHour: 11, duration: 90 },
  noon:    { startHour: 12, endHour: 15, duration: 90 },
  evening: { startHour: 19, endHour: 22, duration: 120 },
  extra:   { startHour: 0, endHour: 24, duration: 90 },
};

function utcDateAt(date: Date, hour: number, minute = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute, 0, 0));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function cloneTemplateItems(items?: any[]) {
  return (items ?? []).map((it) => ({
    ...it,
    initialStock: it.initialStock ?? it.stock,
  }));
}

type GenSlot = 'morning' | 'noon' | 'evening' | 'extra';

function categoryFor(slot: GenSlot): ScheduleCategory {
  if (slot === 'morning') return 'daily_morning';
  if (slot === 'noon') return 'daily_midday';
  if (slot === 'evening') return 'daily_evening';
  return 'daily_extra';
}

type BaseRarity = 'common' | 'rare' | 'legendary';
const ALL_RARITIES: BaseRarity[] = ['common', 'rare', 'legendary'];

type SlotRules = {
  total: number;
  rarityTargets: Partial<Record<BaseRarity, number>>;
  barterCount: number;
};

const SLOT_RULES: Record<GenSlot, SlotRules> = {
  morning: { total: 6, rarityTargets: { common: 4, rare: 0, legendary: 0 }, barterCount: 2 },
  noon:    { total: 6, rarityTargets: { common: 4, rare: 0, legendary: 0 }, barterCount: 2 },
  evening: { total: 6, rarityTargets: { common: 3, rare: 1, legendary: 0 }, barterCount: 2 },
  extra:   { total: 4, rarityTargets: { common: 2, rare: 0, legendary: 1 }, barterCount: 1 },
};

function toDropItem(def: CaravanDropDefinition) {
  const barter = isBarterItem(def);
  return {
    key: def.key,
    title: def.title_ar,
    description: def.description_ar,
    priceDinar: def.priceDinar,
    givesPoints: def.givesPoints,
    barter,
    stock: def.stock,
    initialStock: def.stock,
    maxPerUser: def.maxPerUser ?? undefined,
    rarity: def.rarity,
    visualId: def.icon,
  };
}

function pickFromPool(pool: CaravanDropDefinition[], used: Set<string>) {
  if (pool.length === 0) return null;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  used.add(choice.key);
  return choice;
}

function pickBarterItem(used: Set<string>) {
  const pool = caravanContent.drops.filter(
    (item) => !used.has(item.key) && isBarterItem(item)
  );
  return pickFromPool(pool, used);
}

function pickNormalItem(
  used: Set<string>,
  target: BaseRarity,
  allowFallback: boolean
) {
  const pool = caravanContent.drops.filter(
    (item) =>
      !used.has(item.key) &&
      isNormalItem(item) &&
      baseRarity(item.rarity) === target
  );
  const pick = pickFromPool(pool, used);
  if (pick || !allowFallback) return pick;
  const fallbackPool = caravanContent.drops.filter(
    (item) => !used.has(item.key) && isNormalItem(item)
  );
  return pickFromPool(fallbackPool, used);
}

export function buildSlotItems(slot: GenSlot, used: Set<string>) {
  const rules = SLOT_RULES[slot];
  const counts = ALL_RARITIES.reduce<Record<BaseRarity, number>>((acc, rarity) => {
    acc[rarity] = rules.rarityTargets[rarity] ?? 0;
    return acc;
  }, {} as Record<BaseRarity, number>);

  const selected: CaravanDropDefinition[] = [];

  for (let i = 0; i < rules.barterCount; i++) {
    const pick = pickBarterItem(used);
    if (!pick) throw new Error('NOT_ENOUGH_BARTER_ITEMS');
    selected.push(pick);
  }

  for (const rarity of ALL_RARITIES) {
    let remaining = counts[rarity] ?? 0;
    while (remaining > 0) {
      const pick = pickNormalItem(used, rarity, true);
      if (!pick) throw new Error(`NOT_ENOUGH_${rarity.toUpperCase()}_ITEMS`);
      selected.push(pick);
      remaining -= 1;
    }
  }

  if (selected.length !== rules.total) {
    throw new Error('INVALID_SLOT_GENERATION');
  }

  return selected.map(toDropItem);
}

async function resolveTemplateItems(templateKey?: string) {
  if (!templateKey) return null;
  const tpl = await DropTemplate.findOne({ key: templateKey, active: true }).lean();
  if (!tpl) throw new Error('TEMPLATE_NOT_FOUND');
  return tpl.items as any[];
}

export async function generateDailySchedule(date: Date, opts?: { templateKey?: string }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dateId = getDateIdUTC(date);
    const templateKey = opts?.templateKey || process.env.CARAVAN_TEMPLATE_KEY;
    const templateItems = await resolveTemplateItems(templateKey || undefined);
    const usedKeys = new Set<string>();

    const usedIntervals: Array<{ start: Date; end: Date }> = [];

    const slots: GenSlot[] = ['morning', 'noon', 'evening'];
    for (const slot of slots) {
      const win = (DAILY_WINDOWS as any)[slot];
      const startH = randInt(win.startHour, win.endHour);
      const startM = randInt(0, 59);
      const startAt = utcDateAt(date, startH, startM);
      const endAt = new Date(startAt.getTime() + win.duration * MINUTE);

      const slotKey = slot;
      const category = categoryFor(slot);
      const scheduleId = `${dateId}::${slotKey}`;

      const dropItems = templateItems ? cloneTemplateItems(templateItems) : buildSlotItems(slot, usedKeys);
      const drop = await Drop.create([
        { name: 'Caravan Drop', slot: slot === 'noon' ? 'noon' : slot, startsAt: startAt, endsAt: endAt, isActive: true, items: dropItems, category, durationMinutes: win.duration, scheduleId }
      ], { session } as any);
      const dropId = drop[0]._id;
      await CaravanSchedule.updateOne(
        { dateId, slotKey },
        { $set: { category, startAt, endAt, dropId, status: 'published' } },
        { upsert: true, session }
      );
      usedIntervals.push({ start: startAt, end: endAt });
    }

    const extraWin = DAILY_WINDOWS.extra;
    let extraStart: Date | null = null;
    for (let i = 0; i < 50; i++) {
      const h = randInt(extraWin.startHour, extraWin.endHour);
      const m = randInt(0, 59);
      const s = utcDateAt(date, h, m);
      const e = new Date(s.getTime() + extraWin.duration * MINUTE);
      if (!usedIntervals.some((iv) => intervalsOverlap(iv.start, iv.end, s, e))) { extraStart = s; break; }
    }
    if (!extraStart) {
      const last = usedIntervals.sort((a, b) => a.end.getTime() - b.end.getTime())[usedIntervals.length - 1];
      extraStart = new Date(last.end.getTime() + 5 * MINUTE);
    }
    const extraEnd = new Date(extraStart.getTime() + extraWin.duration * MINUTE);
    const extraScheduleId = `${dateId}::extra`;
    const extraItems = templateItems ? cloneTemplateItems(templateItems) : buildSlotItems('extra', usedKeys);
    const extraDrop = await Drop.create([
      { name: 'Caravan Drop', slot: 'random', startsAt: extraStart, endsAt: extraEnd, isActive: true, items: extraItems, category: 'daily_extra', durationMinutes: extraWin.duration, scheduleId: extraScheduleId }
    ], { session } as any);
    await CaravanSchedule.updateOne(
      { dateId, slotKey: 'extra' },
      { $set: { category: 'daily_extra', startAt: extraStart, endAt: extraEnd, dropId: extraDrop[0]._id, status: 'published' } },
      { upsert: true, session }
    );

    const dayStart = utcDateAt(date, 0, 0);
    const dayEnd = utcDateAt(date, 24, 0);
    const events = await SeasonalEvent.find({ active: true, startAt: { $lt: dayEnd }, endAt: { $gt: dayStart } }).lean();
    let seasonalCounter = 0;
    for (const ev of events) {
      const windowStartH = ev.windowStartHour ?? 17;
      const windowEndH = ev.windowEndHour ?? 23;
      const dur = ev.durationMinutes ?? 90;
      const sH = randInt(windowStartH, Math.max(windowStartH + 1, windowEndH));
      const sM = randInt(0, 59);
      const s = utcDateAt(date, sH, sM);
      const e = new Date(s.getTime() + dur * MINUTE);

      if (ev.mode === 'replace' && ev.replaceSlot) {
        const repKey = ev.replaceSlot;
        const rep = await CaravanSchedule.findOne({ dateId, slotKey: repKey });
        if (rep && rep.dropId) {
          await Drop.updateOne({ _id: rep.dropId }, { $set: { startsAt: s, endsAt: e, category: 'seasonal', eventCode: ev.code, durationMinutes: dur } }, { session } as any);
          await CaravanSchedule.updateOne({ _id: rep._id }, { $set: { category: 'seasonal', startAt: s, endAt: e } }, { session } as any);
        }
      } else {
        const slotKey = `seasonal:${ev.code}:${++seasonalCounter}`;
        const seasonalItems = templateItems ? cloneTemplateItems(templateItems) : buildSlotItems('morning', usedKeys);
        const drop = await Drop.create([
          { name: ev.name || 'Seasonal Caravan', slot: 'random', startsAt: s, endsAt: e, isActive: true, items: seasonalItems, category: 'seasonal', durationMinutes: dur, scheduleId: `${dateId}::${slotKey}`, eventCode: ev.code }
        ], { session } as any);
        await CaravanSchedule.updateOne(
          { dateId, slotKey },
          { $setOnInsert: { dateId, slotKey }, $set: { category: 'seasonal', startAt: s, endAt: e, dropId: drop[0]._id, status: 'published' } },
          { upsert: true, session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();
    return { dateId };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
}

export async function getTodaySchedule(date: Date) {
  const dateId = getDateIdUTC(date);
  return CaravanSchedule.find({ dateId }).sort({ startAt: 1 }).lean();
}

export async function ensureTodayGenerated(date: Date) {
  const dateId = getDateIdUTC(date);
  const count = await CaravanSchedule.countDocuments({ dateId });
  if (count === 0) {
    await generateDailySchedule(date);
  }
}

export async function getNextDrop(now: Date) {
  return Drop.findOne({ startsAt: { $gt: now } }).sort({ startsAt: 1 }).lean();
}

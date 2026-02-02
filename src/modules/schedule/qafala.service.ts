import mongoose from 'mongoose';
import { Drop } from '../drop/drop.model';
import { CaravanSchedule, QafalaTemplate, getDateIdUTC, ITemplateItem } from './schedule.model';
import { buildSlotItems } from './schedule.service';

type GenSlot = 'morning' | 'noon' | 'evening' | 'extra';

const MINUTE = 60 * 1000;

function utcDateAt(date: Date, hour: number, minute = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute, 0, 0));
}

function cloneTemplateItems(items?: ITemplateItem[]) {
  return (items ?? []).map((it) => ({
    ...it,
    initialStock: it.initialStock ?? it.stock,
  }));
}

// Map Qafala types to slot keys for CaravanSchedule
function qafalaTypeToSlotKey(type: string): string {
  const mapping: Record<string, string> = {
    'morning': 'qafala_morning',
    'afternoon': 'qafala_afternoon',
    'night': 'qafala_night',
    'random': 'qafala_random',
  };
  return mapping[type] || type;
}

function qafalaTypeToCategory(type: string): string {
  const mapping: Record<string, string> = {
    'morning': 'daily_morning',
    'afternoon': 'daily_midday',
    'night': 'daily_evening',
    'random': 'daily_extra',
  };
  return mapping[type] || 'daily_morning';
}

// Generate Qafalas for a specific date
export async function generateQafalasForDate(date: Date) {
  try {
    const dateId = getDateIdUTC(date);
    const usedKeys = new Set<string>();

    // Get all active Qafala templates
    const qafalaTemplates = await QafalaTemplate.find({ active: true }).lean();

    // Create a map for quick lookup
    const templatesMap = new Map(qafalaTemplates.map(q => [q.type, q]));

    // Process morning, afternoon, night (fixed items)
    const fixedTypes: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];
    const usedIntervals: Array<{ start: Date; end: Date }> = [];

    for (const type of fixedTypes) {
      const template = templatesMap.get(type);
      if (!template) continue;

      const slotKey = qafalaTypeToSlotKey(type);
      const category = qafalaTypeToCategory(type);

      // Use fixed start/end hours from template, or defaults
      const startHour = template.startHour ?? (type === 'morning' ? 8 : type === 'afternoon' ? 12 : 19);
      const endHour = template.endHour ?? (type === 'morning' ? 11 : type === 'afternoon' ? 15 : 22);
      const duration = template.durationMinutes ?? 90;

      const startAt = utcDateAt(date, startHour, 0);
      const endAt = new Date(startAt.getTime() + duration * MINUTE);

      // Use fixed items from template
      const dropItems = cloneTemplateItems(template.items);
      const scheduleId = `${dateId}::${slotKey}`;

      const drop = await Drop.create({
        name: template.name || `Qafala ${type}`,
        slot: type === 'afternoon' ? 'noon' : type === 'night' ? 'evening' : 'morning',
        startsAt: startAt,
        endsAt: endAt,
        isActive: true,
        items: dropItems,
        category,
        durationMinutes: duration,
        scheduleId,
      });

      const dropId = drop._id;
      await CaravanSchedule.updateOne(
        { dateId, slotKey },
        { $set: { category, startAt, endAt, dropId, status: 'published' } },
        { upsert: true }
      );

      usedIntervals.push({ start: startAt, end: endAt });
    }

    // Process random Qafala (random items each day)
    const randomTemplate = templatesMap.get('random');
    if (randomTemplate) {
      const slotKey = qafalaTypeToSlotKey('random');
      const category = qafalaTypeToCategory('random');

      const startHour = randomTemplate.startHour ?? 0;
      const endHour = randomTemplate.endHour ?? 24;
      const duration = randomTemplate.durationMinutes ?? 90;

      // Find a time slot that doesn't overlap with fixed Qafalas
      let randomStart: Date | null = null;
      for (let h = startHour; h < endHour; h++) {
        const candidate = utcDateAt(date, h, 0);
        const candidateEnd = new Date(candidate.getTime() + duration * MINUTE);
        const overlaps = usedIntervals.some(interval =>
          (candidate >= interval.start && candidate < interval.end) ||
          (candidateEnd > interval.start && candidateEnd <= interval.end) ||
          (candidate <= interval.start && candidateEnd >= interval.end)
        );
        if (!overlaps) {
          randomStart = candidate;
          break;
        }
      }

      // If no non-overlapping slot found, place it after the last Qafala
      if (!randomStart) {
        if (usedIntervals.length > 0) {
          const last = usedIntervals.sort((a, b) => a.end.getTime() - b.end.getTime())[usedIntervals.length - 1];
          randomStart = new Date(last.end.getTime() + 5 * MINUTE);
        } else {
          randomStart = utcDateAt(date, startHour, 0);
        }
      }

      const randomEnd = new Date(randomStart.getTime() + duration * MINUTE);

      // Generate random items for random Qafala
      const randomItems = buildSlotItems('extra' as GenSlot, usedKeys);
      const scheduleId = `${dateId}::${slotKey}`;

      const drop = await Drop.create({
        name: randomTemplate.name || 'Random Qafala',
        slot: 'random',
        startsAt: randomStart,
        endsAt: randomEnd,
        isActive: true,
        items: randomItems,
        category,
        durationMinutes: duration,
        scheduleId,
      });

      const dropId = drop._id;
      await CaravanSchedule.updateOne(
        { dateId, slotKey },
        { $set: { category, startAt: randomStart, endAt: randomEnd, dropId, status: 'published' } },
        { upsert: true }
      );
    }

    return { dateId };
  } catch (e) {
    throw e;
  }
}

// Get today's Qafalas
export async function getTodayQafalas(date: Date) {
  const dateId = getDateIdUTC(date);
  const slotKeys = ['qafala_morning', 'qafala_afternoon', 'qafala_night', 'qafala_random'];
  const schedules = await CaravanSchedule.find({ 
    dateId, 
    slotKey: { $in: slotKeys } 
  }).populate('dropId').sort({ startAt: 1 }).lean();
  
  return schedules.map(schedule => ({
    ...schedule,
    drop: schedule.dropId,
  }));
}

async function syncQafalaFromTemplate(date: Date, template: any) {
  const dateId = getDateIdUTC(date);
  const slotKey = qafalaTypeToSlotKey(template.type);
  const category = qafalaTypeToCategory(template.type);

  const startHour = template.startHour ?? (template.type === 'morning' ? 8 : template.type === 'afternoon' ? 12 : template.type === 'night' ? 19 : 0);
  const endHour = template.endHour;
  const duration = endHour != null
    ? Math.max(30, (Number(endHour) - startHour) * 60)
    : (template.durationMinutes ?? 90);
  const startAt = utcDateAt(date, startHour, 0);
  const endAt = new Date(startAt.getTime() + duration * MINUTE);

  const schedule = await CaravanSchedule.findOne({ dateId, slotKey }).lean();
  const dropItems = cloneTemplateItems(template.items || []);
  const dropPayload = {
    name: template.name || `Qafala ${template.type}`,
    slot: template.type === 'afternoon' ? 'noon' : template.type === 'night' ? 'evening' : template.type === 'random' ? 'random' : 'morning',
    startsAt: startAt,
    endsAt: endAt,
    isActive: true,
    items: dropItems,
    category,
    durationMinutes: duration,
    scheduleId: `${dateId}::${slotKey}`,
  };

  if (schedule?.dropId) {
    await Drop.updateOne({ _id: schedule.dropId }, { $set: dropPayload });
    await CaravanSchedule.updateOne(
      { _id: schedule._id },
      { $set: { category, startAt, endAt, status: 'published' } }
    );
    return;
  }

  const drop = await Drop.create(dropPayload);
  await CaravanSchedule.updateOne(
    { dateId, slotKey },
    { $set: { category, startAt, endAt, dropId: drop._id, status: 'published' } },
    { upsert: true }
  );
}

// Ensure today's Qafalas are generated and kept in sync with templates
export async function ensureTodayQafalasGenerated(date: Date) {
  const templates = await QafalaTemplate.find({ active: true }).lean();
  if (templates.length === 0) {
    await generateQafalasForDate(date);
    return;
  }

  for (const template of templates) {
    await syncQafalaFromTemplate(date, template);
  }
}

// Get current or next active Qafala for mobile app
export async function getCurrentOrNextQafala(now: Date) {
  await ensureTodayQafalasGenerated(now);
  
  const todayId = getDateIdUTC(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowId = getDateIdUTC(tomorrow);

  // Find current active Qafala
  const activeQafala = await CaravanSchedule.findOne({
    slotKey: { $in: ['qafala_morning', 'qafala_afternoon', 'qafala_night', 'qafala_random'] },
    startAt: { $lte: now },
    endAt: { $gte: now },
    status: 'published',
    dateId: todayId,
  }).sort({ startAt: 1 }).lean();
  
  if (activeQafala && activeQafala.dropId) {
    const drop = await Drop.findById(activeQafala.dropId).lean();
    const qafalaType = activeQafala.slotKey.replace('qafala_', '');
    const template = await QafalaTemplate.findOne({ type: qafalaType }).lean();
    
    return {
      qafala: {
        ...activeQafala,
        drop,
        template: template ? { imageUrl: template.imageUrl, name: template.name } : null,
      },
      isActive: true,
      timeRemaining: activeQafala.endAt.getTime() - now.getTime(),
      timeUntilStart: 0,
    };
  }
  
  // Find next upcoming Qafala (today or tomorrow)
  const nextQafala = await CaravanSchedule.findOne({
    slotKey: { $in: ['qafala_morning', 'qafala_afternoon', 'qafala_night', 'qafala_random'] },
    startAt: { $gt: now },
    status: 'published',
    dateId: { $in: [todayId, tomorrowId] },
  }).sort({ startAt: 1 }).lean();
  
  if (nextQafala && nextQafala.dropId) {
    const drop = await Drop.findById(nextQafala.dropId).lean();
    const qafalaType = nextQafala.slotKey.replace('qafala_', '');
    const template = await QafalaTemplate.findOne({ type: qafalaType }).lean();
    
    return {
      qafala: {
        ...nextQafala,
        drop,
        template: template ? { imageUrl: template.imageUrl, name: template.name } : null,
      },
      isActive: false,
      timeRemaining: 0,
      timeUntilStart: nextQafala.startAt.getTime() - now.getTime(),
    };
  }
  
  return null;
}

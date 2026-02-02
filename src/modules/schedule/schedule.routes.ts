import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { generateDailySchedule, getTodaySchedule, ensureTodayGenerated, getNextDrop } from './schedule.service';
import { CaravanSchedule, DropTemplate, SeasonalEvent, getDateIdUTC } from './schedule.model';
import { z } from 'zod';
import { err } from '../../utils/errors';

const router = Router();

function isAdmin(req: any) {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  return process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET;
}

router.post('/schedule/generate', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  const schema = z.object({ date: z.string().optional(), template: z.string().optional(), force: z.string().optional() });
  const parsed = schema.safeParse({ date: req.query.date, template: req.query.template, force: req.query.force });
  if (!parsed.success) return err(res, 'INVALID_INPUT', 400);
  const qd = (parsed.data.date as string) || '';
  const date = qd ? new Date(qd + 'T00:00:00Z') : new Date();
  const dateId = getDateIdUTC(date);
  if (!parsed.data.force) {
    const exists = await CaravanSchedule.countDocuments({ dateId });
    if (exists > 0) return res.json({ ok: true, dateId, already: true });
  }
  await generateDailySchedule(date, { templateKey: (parsed.data.template as string) });
  res.json({ ok: true, dateId });
});

router.get('/schedule/today', async (_req, res) => {
  const today = new Date();
  await ensureTodayGenerated(today);
  const rows = await getTodaySchedule(today);
  res.json({ dateId: getDateIdUTC(today), slots: rows });
});

router.get('/drops/next', async (_req, res) => {
  const next = await getNextDrop(new Date());
  if (!next) return res.json({ next: null });
  res.json({ next: { startsAt: next.startsAt, endsAt: next.endsAt, name: next.name, slot: next.slot, category: next.category } });
});

// Upsert a drop template (admin)
router.post('/schedule/templates/upsert', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { key, name, items, active } = req.body || {};
    if (!key || typeof key !== 'string') return res.status(400).json({ error: 'INVALID_KEY' });
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'INVALID_NAME' });
    if (!Array.isArray(items)) return res.status(400).json({ error: 'INVALID_ITEMS' });

    // Minimal normalization: only allow known fields per template item schema
    const safeItems = items.map((it: any) => {
      const rawRarity = it.rarity != null ? String(it.rarity) : 'common';
      const isBarter = rawRarity === 'barter' || Boolean(it.barter ?? false);
      const normalizedRarity = isBarter ? 'barter' : rawRarity;
      return {
        title: String(it.title ?? ''),
        priceDinar: Number(it.priceDinar ?? 0),
        givesPoints: Number(it.givesPoints ?? 0),
        barter: isBarter,
        stock: Number(it.stock ?? 0),
        maxPerUser: it.maxPerUser != null ? Number(it.maxPerUser) : undefined,
        rarity: normalizedRarity,
        description: it.description != null ? String(it.description) : undefined,
        visualId: it.visualId != null ? String(it.visualId) : undefined,
        imageUrl: it.imageUrl != null ? String(it.imageUrl) : undefined,
      };
    });

    await DropTemplate.updateOne(
      { key },
      { $set: { name, items: safeItems, active: active == null ? true : Boolean(active) }, $setOnInsert: { key } },
      { upsert: true }
    );
    const saved = await DropTemplate.findOne({ key }).lean();
    res.json({ ok: true, template: saved });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message || 'UPSERT_FAILED' });
  }
});

// Convenience endpoints to seed a default template and seasonal event (dev only)
router.post('/schedule/dev/seed-template', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  const exists = await DropTemplate.findOne({ key: 'default_daily' });
  if (exists) return res.json({ ok: true, already: true });
  await DropTemplate.create({ key: 'default_daily', name: 'Default Daily Caravan', items: [
    { title: '????? ????', priceDinar: 120, givesPoints: 50, stock: 5, rarity: 'rare', visualId: 'i1', maxPerUser: 1 },
    { title: '???? ?????', priceDinar: 50, givesPoints: 20, stock: 10, rarity: 'common', visualId: 'i4' },
    { title: '????? ?????', priceDinar: 150, givesPoints: 70, stock: 4, rarity: 'rare', visualId: 'i5' },
    { title: '???? ???? (????????)', priceDinar: 80, givesPoints: 0, stock: 3, rarity: 'barter', visualId: 'i3' },
  ], active: true });
  res.json({ ok: true });
});

router.post('/schedule/dev/seed-seasonal', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  const code = 'weekend';
  const now = new Date();
  const start = new Date(now.getTime() - 24*60*60*1000);
  const end = new Date(now.getTime() + 7*24*60*60*1000);
  await SeasonalEvent.updateOne(
    { code },
    { $set: { name: 'Weekend Special', startAt: start, endAt: end, templateKey: 'default_daily', mode: 'additive', windowStartHour: 17, windowEndHour: 23, durationMinutes: 90, active: true } },
    { upsert: true }
  );
  res.json({ ok: true });
});

export default router;

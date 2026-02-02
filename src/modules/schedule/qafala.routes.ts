import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/errors';
import { QafalaTemplate, getDateIdUTC, QafalaType } from './schedule.model';
import { generateQafalasForDate, getTodayQafalas, ensureTodayQafalasGenerated, getCurrentOrNextQafala } from './qafala.service';
import { Drop } from '../drop/drop.model';
import { CaravanSchedule } from './schedule.model';
import mongoose from 'mongoose';

const router = Router();

function isAdmin(req: any) {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  return process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET;
}

function slotKeyToType(slotKey: string): QafalaType | null {
  if (slotKey.includes('morning')) return 'morning';
  if (slotKey.includes('afternoon')) return 'afternoon';
  if (slotKey.includes('night')) return 'night';
  if (slotKey.includes('random')) return 'random';
  return null;
}

// Get all Qafala templates
router.get('/qafalas/templates', async (_req, res) => {
  try {
    const templates = await QafalaTemplate.find({}).sort({ type: 1 }).lean();
    res.json({ ok: true, templates });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get a specific Qafala template
router.get('/qafalas/templates/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const template = await QafalaTemplate.findOne({ type }).lean();
    if (!template) {
      return res.status(404).json({ ok: false, error: 'TEMPLATE_NOT_FOUND' });
    }
    res.json({ ok: true, template });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Create or update a Qafala template
router.post('/qafalas/templates', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const schema = z.object({
      type: z.enum(['morning', 'afternoon', 'night', 'random']),
      name: z.string().min(1),
      imageUrl: z.string().min(1),
      items: z.array(z.any()),
      active: z.boolean().optional(),
      startHour: z.number().optional(),
      endHour: z.number().optional(),
      durationMinutes: z.number().optional(),
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT', details: parsed.error });
    }
    
    const { type, name, imageUrl, items, active, startHour, endHour, durationMinutes } = parsed.data;
    
    // Normalize items
    const safeItems = items.map((it: any) => ({
      key: it.key || undefined,
      title: String(it.title ?? ''),
      priceDinar: Number(it.priceDinar ?? 0),
      givesPoints: Number(it.givesPoints ?? 0),
      barter: Boolean(it.barter ?? false),
      stock: Number(it.stock ?? 0),
      initialStock: it.initialStock != null ? Number(it.initialStock) : undefined,
      maxPerUser: it.maxPerUser != null ? Number(it.maxPerUser) : undefined,
      rarity: String(it.rarity ?? 'common'),
      description: it.description != null ? String(it.description) : undefined,
      visualId: it.visualId || undefined,
      imageUrl: it.imageUrl || undefined,
    }));
    
    const template = await QafalaTemplate.findOneAndUpdate(
      { type },
      {
        $set: {
          name,
          imageUrl,
          items: safeItems,
          active: active ?? true,
          startHour: startHour ?? undefined,
          endHour: endHour ?? undefined,
          durationMinutes: durationMinutes ?? undefined,
        },
        $setOnInsert: { type },
      },
      { upsert: true, new: true }
    ).lean();
    
    res.json({ ok: true, template });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Delete a Qafala template
router.delete('/qafalas/templates/:type', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const { type } = req.params;
    const result = await QafalaTemplate.deleteOne({ type });
    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: 'TEMPLATE_NOT_FOUND' });
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get today's Qafalas
router.get('/qafalas/today', async (_req, res) => {
  try {
    const today = new Date();
    await ensureTodayQafalasGenerated(today);
    const qafalas = await getTodayQafalas(today);
    
    // Populate drop details
    const qafalasWithDrops = await Promise.all(
      qafalas.map(async (qafala) => {
        const drop = qafala.dropId ? await Drop.findById(qafala.dropId).lean() : null;
        return {
          ...qafala,
          drop,
        };
      })
    );
    
    res.json({ 
      ok: true, 
      dateId: getDateIdUTC(today),
      qafalas: qafalasWithDrops 
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Force sync today's Qafalas (admin only)
router.post('/qafalas/today/sync', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const today = new Date();
    await ensureTodayQafalasGenerated(today);
    const qafalas = await getTodayQafalas(today);
    res.json({
      ok: true,
      dateId: getDateIdUTC(today),
      qafalas,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get current or next Qafala for mobile app
router.get('/qafalas/current', async (_req, res) => {
  try {
    const now = new Date();
    const result = await getCurrentOrNextQafala(now);
    
    if (!result) {
      return res.json({ 
        ok: true, 
        qafala: null,
        isActive: false,
        timeRemaining: 0,
        timeUntilStart: 0,
      });
    }
    
    res.json({ 
      ok: true, 
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update items in a specific Qafala for today
router.put('/qafalas/today/:slotKey/items', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const { slotKey } = req.params;
    const schema = z.object({
      items: z.array(z.any()),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }
    
    const today = new Date();
    const dateId = getDateIdUTC(today);
    
    const schedule = await CaravanSchedule.findOne({ dateId, slotKey }).lean();
    if (!schedule || !schedule.dropId) {
      return res.status(404).json({ ok: false, error: 'QAFALA_NOT_FOUND' });
    }
    
    // Normalize items
    const safeItems = parsed.data.items.map((it: any) => ({
      key: it.key || undefined,
      title: String(it.title ?? ''),
      titleAr: it.titleAr ? String(it.titleAr) : undefined, // Arabic title
      priceDinar: Number(it.priceDinar ?? 0),
      givesPoints: Number(it.givesPoints ?? 0),
      barter: Boolean(it.barter ?? false),
      stock: Number(it.stock ?? 0),
      initialStock: it.initialStock != null ? Number(it.initialStock) : it.stock ?? 0,
      maxPerUser: it.maxPerUser != null ? Number(it.maxPerUser) : undefined,
      rarity: String(it.rarity ?? 'common'),
      description: it.description != null ? String(it.description) : undefined,
      visualId: it.visualId || undefined,
      imageUrl: it.imageUrl || undefined,
    }));
    
    // Update drop with items and optionally name/nameAr
    const updateData: any = { items: safeItems };
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.nameAr !== undefined) updateData.nameAr = String(req.body.nameAr);
    
    let scheduleUpdate: any = {};
    let dropTimeUpdate: any = {};
    if (parsed.data.startAt || parsed.data.endAt) {
      if (!parsed.data.startAt || !parsed.data.endAt) {
        return res.status(400).json({ ok: false, error: 'INVALID_TIME_RANGE' });
      }
      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
        return res.status(400).json({ ok: false, error: 'INVALID_TIME_RANGE' });
      }
      scheduleUpdate = { startAt, endAt };
      dropTimeUpdate = { startsAt: startAt, endsAt: endAt };
    }

    if (Object.keys(scheduleUpdate).length > 0) {
      await CaravanSchedule.updateOne(
        { _id: schedule._id },
        { $set: scheduleUpdate }
      );
    }

    await Drop.updateOne(
      { _id: schedule.dropId },
      { $set: { ...updateData, ...dropTimeUpdate } }
    );

    const qafalaType = slotKeyToType(slotKey);
    if (qafalaType) {
      const templateUpdate: any = {
        name: updateData.name ?? undefined,
        items: safeItems,
        active: true,
      };
      if (parsed.data.startAt && parsed.data.endAt) {
        const startAt = new Date(parsed.data.startAt);
        const endAt = new Date(parsed.data.endAt);
        const durationMinutes = Math.max(30, Math.round((endAt.getTime() - startAt.getTime()) / 60000));
        templateUpdate.startHour = startAt.getUTCHours();
        templateUpdate.endHour = endAt.getUTCHours();
        templateUpdate.durationMinutes = durationMinutes;
      }
      await QafalaTemplate.updateOne(
        { type: qafalaType },
        { $set: templateUpdate, $setOnInsert: { type: qafalaType } },
        { upsert: true }
      );
    }
    
    const updatedDrop = await Drop.findById(schedule.dropId).lean();
    res.json({ ok: true, drop: updatedDrop });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Add item to a specific Qafala for today
router.post('/qafalas/today/:slotKey/items', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const { slotKey } = req.params;
    const schema = z.object({
      item: z.any(),
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }
    
    const today = new Date();
    const dateId = getDateIdUTC(today);
    
    const schedule = await CaravanSchedule.findOne({ dateId, slotKey }).lean();
    if (!schedule || !schedule.dropId) {
      return res.status(404).json({ ok: false, error: 'QAFALA_NOT_FOUND' });
    }
    
    const item = parsed.data.item;
    const newItem = {
      key: item.key || undefined,
      title: String(item.title ?? ''),
      priceDinar: Number(item.priceDinar ?? 0),
      givesPoints: Number(item.givesPoints ?? 0),
      barter: Boolean(item.barter ?? false),
      stock: Number(item.stock ?? 0),
      initialStock: item.initialStock != null ? Number(item.initialStock) : item.stock ?? 0,
      maxPerUser: item.maxPerUser != null ? Number(item.maxPerUser) : undefined,
      rarity: String(item.rarity ?? 'common'),
      description: item.description != null ? String(item.description) : undefined,
      visualId: item.visualId || undefined,
      imageUrl: item.imageUrl || undefined,
    };
    
    await Drop.updateOne(
      { _id: schedule.dropId },
      { $push: { items: newItem } }
    );
    
    const updatedDrop = await Drop.findById(schedule.dropId).lean();
    res.json({ ok: true, drop: updatedDrop });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Remove item from a specific Qafala for today
router.delete('/qafalas/today/:slotKey/items/:itemId', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const { slotKey, itemId } = req.params;
    
    const today = new Date();
    const dateId = getDateIdUTC(today);
    
    const schedule = await CaravanSchedule.findOne({ dateId, slotKey }).lean();
    if (!schedule || !schedule.dropId) {
      return res.status(404).json({ ok: false, error: 'QAFALA_NOT_FOUND' });
    }
    
    await Drop.updateOne(
      { _id: schedule.dropId },
      { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } }
    );
    
    const updatedDrop = await Drop.findById(schedule.dropId).lean();
    res.json({ ok: true, drop: updatedDrop });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Regenerate Qafalas for a specific date
router.post('/qafalas/generate', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  
  try {
    const schema = z.object({
      date: z.string().optional(),
    });
    
    const parsed = schema.safeParse(req.query);
    const dateStr = parsed.success ? parsed.data.date : undefined;
    const date = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
    
    const result = await generateQafalasForDate(date);
    res.json({ ok: true, dateId: result.dateId });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;

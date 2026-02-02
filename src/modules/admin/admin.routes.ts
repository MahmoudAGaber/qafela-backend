import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/errors';
import { Level } from '../levels/level.model';
import { Drop } from '../drop/drop.model';
import { BarterType, BarterRecipe } from '../barter/barter.model';
import { CaravanSchedule, getDateIdUTC } from '../schedule/schedule.model';
import { Item } from '../item/item.model';
import * as path from 'path';
import { promises as fs } from 'fs';
import express from 'express';
import { loadItems, saveItems } from './items.service';

const router = Router();

function isAdmin(req: any) {
  // Auth disabled for now - always return true
  // TODO: Re-enable authentication for production
  return true;
}

async function upsertItemsJson(item: any) {
  try {
    const items = await loadItems();
    const index = items.findIndex((entry) => entry.key === item.key);
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }
    await saveItems(items);
  } catch (e: any) {
    console.warn('[Admin] Failed to update items.json:', e?.message || e);
  }
}

async function removeFromItemsJson(key: string) {
  try {
    const items = await loadItems();
    const next = items.filter((item) => item.key !== key);
    if (next.length !== items.length) {
      await saveItems(next);
    }
  } catch (e: any) {
    console.warn('[Admin] Failed to remove item from items.json:', e?.message || e);
  }
}

// ============ LEVELS ADMIN ============
router.get('/levels', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const levels = await Level.find({}).sort({ level: 1 }).lean();
    res.json({ ok: true, levels });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/levels', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const level = await Level.create(req.body);
    res.json({ ok: true, level });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.put('/levels/:id', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!level) return err(res, 'LEVEL_NOT_FOUND', 404);
    res.json({ ok: true, level });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.delete('/levels/:id', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ============ QAFALAS ADMIN ============
router.get('/qafalas/today', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const today = new Date();
    const { getTodaySchedule } = await import('../schedule/schedule.service');
    const slots = await getTodaySchedule(today);
    res.json({ ok: true, dateId: getDateIdUTC(today), slots });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/qafalas/generate', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { generateDailySchedule } = await import('../schedule/schedule.service');
    const date = req.body.date ? new Date(req.body.date) : new Date();
    await generateDailySchedule(date);
    res.json({ ok: true, dateId: getDateIdUTC(date) });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.put('/schedule/:scheduleId/drop', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { dropId, startAt, endAt, items } = req.body;
    const schedule = await CaravanSchedule.findById(req.params.scheduleId);
    if (!schedule) return err(res, 'SCHEDULE_NOT_FOUND', 404);
    
    if (dropId) {
      const drop = await Drop.findById(dropId);
      if (!drop) return err(res, 'DROP_NOT_FOUND', 404);
      drop.startsAt = startAt ? new Date(startAt) : drop.startsAt;
      drop.endsAt = endAt ? new Date(endAt) : drop.endsAt;
      if (items && Array.isArray(items)) {
        // Update items - items should reference keys from database
        const itemDefinitions = await Item.find({ key: { $in: items.filter((i: any) => typeof i === 'string') } }).lean();
        drop.items = items.map((itemKeyOrData: string | any) => {
          if (typeof itemKeyOrData === 'string') {
            // Find item by key from database
            const def = itemDefinitions.find((d: any) => d.key === itemKeyOrData);
            if (!def) return null;
            return {
              key: def.key,
              title: def.title,
              priceDinar: def.priceDinar,
              givesPoints: def.givesPoints,
              givesXp: def.givesXp,
              requiredLevel: def.requiredLevel,
              type: def.type,
              barter: def.barter,
              stock: def.stock || 10,
              maxPerUser: def.maxPerUser,
              rarity: def.rarity,
              description: def.description,
              icon: def.icon,
              imageUrl: def.imageUrl,
              visualId: def.visualId,
            };
          } else {
            // Full item data provided
            return itemKeyOrData;
          }
        }).filter(Boolean);
      }
      await drop.save();
      schedule.dropId = drop._id;
      if (startAt) schedule.startAt = new Date(startAt);
      if (endAt) schedule.endAt = new Date(endAt);
    }
    await schedule.save();
    const updated = await CaravanSchedule.findById(schedule._id).populate('dropId').lean();
    res.json({ ok: true, schedule: updated });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ============ ITEMS ADMIN (from Database) ============
router.get('/items', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const dbItems = await Item.find({}).sort({ key: 1 }).lean();
    if (dbItems.length > 0) {
      console.log(`[Admin] Loaded ${dbItems.length} items from DB`);
      return res.json({ ok: true, items: dbItems });
    }

    // Fallback to JSON only if DB is empty
    const itemsPath = path.join(process.cwd(), 'assets', 'items.json');
    const itemsData = await fs.readFile(itemsPath, 'utf-8');
    const parsed = JSON.parse(itemsData);
    const jsonItems = parsed.items || [];
    console.log(`[Admin] Loaded ${jsonItems.length} items from JSON (DB empty)`);
    res.json({ ok: true, items: jsonItems });
  } catch (e: any) {
    console.error('[Admin] Error loading items:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/items/:key', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const item = await Item.findOne({ key: req.params.key }).lean();
    if (!item) return err(res, 'ITEM_NOT_FOUND', 404);
    res.json({ ok: true, item });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.post('/items', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const item = await Item.create(req.body);
    await upsertItemsJson(item.toObject());
    res.json({ ok: true, item: item.toObject() });
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(400).json({ ok: false, error: 'Item with this key already exists' });
    }
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.put('/items/:key', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const item = await Item.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!item) return err(res, 'ITEM_NOT_FOUND', 404);
    await upsertItemsJson(item);
    res.json({ ok: true, item });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.delete('/items/:key', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const result = await Item.deleteOne({ key: req.params.key });
    if (result.deletedCount === 0) {
      return err(res, 'ITEM_NOT_FOUND', 404);
    }
    await removeFromItemsJson(req.params.key);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Seed items from JSON file to database (one-time migration)
router.post('/items/seed-from-json', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { seedItemsFromJSON } = await import('./seed-items');
    const result = await seedItemsFromJSON();
    res.json({ 
      ok: true, 
      message: `Seeded ${result.created} items, skipped ${result.skipped} duplicates`,
      ...result
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Fix items.json icon paths to match actual image files
router.post('/items/fix-icons', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { fixItemsJson } = await import('./fix-items-icons');
    await fixItemsJson();
    res.json({ ok: true, message: 'Items icons fixed successfully' });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Regenerate items.json from folder structure and text files
router.post('/items/regenerate-from-folders', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { generateItemsJson } = await import('./generate-items-from-folders');
    await generateItemsJson();
    res.json({ ok: true, message: 'Items.json regenerated successfully from folder structure' });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============ RECIPES ADMIN (DB only) ============
router.get('/recipes', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { enrichRecipesWithItems } = await import('./recipes.service');
    const recipes = await enrichRecipesWithItems();
    res.json({ ok: true, recipes });
  } catch (e: any) {
    console.error('[Admin] Error loading recipes:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/recipes', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { input1, input2, outputKey, description } = req.body;
    const inputs = [input1, input2].sort();
    const key = inputs.join('+');
    const recipe = await BarterRecipe.findOneAndUpdate(
      { key },
      {
        $set: {
          inputs,
          key,
          outputKey,
          description: description ?? '',
        },
      },
      { upsert: true, new: true }
    ).lean();
    res.json({ ok: true, recipe });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.delete('/recipes/:input1/:input2', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { input1, input2 } = req.params;
    const inputs = [input1, input2].sort();
    const key = inputs.join('+');
    await BarterRecipe.deleteOne({ key });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Legacy route for backward compatibility
router.get('/barter/recipes', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const { enrichRecipesWithItems } = await import('./recipes.service');
    const recipes = await enrichRecipesWithItems();
    res.json({ ok: true, recipes });
  } catch (e: any) {
    console.error('[Admin] Error loading recipes:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============ BARTER TYPES ADMIN ============
router.get('/barter/types', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const types = await BarterType.find({}).sort({ key: 1 }).lean();
    res.json({ ok: true, types });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/barter/types', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const type = await BarterType.create(req.body);
    res.json({ ok: true, type });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.put('/barter/types/:key', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    const type = await BarterType.findOneAndUpdate({ key: req.params.key }, req.body, { new: true });
    if (!type) return err(res, 'TYPE_NOT_FOUND', 404);
    res.json({ ok: true, type });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.delete('/barter/types/:key', async (req, res) => {
  if (!isAdmin(req)) return err(res, 'UNAUTHORIZED', 403);
  try {
    await BarterType.findOneAndDelete({ key: req.params.key });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;

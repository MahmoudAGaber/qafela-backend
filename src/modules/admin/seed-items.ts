import * as fs from 'fs/promises';
import * as path from 'path';
import { Item } from '../item/item.model';

const ITEMS_FILE = path.join(process.cwd(), 'assets', 'items.json');

interface ItemData {
  items: Array<{
    key: string;
    title: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    rarity: string;
    priceDinar: number;
    givesPoints: number;
    givesXp?: number;
    requiredLevel?: number;
    type?: string;
    barter: boolean;
    stock?: number;
    maxPerUser?: number | null;
    icon?: string;
    imageUrl?: string;
    visualId?: string;
  }>;
}

export async function seedItemsFromJSON(): Promise<{ created: number; skipped: number }> {
  try {
    const fileContent = await fs.readFile(ITEMS_FILE, 'utf-8');
    const data: ItemData = JSON.parse(fileContent);
    const items = data.items || [];
    
    let created = 0;
    let skipped = 0;
    
    for (const item of items) {
      try {
        // Use upsert to update existing items or create new ones
        const result = await Item.updateOne(
          { key: item.key },
          {
            $set: {
              ...item,
              enabled: item.enabled !== undefined ? item.enabled : true,
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          created++;
        } else if (result.modifiedCount > 0) {
          created++; // Count updates as created
        } else {
          skipped++; // No change needed
        }
      } catch (e: any) {
        console.error(`Failed to upsert item ${item.key}:`, e.message);
        skipped++;
      }
    }
    
    console.log(`✅ Seeded ${created} items, skipped ${skipped} duplicates`);
    return { created, skipped };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️  items.json not found at ${ITEMS_FILE}. Skipping seed.`);
      return { created: 0, skipped: 0 };
    }
    console.error('Error seeding items:', error);
    throw error;
  }
}


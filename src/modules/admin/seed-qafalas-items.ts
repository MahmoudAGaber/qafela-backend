import * as fs from 'fs/promises';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { QafalaTemplate, ITemplateItem } from '../schedule/schedule.model';

dotenv.config();

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';

interface ItemFromJSON {
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
  maxPerUser?: number;
  icon?: string;
  imageUrl?: string;
  visualId?: string;
  enabled?: boolean;
}

async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`🟢 MongoDB connected at ${MONGO_URI}`);
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

function getRarityFolder(rarity: string): string {
  const rarityMap: { [key: string]: string } = {
    'legendary': 'legandry',
    'rare': 'rar',
    'common': 'common',
    'barter': 'barter',
    'epic': 'epic',
    'barter_result': 'barter%20result',
  };
  return rarityMap[rarity] || rarity;
}

function itemToTemplateItem(item: ItemFromJSON): ITemplateItem {
  const isBarter = item.barter || item.rarity === 'barter';
  const rarity = isBarter ? 'barter' : item.rarity;
  const icon = item.icon || item.key;
  const imageUrl = item.imageUrl || `/assets/${getRarityFolder(rarity)}/${icon}.png`;
  
  return {
    key: item.key,
    title: item.title,
    priceDinar: item.priceDinar,
    givesPoints: item.givesPoints,
    barter: isBarter,
    stock: item.stock || 10,
    initialStock: item.stock || 10,
    maxPerUser: item.maxPerUser,
    rarity: rarity,
    description: item.description,
    visualId: item.icon || item.key,
    imageUrl: imageUrl,
  };
}

async function loadItemsFromJSON(): Promise<ItemFromJSON[]> {
  try {
    const fileContent = await fs.readFile(ITEMS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.items || [];
  } catch (error: any) {
    console.error('❌ Error loading items.json:', error.message);
    throw error;
  }
}

function selectItemsForQafala(items: ItemFromJSON[], offset: number = 0): ITemplateItem[] {
  // Filter enabled items only
  const enabledItems = items.filter(item => item.enabled !== false);
  
  // Separate items by rarity
  const commonItems = enabledItems.filter(item => 
    item.rarity === 'common' && !item.barter
  );
  const rareItems = enabledItems.filter(item => 
    item.rarity === 'rare' && !item.barter
  );
  const legendaryItems = enabledItems.filter(item => 
    item.rarity === 'legendary' && !item.barter
  );
  const barterItems = enabledItems.filter(item => 
    item.barter || item.rarity === 'barter'
  );
  
  console.log(`  Available items: ${commonItems.length} common, ${rareItems.length} rare, ${legendaryItems.length} legendary, ${barterItems.length} barter`);
  
  // Select items: 6 common, 4 rare, 1 legendary, 3 barter
  // Use offset to select different items for each Qafala
  const selected: ITemplateItem[] = [];
  
  // Select 6 common items (with offset)
  for (let i = 0; i < 6 && i < commonItems.length; i++) {
    const idx = (offset * 6 + i) % commonItems.length;
    selected.push(itemToTemplateItem(commonItems[idx]));
  }
  
  // Select 4 rare items (with offset)
  for (let i = 0; i < 4 && i < rareItems.length; i++) {
    const idx = (offset * 4 + i) % rareItems.length;
    selected.push(itemToTemplateItem(rareItems[idx]));
  }
  
  // Select 1 legendary item (with offset)
  if (legendaryItems.length > 0) {
    const idx = offset % legendaryItems.length;
    selected.push(itemToTemplateItem(legendaryItems[idx]));
  }
  
  // Select 3 barter items (with offset)
  for (let i = 0; i < 3 && i < barterItems.length; i++) {
    const idx = (offset * 3 + i) % barterItems.length;
    selected.push(itemToTemplateItem(barterItems[idx]));
  }
  
  return selected;
}

async function seedQafalaItems() {
  try {
    console.log('🌱 Loading items from items.json...');
    const items = await loadItemsFromJSON();
    console.log(`✅ Loaded ${items.length} items from items.json`);
    
    console.log('\n🌱 Seeding default items for Qafala templates...');
    
    // Select items for each Qafala (morning, afternoon, night)
    const qafalaTypes: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];
    
    for (let idx = 0; idx < qafalaTypes.length; idx++) {
      const type = qafalaTypes[idx];
      console.log(`\n📦 Processing ${type} Qafala...`);
      const template = await QafalaTemplate.findOne({ type });
      
      if (!template) {
        console.warn(`⚠️  ${type} Qafala template not found. Please run seed-qafalas.ts first.`);
        continue;
      }
      
      // Check if template already has items
      if (template.items && template.items.length > 0) {
        console.log(`  ○ ${type} Qafala already has ${template.items.length} items. Skipping...`);
        console.log(`  💡 To update items, delete existing items via dashboard or API first.`);
        continue;
      }
      
      // Select items for this Qafala (use idx as offset to get different items)
      const selectedItems = selectItemsForQafala(items, idx);
      
      // Update template with selected items
      await QafalaTemplate.updateOne(
        { type },
        { $set: { items: selectedItems } }
      );
      
      const counts = {
        common: selectedItems.filter(i => i.rarity === 'common').length,
        rare: selectedItems.filter(i => i.rarity === 'rare').length,
        legendary: selectedItems.filter(i => i.rarity === 'legendary').length,
        barter: selectedItems.filter(i => i.barter).length,
      };
      
      console.log(`  ✓ Added ${selectedItems.length} items to ${type} Qafala:`);
      console.log(`    - ${counts.common} common, ${counts.rare} rare, ${counts.legendary} legendary, ${counts.barter} barter`);
    }
    
    console.log('\n✅ Default items seeded successfully!');
    console.log('📝 You can edit items via the dashboard or API.');
  } catch (error: any) {
    console.error('❌ Error seeding Qafala items:', error);
    throw error;
  }
}

// Run if called directly
(async () => {
  try {
    await connectDatabase();
    await seedQafalaItems();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();

export { seedQafalaItems };

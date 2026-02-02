import * as fs from 'fs/promises';
import * as path from 'path';

const ITEMS_FILE = path.join(process.cwd(), 'assets', 'items.json');

export interface ItemDefinition {
  key: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'barter' | 'barter_result';
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
}

export interface ItemsData {
  items: ItemDefinition[];
}

export async function loadItems(): Promise<ItemDefinition[]> {
  try {
    // Check if file exists
    try {
      await fs.access(ITEMS_FILE);
    } catch (accessError) {
      // File doesn't exist, create it with empty array
      console.warn(`[ItemsService] items.json not found at ${ITEMS_FILE}, creating empty file...`);
      const emptyData: ItemsData = { items: [] };
      await fs.mkdir(path.dirname(ITEMS_FILE), { recursive: true });
      await fs.writeFile(ITEMS_FILE, JSON.stringify(emptyData, null, 2), 'utf-8');
      console.log(`[ItemsService] Created empty items.json at ${ITEMS_FILE}`);
      return [];
    }

    const fileContent = await fs.readFile(ITEMS_FILE, 'utf-8');
    const data: ItemsData = JSON.parse(fileContent);
    const items = data.items || [];
    console.log(`[ItemsService] Loaded ${items.length} items from ${ITEMS_FILE}`);
    return items;
  } catch (error: any) {
    console.error(`[ItemsService] Error loading items.json from ${ITEMS_FILE}:`, error.message);
    console.error(`[ItemsService] Current working directory: ${process.cwd()}`);
    if (error.code === 'ENOENT') {
      console.error(`[ItemsService] File not found. Attempting to create...`);
      try {
        const emptyData: ItemsData = { items: [] };
        await fs.mkdir(path.dirname(ITEMS_FILE), { recursive: true });
        await fs.writeFile(ITEMS_FILE, JSON.stringify(emptyData, null, 2), 'utf-8');
        return [];
      } catch (createError: any) {
        console.error(`[ItemsService] Failed to create file:`, createError.message);
      }
    }
    return [];
  }
}

export async function saveItems(items: ItemDefinition[]): Promise<void> {
  try {
    const data: ItemsData = { items };
    await fs.writeFile(ITEMS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving items.json:', error);
    throw error;
  }
}

export async function getItemByKey(key: string): Promise<ItemDefinition | null> {
  const items = await loadItems();
  return items.find(item => item.key === key) || null;
}

export async function addItem(item: ItemDefinition): Promise<ItemDefinition> {
  const items = await loadItems();
  const existingIndex = items.findIndex(i => i.key === item.key);
  if (existingIndex >= 0) {
    throw new Error('Item with this key already exists');
  }
  items.push(item);
  await saveItems(items);
  return item;
}

export async function updateItem(key: string, updates: Partial<ItemDefinition>): Promise<ItemDefinition> {
  const items = await loadItems();
  const index = items.findIndex(i => i.key === key);
  if (index < 0) {
    throw new Error('Item not found');
  }
  items[index] = { ...items[index], ...updates };
  await saveItems(items);
  return items[index];
}

export async function deleteItem(key: string): Promise<void> {
  const items = await loadItems();
  const filtered = items.filter(i => i.key !== key);
  if (filtered.length === items.length) {
    throw new Error('Item not found');
  }
  await saveItems(filtered);
}

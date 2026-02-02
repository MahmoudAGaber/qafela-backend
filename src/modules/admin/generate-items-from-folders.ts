import * as fs from 'fs/promises';
import * as path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');

interface ItemData {
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
  icon: string;
  imageUrl?: string;
  visualId?: string;
  enabled: boolean;
}

interface TextFileEntry {
  name: string;
  price: number;
  points: number;
  quantity?: number;
}

function parseTextFile(content: string): TextFileEntry[] {
  const entries: TextFileEntry[] = [];
  // Remove BOM and normalize line endings
  let cleanContent = content.replace(/^\uFEFF/, '');
  cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanContent.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#') && !trimmed.endsWith('.png');
  });
  
  for (const line of lines) {
    // Parse format: item_name: price=X, points=Y, quantity=Z
    // Also handle format: item_name:        price=X,  points=Y, quantity=Z (with spaces)
    // Match patterns like: "arabian_carpet:        price=45,  points=36, quantity=4"
    const match = line.match(/^([^:]+):\s*price\s*=\s*(\d+)\s*,\s*points\s*=\s*(\d+)(?:\s*,\s*quantity\s*=\s*(\d+))?/i);
    if (match) {
      const [, name, price, points, quantity] = match;
      const cleanName = name.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
      if (cleanName) {
        entries.push({
          name: cleanName,
          price: parseInt(price, 10),
          points: parseInt(points, 10),
          quantity: quantity ? parseInt(quantity, 10) : undefined,
        });
      }
    }
  }
  
  return entries;
}

function generateTitleFromKey(key: string): string {
  // Convert snake_case to title case in Arabic-style naming
  // For now, we'll use English title case
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateItemType(key: string, rarity: string): string {
  const keyLower = key.toLowerCase();
  
  // Food items
  if (keyLower.includes('chicken') || keyLower.includes('lamb') || keyLower.includes('goat') || 
      keyLower.includes('cow') || keyLower.includes('sheep') || keyLower.includes('fish') ||
      keyLower.includes('egg') || keyLower.includes('milk') || keyLower.includes('cheese') ||
      keyLower.includes('dates') || keyLower.includes('honey') || keyLower.includes('nuts') ||
      keyLower.includes('rice') || keyLower.includes('flour') || keyLower.includes('dough') ||
      keyLower.includes('bread') || keyLower.includes('coffee') || keyLower.includes('tea')) {
    return 'food';
  }
  
  // Perfume/attar
  if (keyLower.includes('perfume') || keyLower.includes('attar') || keyLower.includes('oud')) {
    return 'perfume';
  }
  
  // Jewelry
  if (keyLower.includes('ring') || keyLower.includes('gem') || keyLower.includes('pearl') ||
      keyLower.includes('coral') || keyLower.includes('emerald') || keyLower.includes('golden_')) {
    return 'jewelry';
  }
  
  // Container/storage
  if (keyLower.includes('barrel') || keyLower.includes('box') || keyLower.includes('basket') ||
      keyLower.includes('pot') || keyLower.includes('bucket') || keyLower.includes('sack')) {
    return 'container';
  }
  
  // Clothing
  if (keyLower.includes('dress') || keyLower.includes('robe') || keyLower.includes('thobe') ||
      keyLower.includes('caftan') || keyLower.includes('slippers')) {
    return 'clothing';
  }
  
  // Tools
  if (keyLower.includes('knife') || keyLower.includes('axe') || keyLower.includes('hammer') ||
      keyLower.includes('saw') || keyLower.includes('scissors')) {
    return 'tool';
  }
  
  // Vehicles
  if (keyLower.includes('car') || keyLower.includes('camel') || keyLower.includes('horse')) {
    return 'vehicle';
  }
  
  // Decoration
  if (keyLower.includes('lantern') || keyLower.includes('carpet') || keyLower.includes('rug') ||
      keyLower.includes('mirror') || keyLower.includes('ornamental')) {
    return 'decoration';
  }
  
  // Electronics
  if (keyLower.includes('phone') || keyLower.includes('television') || keyLower.includes('playstation') ||
      keyLower.includes('refrigerator') || keyLower.includes('conditioner') || keyLower.includes('generator')) {
    return 'electronics';
  }
  
  return 'misc';
}

async function scanFolder(folderName: string, rarity: string): Promise<ItemData[]> {
  const folderPath = path.join(ASSETS_DIR, folderName);
  const items: ItemData[] = [];
  
  try {
    // Read the text file (handle UTF-16 encoding)
    const textFilePath = path.join(folderPath, 'files.txt');
    let textContent: string = '';
    let entries: TextFileEntry[] = [];
    
    try {
      const buffer = await fs.readFile(textFilePath);
      
      // Check for UTF-16 BOM
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        // UTF-16 LE with BOM - skip BOM (first 2 bytes)
        textContent = buffer.slice(2).toString('utf16le');
      } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        // UTF-16 BE with BOM - convert to LE
        const swapped = Buffer.from(buffer);
        for (let i = 0; i < swapped.length - 1; i += 2) {
          const temp = swapped[i];
          swapped[i] = swapped[i + 1];
          swapped[i + 1] = temp;
        }
        textContent = swapped.slice(2).toString('utf16le');
      } else {
        // Try UTF-8
        textContent = buffer.toString('utf-8');
      }
      
      entries = parseTextFile(textContent);
      if (entries.length === 0 && textContent.trim().length > 0) {
        // If parsing failed, try to extract PNG filenames from the content
        const pngMatches = textContent.match(/([a-zA-Z0-9_\-]+)\.png/gi);
        if (pngMatches && pngMatches.length > 0) {
          // Create entries from PNG filenames with default values
          for (const match of pngMatches) {
            const name = match.replace(/\.png$/i, '');
            entries.push({
              name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              price: rarity === 'barter_result' ? 0 : rarity === 'barter' ? 15 : rarity === 'common' ? 10 : rarity === 'rare' ? 50 : 200,
              points: rarity === 'barter_result' ? 0 : rarity === 'barter' ? 10 : rarity === 'common' ? 5 : rarity === 'rare' ? 40 : 160,
              quantity: rarity === 'barter_result' ? 0 : rarity === 'common' ? 50 : rarity === 'rare' ? 20 : rarity === 'legendary' ? 5 : 30,
            });
          }
          console.log(`[${folderName}] Created ${entries.length} entries from PNG filenames in files.txt`);
        } else {
          console.warn(`[${folderName}] Parsed 0 entries but file has content. First 200 chars:`, textContent.substring(0, 200));
        }
      }
    } catch (textError: any) {
      console.warn(`[${folderName}] Could not read files.txt:`, textError.message);
    }
    
    // Get all PNG files
    const files = await fs.readdir(folderPath);
    const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png') && f.toLowerCase() !== 'files.txt');
    
    console.log(`[${folderName}] Found ${entries.length} entries in files.txt and ${pngFiles.length} PNG files`);
    
    // Create items from entries
    for (const entry of entries) {
      // Find matching PNG file (case-insensitive)
      const matchingPng = pngFiles.find(png => {
        const pngName = png.replace(/\.png$/i, '').toLowerCase();
        const entryName = entry.name.toLowerCase();
        return pngName === entryName || 
               pngName.replace(/[^a-z0-9]/g, '_') === entryName.replace(/[^a-z0-9]/g, '_');
      });
      
      const iconName = matchingPng ? matchingPng.replace(/\.png$/i, '') : entry.name;
      
      const item: ItemData = {
        key: entry.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        title: generateTitleFromKey(entry.name),
        titleEn: generateTitleFromKey(entry.name),
        description: '',
        descriptionEn: '',
        rarity: rarity as any,
        priceDinar: entry.price,
        givesPoints: entry.points,
        givesXp: Math.floor(entry.points * 0.8), // XP is typically 80% of points
        requiredLevel: rarity === 'barter_result' ? 1 : rarity === 'common' ? 1 : rarity === 'rare' ? 2 : rarity === 'legendary' ? 5 : 3,
        type: generateItemType(entry.name, rarity),
        barter: rarity === 'barter' || folderName === 'barter',
        stock: entry.quantity || (rarity === 'barter_result' ? 0 : rarity === 'common' ? 50 : rarity === 'rare' ? 20 : rarity === 'legendary' ? 5 : 30),
        maxPerUser: rarity === 'barter_result' ? 0 : rarity === 'legendary' ? 1 : rarity === 'rare' ? 2 : rarity === 'common' ? 5 : 3,
        icon: iconName,
        enabled: true,
      };
      
      items.push(item);
    }
    
  } catch (error: any) {
    console.error(`Error scanning folder ${folderName}:`, error.message);
  }
  
  return items;
}

async function generateItemsJson() {
  try {
    console.log('🔄 Generating items.json from folder structure...');
    
    // Scan all folders
    const folders = [
      { name: 'common', rarity: 'common' },
      { name: 'rar', rarity: 'rare' },
      { name: 'legandry', rarity: 'legendary' },
      { name: 'barter', rarity: 'barter' },
      { name: 'barter result', rarity: 'barter_result' },
    ];
    
    const allItems: ItemData[] = [];
    
    for (const folder of folders) {
      const items = await scanFolder(folder.name, folder.rarity);
      allItems.push(...items);
      console.log(`✅ Scanned ${folder.name}: ${items.length} items`);
    }
    
    // Sort by key
    allItems.sort((a, b) => a.key.localeCompare(b.key));
    
    // Write to items.json
    const output = {
      items: allItems,
    };
    
    await fs.writeFile(ITEMS_FILE, JSON.stringify(output, null, 2), 'utf-8');
    
    console.log(`\n✅ Generated items.json with ${allItems.length} items`);
    console.log(`   - Common: ${allItems.filter(i => i.rarity === 'common').length}`);
    console.log(`   - Rare: ${allItems.filter(i => i.rarity === 'rare').length}`);
    console.log(`   - Legendary: ${allItems.filter(i => i.rarity === 'legendary').length}`);
    console.log(`   - Barter: ${allItems.filter(i => i.rarity === 'barter').length}`);
    
  } catch (error: any) {
    console.error('❌ Error generating items.json:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateItemsJson()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { generateItemsJson };

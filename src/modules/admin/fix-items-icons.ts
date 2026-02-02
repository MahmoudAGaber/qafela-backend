import * as fs from 'fs/promises';
import * as path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');

interface ItemDefinition {
  key: string;
  icon: string;
  rarity: string;
  [key: string]: any;
}

async function getAllImageFiles(): Promise<Map<string, { folder: string; filename: string }>> {
  const imageMap = new Map<string, { folder: string; filename: string }>();
  const folders = ['common', 'rar', 'legandry', 'barter', 'barter result'];
  
  for (const folder of folders) {
    const folderPath = path.join(ASSETS_DIR, folder);
    try {
      const files = await fs.readdir(folderPath);
      for (const file of files) {
        if (file.endsWith('.png')) {
          const key = file.replace(/\.png$/i, '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
          // Store both normalized key and original filename
          if (!imageMap.has(key)) {
            imageMap.set(key, { folder, filename: file.replace(/\.png$/i, '') });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read folder ${folder}:`, error);
    }
  }
  
  return imageMap;
}

async function fixItemsJson() {
  try {
    // Load items
    const itemsData = JSON.parse(await fs.readFile(ITEMS_FILE, 'utf-8'));
    const items: ItemDefinition[] = itemsData.items || [];
    
    // Get all available images
    const imageMap = await getAllImageFiles();
    console.log(`Found ${imageMap.size} image files`);
    
    let fixed = 0;
    let notFound = 0;
    
    // Fix items
    for (const item of items) {
      // Normalize keys for matching
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const itemKeyNorm = normalize(item.key);
      const iconKeyNorm = normalize(item.icon || item.key);
      
      let found: { folder: string; filename: string } | undefined;
      
      // Try exact match with normalized key
      if (imageMap.has(itemKeyNorm)) {
        found = imageMap.get(itemKeyNorm);
      }
      // Try with normalized icon
      else if (iconKeyNorm && imageMap.has(iconKeyNorm)) {
        found = imageMap.get(iconKeyNorm);
      }
      // Try fuzzy matching
      else {
        for (const [imgKey, info] of imageMap.entries()) {
          const imgKeyNorm = normalize(imgKey);
          if (imgKeyNorm === itemKeyNorm || imgKeyNorm === iconKeyNorm ||
              imgKeyNorm.includes(itemKeyNorm) || itemKeyNorm.includes(imgKeyNorm)) {
            found = info;
            break;
          }
        }
      }
      
      if (found) {
        // Update icon to match actual filename
        item.icon = found.filename;
        fixed++;
        console.log(`✓ Fixed: ${item.key} → icon: ${found.filename} (folder: ${found.folder})`);
      } else {
        console.warn(`⚠️  No image found for item: ${item.key} (icon: ${item.icon}, rarity: ${item.rarity})`);
        notFound++;
      }
    }
    
    // Save updated items
    await fs.writeFile(ITEMS_FILE, JSON.stringify(itemsData, null, 2), 'utf-8');
    
    console.log(`✅ Fixed ${fixed} items`);
    console.log(`⚠️  ${notFound} items without matching images`);
    console.log(`📝 Updated items.json`);
  } catch (error: any) {
    console.error('Error fixing items.json:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixItemsJson()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { fixItemsJson };

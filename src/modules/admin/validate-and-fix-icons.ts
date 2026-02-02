import * as fs from 'fs/promises';
import * as path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');
const RECIPES_FILE = path.join(ASSETS_DIR, 'recipes.json');

interface ItemDefinition {
  key: string;
  icon: string;
  rarity: string;
  [key: string]: any;
}

// Map rarity to folder name (matches recipes.service.ts)
function getRarityFolder(rarity: string): string {
  const rarityMap: { [key: string]: string } = {
    'legendary': 'legandry',
    'rare': 'rar',
    'common': 'common',
    'barter': 'barter',
    'epic': 'epic',
    'barter_result': 'barter result',
  };
  return rarityMap[rarity] || rarity;
}

// Normalize string for matching
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

// Get all image files organized by folder and normalized key
async function getAllImageFiles(): Promise<Map<string, { folder: string; filename: string; fullPath: string }>> {
  const imageMap = new Map<string, { folder: string; filename: string; fullPath: string }>();
  const folders = ['common', 'rar', 'legandry', 'barter', 'epic', 'barter result'];
  
  for (const folder of folders) {
    const folderPath = path.join(ASSETS_DIR, folder);
    try {
      const files = await fs.readdir(folderPath);
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filenameWithoutExt = file.replace(/\.png$/i, '');
          const normalizedKey = normalizeKey(filenameWithoutExt);
          const fullPath = path.join(folderPath, file);
          
          // Store by normalized key (multiple files can map to same normalized key)
          // Prefer exact matches, but store all for lookup
          if (!imageMap.has(normalizedKey) || file === filenameWithoutExt) {
            imageMap.set(normalizedKey, { 
              folder, 
              filename: filenameWithoutExt,
              fullPath 
            });
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`Could not read folder ${folder}:`, error.message);
      }
    }
  }
  
  return imageMap;
}

// Check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateAndFixItems() {
  try {
    console.log('🔍 Loading items.json...');
    const itemsData = JSON.parse(await fs.readFile(ITEMS_FILE, 'utf-8'));
    const items: ItemDefinition[] = itemsData.items || [];
    
    console.log('🔍 Scanning image files...');
    const imageMap = await getAllImageFiles();
    console.log(`✅ Found ${imageMap.size} image files across all folders`);
    
    let fixed = 0;
    let notFound = 0;
    let correct = 0;
    const issues: Array<{ key: string; issue: string }> = [];
    
    // Validate and fix each item
    for (const item of items) {
      const expectedFolder = getRarityFolder(item.rarity);
      const expectedIconPath = path.join(ASSETS_DIR, expectedFolder, `${item.icon}.png`);
      const iconExists = await fileExists(expectedIconPath);
      
      if (iconExists) {
        correct++;
        continue; // Icon is correct, no fix needed
      }
      
      // Icon doesn't exist in expected folder, try to find it
      const normalize = (str: string) => normalizeKey(str);
      const itemKeyNorm = normalize(item.key);
      const iconKeyNorm = normalize(item.icon || item.key);
      
      let found: { folder: string; filename: string; fullPath: string } | undefined;
      
      // First try exact match with current icon in expected folder
      const exactIconKey = `exact:${item.icon}`;
      if (imageMap.has(exactIconKey)) {
        const exactMatch = imageMap.get(exactIconKey)!;
        const exactMatchPath = path.join(ASSETS_DIR, exactMatch.folder, `${exactMatch.filename}.png`);
        if (await fileExists(exactMatchPath)) {
          found = exactMatch;
        }
      }
      
      // Try to find image by normalized key
      if (!found && imageMap.has(itemKeyNorm)) {
        found = imageMap.get(itemKeyNorm)!;
      } else if (!found && iconKeyNorm && imageMap.has(iconKeyNorm)) {
        found = imageMap.get(iconKeyNorm)!;
      }
      
      // If found but in wrong folder, check if we should update
      if (found) {
        const foundIconPath = path.join(ASSETS_DIR, found.folder, `${found.filename}.png`);
        const foundIconExists = await fileExists(foundIconPath);
        
        if (foundIconExists) {
          // Update icon to match actual filename
          const oldIcon = item.icon;
          item.icon = found.filename;
          fixed++;
          
          const folderMismatch = found.folder !== expectedFolder;
          const folderNote = folderMismatch 
            ? ` (⚠️ in ${found.folder} folder, expected ${expectedFolder})`
            : ` (✓ in correct ${found.folder} folder)`;
          
          console.log(`✓ Fixed: ${item.key} → icon: ${found.filename}${folderNote}`);
          
          if (folderMismatch) {
            issues.push({
              key: item.key,
              issue: `Icon "${found.filename}" found in ${found.folder} folder but item rarity is ${item.rarity} (expects ${expectedFolder})`
            });
          }
        }
      } else {
        // Try fuzzy matching as last resort
        let fuzzyMatch: { folder: string; filename: string; fullPath: string } | undefined;
        for (const [imgKey, info] of imageMap.entries()) {
          const imgKeyNorm = normalize(imgKey);
          if (imgKeyNorm === itemKeyNorm || imgKeyNorm === iconKeyNorm ||
              imgKeyNorm.includes(itemKeyNorm) || itemKeyNorm.includes(imgKeyNorm)) {
            fuzzyMatch = info;
            break;
          }
        }
        
        if (fuzzyMatch) {
          const fuzzyIconPath = path.join(ASSETS_DIR, fuzzyMatch.folder, `${fuzzyMatch.filename}.png`);
          const fuzzyIconExists = await fileExists(fuzzyIconPath);
          
          if (fuzzyIconExists) {
            item.icon = fuzzyMatch.filename;
            fixed++;
            const folderMismatch = fuzzyMatch.folder !== expectedFolder;
            console.log(`✓ Fixed (fuzzy): ${item.key} → icon: ${fuzzyMatch.filename} (in ${fuzzyMatch.folder} folder)`);
          } else {
            notFound++;
            issues.push({
              key: item.key,
              issue: `No image found for icon "${item.icon}" in ${expectedFolder} folder`
            });
            console.warn(`⚠️  No image found: ${item.key} (icon: ${item.icon}, rarity: ${item.rarity}, expected: ${expectedFolder}/${item.icon}.png)`);
          }
        } else {
          notFound++;
          issues.push({
            key: item.key,
            issue: `No image found for icon "${item.icon}" in ${expectedFolder} folder`
          });
          console.warn(`⚠️  No image found: ${item.key} (icon: ${item.icon}, rarity: ${item.rarity}, expected: ${expectedFolder}/${item.icon}.png)`);
        }
      }
    }
    
    // Save updated items
    await fs.writeFile(ITEMS_FILE, JSON.stringify(itemsData, null, 2), 'utf-8');
    
    console.log('\n📊 Summary:');
    console.log(`✅ Correct: ${correct} items`);
    console.log(`🔧 Fixed: ${fixed} items`);
    console.log(`⚠️  Not found: ${notFound} items`);
    console.log(`📝 Updated items.json`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      issues.forEach(({ key, issue }) => {
        console.log(`  - ${key}: ${issue}`);
      });
    }
    
    return { correct, fixed, notFound, issues };
  } catch (error: any) {
    console.error('❌ Error validating items:', error);
    throw error;
  }
}

async function validateRecipes() {
  try {
    console.log('\n🔍 Validating recipes.json...');
    const recipesData = JSON.parse(await fs.readFile(RECIPES_FILE, 'utf-8'));
    const recipes = recipesData.recipes || [];
    
    const itemsData = JSON.parse(await fs.readFile(ITEMS_FILE, 'utf-8'));
    const items: ItemDefinition[] = itemsData.items || [];
    
    // Create item lookup map
    const itemsMap = new Map<string, ItemDefinition>();
    for (const item of items) {
      itemsMap.set(normalizeKey(item.key), item);
      itemsMap.set(item.key, item); // Also store original key
    }
    
    let recipeIssues = 0;
    
    for (const recipe of recipes) {
      const input1Key = normalizeKey(recipe.input1);
      const input2Key = normalizeKey(recipe.input2);
      const outputKey = normalizeKey(recipe.outputKey);
      
      const input1Item = itemsMap.get(input1Key) || itemsMap.get(recipe.input1);
      const input2Item = itemsMap.get(input2Key) || itemsMap.get(recipe.input2);
      const outputItem = itemsMap.get(outputKey) || itemsMap.get(recipe.outputKey);
      
      if (!input1Item) {
        console.warn(`⚠️  Recipe input1 "${recipe.input1}" not found in items`);
        recipeIssues++;
      }
      if (!input2Item) {
        console.warn(`⚠️  Recipe input2 "${recipe.input2}" not found in items`);
        recipeIssues++;
      }
      if (!outputItem) {
        console.warn(`⚠️  Recipe output "${recipe.outputKey}" not found in items`);
        recipeIssues++;
      }
    }
    
    if (recipeIssues === 0) {
      console.log(`✅ All ${recipes.length} recipes reference valid items`);
    } else {
      console.log(`⚠️  Found ${recipeIssues} recipe issues`);
    }
    
    return { recipeIssues };
  } catch (error: any) {
    console.error('❌ Error validating recipes:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting icon validation and fix...\n');
    
    const itemsResult = await validateAndFixItems();
    const recipesResult = await validateRecipes();
    
    console.log('\n✅ Validation complete!');
    
    if (itemsResult.notFound > 0 || itemsResult.issues.length > 0 || recipesResult.recipeIssues > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateAndFixItems, validateRecipes };

import * as fs from 'fs/promises';
import * as path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');
const RECIPES_FILE = path.join(ASSETS_DIR, 'recipes.json');

async function updateRecipesFromItems() {
  try {
    // Load items
    const itemsData = JSON.parse(await fs.readFile(ITEMS_FILE, 'utf-8'));
    const items = itemsData.items || [];
    const itemKeys = new Set(items.map((item: any) => item.key.toLowerCase()));
    
    // Load current recipes
    const recipesData = JSON.parse(await fs.readFile(RECIPES_FILE, 'utf-8'));
    const recipes = recipesData.recipes || [];
    
    console.log(`Found ${items.length} items and ${recipes.length} recipes`);
    
    // Find available items for recipes
    const barterItems = items
      .filter((item: any) => item.rarity === 'barter' || item.barter)
      .map((item: any) => item.key);
    
    const rareItems = items
      .filter((item: any) => item.rarity === 'rare')
      .map((item: any) => item.key);
    
    const legendaryItems = items
      .filter((item: any) => item.rarity === 'legendary')
      .map((item: any) => item.key);
    
    // Update recipes to use existing items
    const updatedRecipes = recipes.map((recipe: any) => {
      // Check if recipe items exist
      const input1Exists = itemKeys.has(recipe.input1?.toLowerCase());
      const input2Exists = itemKeys.has(recipe.input2?.toLowerCase());
      const outputExists = itemKeys.has(recipe.outputKey?.toLowerCase());
      
      if (!input1Exists || !input2Exists || !outputExists) {
        console.warn(`⚠️  Recipe has missing items:`, {
          input1: recipe.input1,
          input1Exists,
          input2: recipe.input2,
          input2Exists,
          output: recipe.outputKey,
          outputExists,
        });
      }
      
      return recipe;
    });
    
    // Filter out recipes with missing items
    const validRecipes = updatedRecipes.filter((recipe: any) => {
      const input1Exists = itemKeys.has(recipe.input1?.toLowerCase());
      const input2Exists = itemKeys.has(recipe.input2?.toLowerCase());
      const outputExists = itemKeys.has(recipe.outputKey?.toLowerCase());
      return input1Exists && input2Exists && outputExists;
    });
    
    if (validRecipes.length < updatedRecipes.length) {
      console.log(`⚠️  Filtered out ${updatedRecipes.length - validRecipes.length} recipes with missing items`);
    }
    
    // Save updated recipes
    await fs.writeFile(RECIPES_FILE, JSON.stringify({ recipes: validRecipes }, null, 2), 'utf-8');
    
    console.log(`✅ Updated recipes.json with ${validRecipes.length} valid recipes`);
    console.log(`📦 Available items: ${barterItems.length} barter, ${rareItems.length} rare, ${legendaryItems.length} legendary`);
  } catch (error: any) {
    console.error('Error updating recipes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateRecipesFromItems()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { updateRecipesFromItems };



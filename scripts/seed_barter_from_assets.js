const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(process.cwd(), 'assets', 'recipes.json');
const BARTER_RESULT_LIST = path.join(process.cwd(), 'assets', 'barter result', 'files.txt');

function titleCaseFromKey(key) {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function loadRecipes() {
  const raw = JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
  const list = Array.isArray(raw.recipes) ? raw.recipes : [];
  return list.map((recipe) => {
    const input1 = String(recipe.input1 || '').trim();
    const input2 = String(recipe.input2 || '').trim();
    const outputKey = String(recipe.outputKey || '').trim();
    const inputs = [input1, input2].sort();
    return {
      inputs,
      key: `${inputs[0]}+${inputs[1]}`,
      outputKey,
      description: recipe.description ? String(recipe.description) : '',
    };
  }).filter((recipe) => recipe.inputs[0] && recipe.inputs[1] && recipe.outputKey);
}

function loadBarterTypes() {
  const lines = fs.readFileSync(BARTER_RESULT_LIST, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().endsWith('files.txt'));

  return lines.map((file) => {
    const key = file.replace(/\.png$/i, '');
    return {
      key,
      name: titleCaseFromKey(key),
      icon: key,
      rarity: 'common',
      points: 0,
      source: 'seed',
      enabled: true,
    };
  });
}

print('🔄 Seeding barter recipes and barter types from assets...');

const recipeIndexes = db.barterrecipes.getIndexes();
if (recipeIndexes.some((idx) => idx.name === 'inputs_1')) {
  db.barterrecipes.dropIndex('inputs_1');
}
if (recipeIndexes.some((idx) => idx.name === 'key_1')) {
  db.barterrecipes.dropIndex('key_1');
}

db.barterrecipes.deleteMany({});
db.barterrecipes.createIndex({ key: 1 }, { unique: true });

const recipes = loadRecipes();
const recipeResult = recipes.length
  ? db.barterrecipes.insertMany(recipes, { ordered: false })
  : { insertedIds: {} };

const barterTypes = loadBarterTypes();
db.bartertypes.createIndex({ key: 1 }, { unique: true });
const barterTypeOps = barterTypes.map((type) => ({
  updateOne: {
    filter: { key: type.key },
    update: { $set: type },
    upsert: true,
  },
}));

const barterTypeResult = barterTypeOps.length
  ? db.bartertypes.bulkWrite(barterTypeOps)
  : { insertedCount: 0, modifiedCount: 0 };

print(`✅ Recipes inserted: ${recipes.length}`);
print(`✅ Barter types upserted: ${barterTypes.length}`);
printjson({
  recipeWrite: recipeResult,
  barterTypeWrite: barterTypeResult,
});

import { BarterRecipe, BarterType } from '../barter/barter.model';
import { Item } from '../item/item.model';

interface ItemDefinition {
  key: string;
  title: string;
  titleEn?: string;
  rarity: string;
  icon?: string;
}

interface Recipe {
  input1: string;
  input2: string;
  outputKey: string;
  description?: string;
  // Enriched fields
  input1Item?: ItemDefinition;
  input2Item?: ItemDefinition;
  outputItem?: ItemDefinition;
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

export async function enrichRecipesWithItems(): Promise<Recipe[]> {
  const [recipes, items, types] = await Promise.all([
    BarterRecipe.find({}).lean(),
    Item.find({}).lean(),
    BarterType.find({}).lean(),
  ]);

  const itemsMap = new Map(items.map((item) => [item.key, item]));
  const typesMap = new Map(types.map((type) => [type.key, type]));

  console.log(`[RecipesService] Enriching ${recipes.length} recipes with ${items.length} items and ${types.length} barter types`);

  const enriched = recipes.map((recipe) => {
    const input1 = recipe.inputs?.[0];
    const input2 = recipe.inputs?.[1];
    const input1Item = input1 ? itemsMap.get(input1) : undefined;
    const input2Item = input2 ? itemsMap.get(input2) : undefined;
    const outputItem = typesMap.get(recipe.outputKey) || itemsMap.get(recipe.outputKey);

    return {
      input1: input1 ?? '',
      input2: input2 ?? '',
      outputKey: recipe.outputKey,
      description: (recipe as any).description,
      input1Item: input1Item && {
        key: input1Item.key,
        title: input1Item.title,
        titleEn: input1Item.titleEn,
        rarity: input1Item.rarity,
        icon: input1Item.icon || input1Item.key,
      },
      input2Item: input2Item && {
        key: input2Item.key,
        title: input2Item.title,
        titleEn: input2Item.titleEn,
        rarity: input2Item.rarity,
        icon: input2Item.icon || input2Item.key,
      },
      outputItem: outputItem && {
        key: outputItem.key,
        title: 'name' in outputItem ? outputItem.name : outputItem.title,
        titleEn: 'name' in outputItem ? outputItem.name : outputItem.titleEn,
        rarity: outputItem.rarity,
        icon: outputItem.icon || outputItem.key,
      },
      input1ImagePath: input1Item
        ? (input1Item.imageUrl || `/assets/${getRarityFolder(input1Item.rarity)}/${input1Item.icon || input1Item.key}.png`)
        : null,
      input2ImagePath: input2Item
        ? (input2Item.imageUrl || `/assets/${getRarityFolder(input2Item.rarity)}/${input2Item.icon || input2Item.key}.png`)
        : null,
      outputImagePath: outputItem
        ? (('imageUrl' in outputItem && outputItem.imageUrl) || `/assets/barter%20result/${outputItem.icon || outputItem.key}.png`)
        : null,
    };
  });

  console.log(`[RecipesService] ✅ Enriched ${enriched.length} recipes`);
  return enriched;
}

export async function loadRecipes(): Promise<Recipe[]> {
  const recipes = await BarterRecipe.find({}).lean();
  return recipes.map((recipe) => ({
    input1: recipe.inputs?.[0] ?? '',
    input2: recipe.inputs?.[1] ?? '',
    outputKey: recipe.outputKey,
    description: (recipe as any).description,
  }));
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const ops = recipes.map((recipe) => {
    const inputs = [recipe.input1, recipe.input2].sort();
    return {
      updateOne: {
        filter: { key: inputs.join('+') },
        update: {
          $set: {
            inputs,
            key: inputs.join('+'),
            outputKey: recipe.outputKey,
            description: recipe.description ?? '',
          },
        },
        upsert: true,
      },
    };
  });
  if (ops.length) {
    await BarterRecipe.bulkWrite(ops);
  }
}

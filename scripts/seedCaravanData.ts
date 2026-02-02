import 'dotenv/config';
import mongoose from 'mongoose';
import { baseRarity, caravanContent, isBarterItem } from '../src/data/caravanContent';
import { DropTemplate } from '../src/modules/schedule/schedule.model';
import { BarterType, BarterRecipe } from '../src/modules/barter/barter.model';

async function seedCaravanData() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
  await mongoose.connect(mongoUri);
  console.log('[seed] Connected to MongoDB');

  const templateKey = process.env.CARAVAN_TEMPLATE_KEY || 'caravan_master';
  const templateName = process.env.CARAVAN_TEMPLATE_NAME || 'Caravan Master Template';

  const templateItems = caravanContent.drops
    .filter((item) => item.rarity !== 'barter_result')
    .map((item) => {
    const barter = isBarterItem(item);
    const normalizedRarity = baseRarity(item.rarity) ?? item.rarity;
    return {
      key: item.key,
      title: item.title_ar,
      description: item.description_ar,
      priceDinar: item.priceDinar,
      givesPoints: item.givesPoints,
      barter,
      stock: item.stock,
      maxPerUser: item.maxPerUser ?? undefined,
      rarity: normalizedRarity,
      visualId: item.icon,
    };
  });

  await DropTemplate.updateOne(
    { key: templateKey },
    {
      $set: {
        name: templateName,
        items: templateItems,
        active: true,
      },
      $setOnInsert: { key: templateKey },
    },
    { upsert: true }
  );
  console.log(`[seed] Upserted DropTemplate "${templateKey}" with ${templateItems.length} items.`);

  if (caravanContent.barterTypes.length) {
    await BarterType.bulkWrite(
      caravanContent.barterTypes.map((bt) => ({
        updateOne: {
          filter: { key: bt.key },
          update: {
            $set: {
              name: bt.title_ar,
              icon: bt.icon,
              rarity: bt.rarity,
              points: bt.points,
              source: bt.source,
              enabled: true,
            },
          },
          upsert: true,
        },
      }))
    );
    console.log(`[seed] Upserted ${caravanContent.barterTypes.length} barter types.`);
  }

  if (caravanContent.recipes.length) {
    await BarterRecipe.bulkWrite(
      caravanContent.recipes.map((recipe) => {
        const inputs = [...recipe.inputs].sort() as [string, string];
        return {
          updateOne: {
            filter: { inputs, outputKey: recipe.outputKey },
            update: { $set: { inputs, outputKey: recipe.outputKey } },
            upsert: true,
          },
        };
      })
    );
    console.log(`[seed] Upserted ${caravanContent.recipes.length} barter recipes.`);
  }

  await mongoose.disconnect();
  console.log('[seed] Done.');
}

seedCaravanData().catch((err) => {
  console.error('[seed] Failed', err);
  process.exit(1);
});

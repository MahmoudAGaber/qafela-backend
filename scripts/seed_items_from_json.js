const fs = require('fs');
const path = require('path');

const ITEMS_FILE = path.join(process.cwd(), 'assets', 'items.json');

const data = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
const items = Array.isArray(data.items) ? data.items : [];

let upserted = 0;
let updated = 0;

for (const item of items) {
  const doc = { ...item };
  if (doc.enabled === undefined) doc.enabled = true;
  const res = db.items.updateOne(
    { key: doc.key },
    { $set: doc },
    { upsert: true }
  );
  if (res.upsertedCount > 0) {
    upserted += 1;
  } else if (res.modifiedCount > 0) {
    updated += 1;
  }
}

print(`✅ Upserted: ${upserted}, Updated: ${updated}, Total: ${items.length}`);

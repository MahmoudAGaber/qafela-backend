const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const ITEMS_FILE = path.join(ASSETS_DIR, 'items.json');
const BARTER_RESULT_LIST = path.join(ASSETS_DIR, 'barter result', 'files.txt');

function titleCaseFromKey(key) {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
const items = Array.isArray(itemsData.items) ? itemsData.items : [];
const existing = new Set(items.map((item) => item.key));

const files = fs.readFileSync(BARTER_RESULT_LIST, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !line.toLowerCase().endsWith('files.txt'));

let added = 0;
for (const file of files) {
  const key = file.replace(/\.png$/i, '');
  if (existing.has(key)) continue;
  const title = titleCaseFromKey(key);
  items.push({
    key,
    title,
    titleEn: title,
    description: '',
    descriptionEn: '',
    rarity: 'barter_result',
    priceDinar: 0,
    givesPoints: 0,
    givesXp: 0,
    requiredLevel: 1,
    type: 'barter_result',
    barter: false,
    stock: 0,
    maxPerUser: 0,
    icon: key,
    enabled: true,
  });
  existing.add(key);
  added += 1;
}

itemsData.items = items;
fs.writeFileSync(ITEMS_FILE, JSON.stringify(itemsData, null, 2), 'utf8');

console.log(`✅ Added ${added} barter_result items to items.json`);

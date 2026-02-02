# How to Check MongoDB Database

## Connection Information

Based on your `.env` file:
- **Host**: `localhost:27017`
- **Database**: `qafela_dev`
- **Connection String**: `mongodb://localhost:27017/qafela_dev`

From code default (if MONGO_URI not set):
- **Host**: `127.0.0.1:27017`
- **Database**: `qafela`
- **Connection String**: `mongodb://127.0.0.1:27017/qafela`

## Method 1: MongoDB Shell (mongosh) - Command Line

### Connect to Database
```bash
# Connect to qafela_dev database (from .env)
mongosh mongodb://localhost:27017/qafela_dev

# OR connect to qafela database (default from code)
mongosh mongodb://127.0.0.1:27017/qafela

# OR just connect and switch database
mongosh
use qafela_dev  # or use qafela
```

### Useful Commands

```javascript
// List all databases
show dbs

// Switch to database
use qafela_dev  // or use qafela

// List all collections
show collections

// Count documents in a collection
db.items.countDocuments()
db.drops.countDocuments()
db.caravanschedules.countDocuments()
db.qafalatemplates.countDocuments()

// Find all items (limit to 5)
db.items.find().limit(5).pretty()

// Find a specific item
db.items.findOne({ key: "brown_horse" })

// Find all drops for today
db.drops.find().limit(5).pretty()

// Find qafala schedules
db.caravanschedules.find().limit(5).pretty()

// Find qafala templates
db.qafalatemplates.find().pretty()

// Find drops with specific item
db.drops.find({ "items.key": "brown_horse" }).pretty()

// Find drop by ID
db.drops.findOne({ _id: ObjectId("YOUR_ID_HERE") })

// Update an item (example)
db.items.updateOne(
  { key: "brown_horse" },
  { $set: { imageUrl: "/assets/rar/brown_horse.png" } }
)

// Check item structure
db.items.findOne({ key: "brown_horse" }, { imageUrl: 1, icon: 1, key: 1, rarity: 1 })
```

### Check Qafala Items (Your Current Issue)

```javascript
// Connect first
use qafela_dev  // or use qafela

// Find all drops
db.drops.find().limit(10).pretty()

// Find a specific drop and check its items
db.drops.findOne({ _id: ObjectId("YOUR_DROP_ID") })

// Find drops with items missing imageUrl
db.drops.find({
  items: {
    $elemMatch: {
      imageUrl: { $exists: false }
    }
  }
}).pretty()

// Find items in drops that have imageUrl
db.drops.aggregate([
  { $unwind: "$items" },
  { $match: { "items.imageUrl": { $exists: true } } },
  { $project: { "items.key": 1, "items.imageUrl": 1, "items.title": 1 } },
  { $limit: 10 }
])
```

## Method 2: MongoDB Compass (GUI) - Visual Interface

If you have MongoDB Compass installed:

1. **Download MongoDB Compass** (if not installed):
   - Visit: https://www.mongodb.com/try/download/compass
   - Or install via Homebrew: `brew install --cask mongodb-compass`

2. **Connect**:
   - Connection String: `mongodb://localhost:27017`
   - Or: `mongodb://127.0.0.1:27017`

3. **Navigate**:
   - Select database: `qafela_dev` or `qafela`
   - Browse collections: `items`, `drops`, `caravanschedules`, `qafalatemplates`

## Method 3: Quick Check via Node.js Script

Create a quick script to check:

```bash
cd qafela-backend
node -e "
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
mongoose.connect(MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  const items = await db.collection('items').findOne({ key: 'brown_horse' });
  console.log('Brown Horse Item:', JSON.stringify(items, null, 2));
  process.exit(0);
});
"
```

## Common Collections in Your Database

- **items** - Item definitions
- **drops** - Drop/Qafala sessions with items
- **caravanschedules** - Schedule entries linking dates/slots to drops
- **qafalatemplates** - Qafala templates (morning, afternoon, night, random)
- **users** - User accounts
- **inventories** - User inventories
- **wallet** - Wallet transactions

## Troubleshooting

If connection fails:
1. Make sure MongoDB is running: `brew services list | grep mongodb`
2. Start MongoDB: `brew services start mongodb-community`
3. Check if MongoDB is listening on port 27017: `lsof -i :27017`


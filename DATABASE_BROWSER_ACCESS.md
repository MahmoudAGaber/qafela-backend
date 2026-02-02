# Access MongoDB in Browser/Desktop GUI

Mongo-express has compatibility issues with newer Node.js versions. Here are better alternatives:

## Option 1: MongoDB Compass (Recommended - Official GUI)

**MongoDB Compass** is the official MongoDB GUI tool - much better than mongo-express!

### Install

**macOS (Homebrew):**
```bash
brew install --cask mongodb-compass
```

**Or Download:**
- Visit: https://www.mongodb.com/try/download/compass
- Download and install

### Connect

1. **Open MongoDB Compass**
2. **Connection String:**
   ```
   mongodb://localhost:27017
   ```
3. **Click "Connect"**

4. **Select Database:**
   - `qafela_dev` (from your .env)
   - Or `qafela` (default)

5. **Browse Collections:**
   - `items`
   - `drops`
   - `caravanschedules`
   - `qafalatemplates`
   - `users`
   - etc.

### Features

✅ Beautiful, intuitive interface  
✅ View/edit documents easily  
✅ Search and filter  
✅ Index management  
✅ Schema analysis  
✅ Query builder  
✅ Performance monitoring  
✅ No installation issues!

---

## Option 2: mongosh (Command Line - Already Installed)

You already have `mongosh` installed. Use it for quick checks:

```bash
# Connect
mongosh mongodb://localhost:27017/qafela_dev
# or
mongosh mongodb://127.0.0.1:27017/qafela

# Then use commands:
show collections
db.items.find().pretty()
db.drops.find().limit(5).pretty()
```

---

## Option 3: Online Tools (If using MongoDB Atlas)

If you migrate to MongoDB Atlas (cloud):
- **MongoDB Atlas UI** - Built-in web interface
- **Studio 3T** - Professional GUI
- **NoSQLBooster** - Cross-platform GUI

---

## Quick Start with MongoDB Compass

1. **Install:**
   ```bash
   brew install --cask mongodb-compass
   ```

2. **Open Compass** (from Applications)

3. **Paste connection string:**
   ```
   mongodb://localhost:27017
   ```

4. **Click Connect**

5. **Select database:**
   - `qafela_dev` or `qafela`

6. **Browse your collections!**

---

## Why MongoDB Compass is Better

- ✅ Official MongoDB tool
- ✅ Modern, intuitive UI
- ✅ Works with all Node.js versions
- ✅ More features (schema analysis, indexes, etc.)
- ✅ Better performance
- ✅ Regular updates
- ✅ No installation issues

---

## Troubleshooting

### MongoDB Compass Can't Connect

1. **Check MongoDB is running:**
   ```bash
   brew services list | grep mongodb
   ```

2. **Start MongoDB if needed:**
   ```bash
   brew services start mongodb-community
   ```

3. **Try connection string:**
   ```
   mongodb://127.0.0.1:27017
   ```

### Still Prefer Browser-Based?

If you really need a browser-based tool:
- **Use MongoDB Atlas** (cloud) - has built-in web UI
- **Or use a simple Node.js script** to view data (we can create one)

But **MongoDB Compass is the best option** - it's free, official, and works perfectly!


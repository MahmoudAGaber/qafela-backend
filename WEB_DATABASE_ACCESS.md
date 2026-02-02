# Access MongoDB in Browser - Web Interface

## Option 1: Mongo Express (Recommended - Already Installed!)

Mongo Express is a web-based MongoDB admin interface that you can access via browser.

### Quick Start

```bash
cd qafela-backend

# Start mongo-express (runs on port 8081)
./start-mongo-express.sh
```

Or run directly:

```bash
# Set connection (from your .env)
export ME_CONFIG_MONGODB_URL="mongodb://localhost:27017"
export ME_CONFIG_MONGODB_SERVER=localhost
export ME_CONFIG_BASICAUTH_USERNAME=admin
export ME_CONFIG_BASICAUTH_PASSWORD=pass

# Start mongo-express
mongo-express
```

### Access in Browser

Open your browser and go to:
**http://localhost:8081**

Login credentials:
- **Username**: `admin`
- **Password**: `pass`

### Select Database

Once logged in:
1. Click on your database name (`qafela_dev` or `qafela`)
2. Browse collections: `items`, `drops`, `caravanschedules`, `qafalatemplates`
3. Click on any collection to view/edit data

### What You Can Do

- ✅ View all collections
- ✅ Browse documents
- ✅ Search/filter documents
- ✅ Edit documents (click on document, edit JSON, save)
- ✅ Add new documents
- ✅ Delete documents
- ✅ View database stats

---

## Option 2: Using Docker (Alternative)

If you prefer Docker:

```bash
docker run -it --rm \
  --network host \
  -e ME_CONFIG_MONGODB_URL=mongodb://localhost:27017 \
  -e ME_CONFIG_BASICAUTH_USERNAME=admin \
  -e ME_CONFIG_BASICAUTH_PASSWORD=pass \
  mongo-express
```

Then access: **http://localhost:8081**

---

## Option 3: MongoDB Compass (Desktop App, Not Browser)

For a more powerful desktop application (not browser-based):

```bash
# Install via Homebrew (macOS)
brew install --cask mongodb-compass

# Or download from: https://www.mongodb.com/try/download/compass
```

Connection String: `mongodb://localhost:27017`

---

## Troubleshooting

### Port 8081 Already in Use

If port 8081 is taken, use a different port:

```bash
export ME_CONFIG_SITE_BASE_URL=/mongo-express
export ME_CONFIG_SITE_PORT=8082
mongo-express
```

Then access: **http://localhost:8082**

### Can't Connect to MongoDB

1. Make sure MongoDB is running:
   ```bash
   brew services list | grep mongodb
   # Or
   docker ps | grep mongodb
   ```

2. Start MongoDB if needed:
   ```bash
   brew services start mongodb-community
   # Or
   docker start qafela-mongodb
   ```

3. Check connection:
   ```bash
   mongosh mongodb://localhost:27017
   ```

### Connection Refused

Make sure your MongoDB connection URL matches:
- From `.env`: `mongodb://localhost:27017` (database: `qafela_dev`)
- Or default: `mongodb://127.0.0.1:27017` (database: `qafela`)

---

## Quick Reference

**Start mongo-express:**
```bash
cd qafela-backend
./start-mongo-express.sh
```

**Browser URL:**
```
http://localhost:8081
```

**Login:**
- Username: `admin`
- Password: `pass`

**Check Your Data:**
1. Select database: `qafela_dev` or `qafela`
2. Click collection: `items`, `drops`, etc.
3. Click any document to view/edit


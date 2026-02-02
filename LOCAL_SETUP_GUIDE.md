# Local Setup Guide - Qafela Backend & Database

Complete guide to run the Qafela backend and MongoDB database locally on your machine.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (Version 16+ recommended)
   ```bash
   node --version  # Should show v16.x.x or higher
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **MongoDB** - Choose one of the installation methods below

## Step 1: Install MongoDB

### Option A: Using Homebrew (macOS)

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
brew services list | grep mongodb-community
```

### Option B: Using Docker (Recommended - Works on all platforms)

```bash
# Run MongoDB in a Docker container
docker run -d \
  --name qafela-mongodb \
  -p 27017:27017 \
  -v qafela-mongodb-data:/data/db \
  mongo:latest

# Verify it's running
docker ps | grep qafela-mongodb
```

To stop MongoDB:
```bash
docker stop qafela-mongodb
```

To start it again:
```bash
docker start qafela-mongodb
```

### Option C: Manual Installation

Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

Then start it:
```bash
# macOS/Linux
mongod --dbpath /path/to/data/db

# Windows
mongod.exe --dbpath C:\path\to\data\db
```

## Step 2: Verify MongoDB is Running

```bash
# Test connection using MongoDB shell
mongosh mongodb://127.0.0.1:27017

# Or using legacy mongo client
mongo mongodb://127.0.0.1:27017
```

If connected successfully, you should see a MongoDB prompt. Type `exit` to quit.

## Step 3: Navigate to Backend Directory

```bash
cd qafela-backend
```

## Step 4: Install Backend Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

## Step 5: Create Environment File

Create a `.env` file in the `qafela-backend` directory:

```bash
# Create .env file
touch .env
```

Add the following content to `.env`:

```env
# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/qafela

# JWT Secrets (Change these to secure random strings in production!)
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production

# Server Configuration
PORT=4000
TZ=Africa/Cairo

# CORS Configuration (optional - for development)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Admin Secret (optional)
ADMIN_SECRET=your_admin_secret_here
```

**Important**: 
- Replace the JWT secrets with random secure strings for production
- The default `MONGO_URI` connects to MongoDB running on `localhost:27017` with database name `qafela`
- Port `4000` is the default backend port

## Step 6: Start the Backend Server

### Development Mode (with hot reload)

```bash
npm run dev
```

This starts the server with `ts-node-dev` which automatically restarts on file changes.

### Production Mode

First build the TypeScript code:
```bash
npm run build
```

Then start the server:
```bash
npm start
```

## Step 7: Verify Everything is Working

You should see output like this:

```
✅ Qafela backend running on port 4000
🌍 Health: http://localhost:4000/health
🟢 MongoDB connected at mongodb://127.0.0.1:27017/qafela
✅ Levels initialized successfully
```

### Test Health Endpoints

```bash
# Health check
curl http://localhost:4000/health
# Should return: ok

# Readiness check (MongoDB connection)
curl http://localhost:4000/ready
# Should return: ready
```

## Step 8: Test the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:4000/api/users/register \
  -F "username=testuser" \
  -F "fullName=Test User" \
  -F "email=test@example.com" \
  -F "countryCode=+966" \
  -F "phoneNumber=501234567" \
  -F "password=Test123!"
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test123!"
  }'
```

### Using Postman

1. Import the collection: `qafela-backend/postman/qafela.postman_collection.json`
2. Set the base URL to: `http://localhost:4000`
3. Test the endpoints

## Verify Database

Connect to MongoDB and check if data was saved:

```bash
# Connect to MongoDB shell
mongosh mongodb://127.0.0.1:27017/qafela
```

Then run:
```javascript
// Switch to qafela database
use qafela

// List all users
db.users.find().pretty()

// Check specific user
db.users.findOne({ username: "testuser" })

// Check database stats
db.stats()
```

## Common Issues & Solutions

### MongoDB Not Connecting

**Error**: `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Docker
   docker ps | grep mongodb
   
   # Linux
   sudo systemctl status mongod
   ```

2. Start MongoDB if not running:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Docker
   docker start qafela-mongodb
   
   # Linux
   sudo systemctl start mongod
   ```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**: Either:
- Change the PORT in `.env` file to a different port (e.g., `PORT=4001`)
- Or stop the process using port 4000:
  ```bash
  # macOS/Linux
  lsof -ti:4000 | xargs kill -9
  ```

### Missing Environment Variables

**Error**: JWT errors or MongoDB connection failures

**Solution**: Make sure your `.env` file exists in `qafela-backend` directory and contains all required variables (especially `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)

### Module Not Found Errors

**Error**: `Cannot find module 'xxx'`

**Solution**: Reinstall dependencies:
```bash
cd qafela-backend
rm -rf node_modules package-lock.json
npm install
```

## Database Management

### View Collections

```javascript
// In MongoDB shell
use qafela
show collections
```

### Clear All Data (Use with caution!)

```javascript
// In MongoDB shell
use qafela
db.users.deleteMany({})
db.drops.deleteMany({})
// ... etc
```

### Backup Database

```bash
mongodump --uri="mongodb://127.0.0.1:27017/qafela" --out=./backup
```

### Restore Database

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/qafela" ./backup/qafela
```

## Next Steps

1. ✅ Backend is running on `http://localhost:4000`
2. ✅ MongoDB is connected and ready
3. ✅ Test registration and login endpoints
4. 🔄 Update your Flutter app's API base URL to `http://localhost:4000` (or your machine's IP for mobile testing)

## Additional Commands

### Seed Caravan Data

```bash
npm run seed:caravan
```

### View Server Logs

The server logs all requests to console. For production, logs are saved to `server.log`.

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/qafela` |
| `PORT` | Server port | `4000` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Required |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Required |
| `TZ` | Server timezone | `Africa/Cairo` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` |

## Support

For more information, see:
- `LOCAL_TESTING.md` - Detailed testing guide
- `DATABASE_CONNECTION_STATUS.md` - Database connection details
- `ARCHITECTURE.md` - Backend architecture overview



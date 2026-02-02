# Local Testing Guide - Qafela Backend

## Prerequisites

1. **MongoDB** - Make sure MongoDB is running locally
2. **Node.js** - Version 16+ recommended
3. **Environment Variables** - Set up `.env` file

## Database Connection

The authentication system is **fully connected to MongoDB**. The connection is configured in `src/index.ts`:

```typescript
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
```

### Default Database Settings:
- **Host**: `127.0.0.1:27017` (localhost)
- **Database Name**: `qafela`
- **Connection**: Automatic on server start

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Or run MongoDB directly
mongod --dbpath /path/to/data/db

# Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Create `.env` File
Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/qafela

# JWT Secrets
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Server
PORT=4000
TZ=Africa/Cairo

# CORS (optional)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Admin (optional)
ADMIN_SECRET=your_admin_secret
```

### 4. Start the Server
```bash
npm run dev
# or
npm start
```

You should see:
```
✅ Qafela backend running on port 4000
🟢 MongoDB connected at mongodb://127.0.0.1:27017/qafela
```

## Testing Authentication

### Using Postman

1. **Import Collection**: Import `postman/qafela.postman_collection.json`

2. **Test Register Endpoint**:
   - Method: `POST`
   - URL: `http://localhost:4000/api/users/register`
   - Body: `multipart/form-data`
     - `username`: testuser123
     - `fullName`: Test User
     - `email`: test@example.com
     - `countryCode`: +966
     - `phoneNumber`: 501234567
     - `password`: Test123!
     - `avatar`: (optional file)

3. **Test Login Endpoint**:
   - Method: `POST`
   - URL: `http://localhost:4000/api/users/login`
   - Body: `application/json`
     ```json
     {
       "usernameOrEmail": "testuser123",
       "password": "Test123!"
     }
     ```

4. **Test Get Current User**:
   - Method: `GET`
   - URL: `http://localhost:4000/api/users/me`
   - Headers: `Authorization: Bearer <access_token>`

### Using cURL

```bash
# Register
curl -X POST http://localhost:4000/api/users/register \
  -F "username=testuser" \
  -F "fullName=Test User" \
  -F "email=test@example.com" \
  -F "countryCode=+966" \
  -F "phoneNumber=501234567" \
  -F "password=Test123!"

# Login
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test123!"
  }'

# Get Current User
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

## Database Verification

### Check MongoDB Connection
```bash
# Connect to MongoDB shell
mongosh mongodb://127.0.0.1:27017/qafela

# Or
mongo mongodb://127.0.0.1:27017/qafela
```

### Verify User Creation
```javascript
// In MongoDB shell
use qafela
db.users.find().pretty()

// Check specific user
db.users.findOne({ username: "testuser" })
```

### Check Indexes
```javascript
db.users.getIndexes()
```

Expected indexes:
- `username` (unique)
- `email` (unique, sparse)
- `phoneNumber` (unique, sparse)

## Troubleshooting

### MongoDB Not Connecting
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. Check connection string in `.env`

3. Check MongoDB logs for errors

### Authentication Errors

**"INVALID_CREDENTIALS"**
- Check password is correct
- Verify user exists in database
- Check passwordHash is being fetched (should be automatic)

**"USERNAME_TAKEN" / "EMAIL_TAKEN" / "PHONE_TAKEN"**
- User already exists
- Try different username/email/phone

**"UNAUTHORIZED"**
- Token expired or invalid
- Check JWT_SECRET matches
- Try logging in again to get new token

### Database Schema Issues

If you get schema validation errors:
1. Check `src/modules/user/user.model.ts` for required fields
2. Ensure all required fields are provided in registration
3. Check unique indexes aren't conflicting

## Database Structure

### User Document Example
```json
{
  "_id": ObjectId("..."),
  "username": "testuser",
  "fullName": "Test User",
  "email": "test@example.com",
  "countryCode": "+966",
  "phoneNumber": "501234567",
  "avatarUrl": "/uploads/avatar_123.jpg",
  "passwordHash": "$2a$10$...",
  "points": 1000,
  "weeklyPoints": 0,
  "wallet": {
    "dinar": 1000,
    "usdMinor": 0,
    "txCount": 0
  },
  "level": 1,
  "xp": 0,
  "xpToNext": 100,
  "profile": {
    "avatarUrl": "/uploads/avatar_123.jpg",
    "bio": "",
    "bannerColor": "#F4C889"
  },
  "stats": {
    "dropsParticipated": 0,
    "itemsPurchased": 0,
    "barterTrades": 0,
    "rewardsClaimed": 0,
    "badgesEarned": 0
  },
  "createdAt": ISODate("2024-01-01T00:00:00.000Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00.000Z")
}
```

## Next Steps

After authentication is working:
1. Test wallet endpoints
2. Test drops/inventory
3. Test barter system
4. Test leaderboard
5. Test rewards system

## Health Checks

```bash
# Health check
curl http://localhost:4000/health

# Ready check (checks MongoDB connection)
curl http://localhost:4000/ready
```

Expected responses:
- `/health`: `ok`
- `/ready`: `ready` (if MongoDB connected) or `not-ready` (if not connected)




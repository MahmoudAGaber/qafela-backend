# Weekly Leaderboard System Implementation

## Overview

This document describes the complete weekly leaderboard system implementation with configurable winners, XP system, and withdrawal functionality.

## Features Implemented

### 1. Weekly Leaderboard System
- ✅ Weekly points tracking (`weeklyPoints` field in User model)
- ✅ Automatic weekly reset when season finalizes
- ✅ Configurable number of winners (default: 10, max: 200)
- ✅ Top players ranking based on weekly points
- ✅ Season tracking (ISO week format: `YYYY-W##`)

### 2. XP System
- ✅ XP calculation based on item's `givesXp` field
- ✅ Formula: `XP = item.givesXp * quantity`
- ✅ XP is awarded when purchasing items from drops
- ✅ XP contributes to user level progression

### 3. Points System
- ✅ Points awarded when purchasing items: `points = item.givesPoints * quantity`
- ✅ Points added to both `points` (lifetime) and `weeklyPoints` (resets weekly)
- ✅ Weekly points reset to 0 after season finalization

### 4. Winner Withdrawal System
- ✅ Winners can convert their `weeklyPoints` to dinars
- ✅ Configurable conversion rate (default: 1 point = 0.1 dinars)
- ✅ Withdrawal only available for winners
- ✅ Points reset to 0 after withdrawal
- ✅ Wallet transaction logging

### 5. Dashboard Configuration
- ✅ API endpoint to configure number of winners
- ✅ API endpoint to configure points-to-dinar conversion rate
- ✅ Admin-only endpoints (protected with `x-admin-key` header)

## API Endpoints

### Public Endpoints

#### GET `/api/leaderboard/weekly`
Get weekly leaderboard
- Query params: `limit` (optional, defaults to configured number of winners)
- Returns: Top players with rank, username, fullName, avatarUrl, points

#### GET `/api/leaderboard/weekly/me` (Auth required)
Get current user's weekly rank and points
- Returns: username, points, rank

#### GET `/api/leaderboard/season`
Get current season information
- Returns: seasonId, startAt, endAt, finalized status

#### POST `/api/leaderboard/withdraw` (Auth required)
Withdraw weekly points as dinars (winners only)
- Converts `weeklyPoints` to dinars based on conversion rate
- Resets `weeklyPoints` to 0
- Returns: pointsConverted, dinarsAdded, wallet balance

### Admin Endpoints (Requires `x-admin-key` header)

#### GET `/api/leaderboard/config`
Get leaderboard configuration
- Returns: numberOfWinners, pointsToDinarRate, active

#### POST `/api/leaderboard/config`
Update leaderboard configuration
- Body: `{ numberOfWinners?: number, pointsToDinarRate?: number, active?: boolean }`
- Validates: numberOfWinners (1-200), pointsToDinarRate (>= 0.01)

#### POST `/api/leaderboard/weekly/finalize`
Finalize current week and reset points
- Query params: `force` (optional, force finalization even if week not ended)
- Query params: `limit` (optional, override configured number of winners)
- Actions:
  1. Selects top N winners based on `weeklyPoints`
  2. Creates `WinnerPayout` records (if prize plan exists)
  3. Resets all users' `weeklyPoints` to 0
  4. Creates next week's season
  5. Marks current season as finalized

## Database Models

### LeaderboardConfig
```typescript
{
  key: 'weekly_leaderboard',
  numberOfWinners: number,      // Default: 10, Range: 1-200
  pointsToDinarRate: number,    // Default: 0.1 (1 point = 0.1 dinars)
  active: boolean
}
```

### Season
```typescript
{
  seasonId: string,              // Format: "YYYY-W##" (e.g., "2025-W03")
  startAt: Date,
  endAt: Date,
  finalized: boolean,
  winners: [{
    userId: ObjectId,
    username: string,
    points: number,
    rank: number
  }]
}
```

### User Model Updates
- `weeklyPoints`: Resets every week
- `points`: Lifetime points (never resets)
- `xp`: Experience points (increases with purchases)
- `level`: User level (based on XP)

### Drop Item Model Updates
- `givesPoints`: Points awarded per item
- `givesXp`: XP awarded per item (NEW)

## Purchase Flow

When a user purchases an item from a drop:

1. **Calculate costs and gains:**
   ```typescript
   cost = item.priceDinar * quantity
   pointsGain = item.givesPoints * quantity
   xpGain = item.givesXp * quantity  // NEW: Based on item's givesXp
   ```

2. **Update user:**
   - Deduct `cost` from `wallet.dinar`
   - Add `pointsGain` to `points` (lifetime)
   - Add `pointsGain` to `weeklyPoints` (weekly, resets)
   - Add `xpGain` to `xp` (if item has givesXp)

3. **Update inventory:**
   - Add item to user's inventory

4. **Log transaction:**
   - Create `PurchaseLog` entry
   - Create `WalletTx` entry

## Weekly Reset Flow

When a week ends (via `/api/leaderboard/weekly/finalize`):

1. **Select winners:**
   - Query users sorted by `weeklyPoints` DESC
   - Limit to configured `numberOfWinners`
   - Store winners in `Season.winners`

2. **Create payouts (if prize plan exists):**
   - Create `WinnerPayout` records for winners
   - Based on prize plan tiers

3. **Reset points:**
   - Set all users' `weeklyPoints` to 0

4. **Create next season:**
   - Create new `Season` for next week
   - Set `finalized: false`

## Winner Withdrawal Flow

When a winner calls `/api/leaderboard/withdraw`:

1. **Validate:**
   - Check if user is a winner in current or previous finalized season
   - Check if user has `weeklyPoints > 0`

2. **Calculate conversion:**
   ```typescript
   dinarsToAdd = weeklyPoints * pointsToDinarRate
   ```

3. **Update user:**
   - Add `dinarsToAdd` to `wallet.dinar`
   - Set `weeklyPoints` to 0

4. **Log transaction:**
   - Create `WalletTx` entry with type 'reward'

## Dashboard Integration

### API Client (qafela-dashboard/lib/api.ts)

```typescript
export const leaderboardApi = {
  getWeekly: (limit?: number) => api.get(`/api/leaderboard/weekly?limit=${limit}`),
  getConfig: () => api.get('/api/leaderboard/config'),
  updateConfig: (config) => api.post('/api/leaderboard/config', config),
  finalizeWeekly: (force?: boolean, limit?: number) => 
    api.post(`/api/leaderboard/weekly/finalize?force=${force}&limit=${limit}`),
  getSeason: () => api.get('/api/leaderboard/season'),
};
```

### Dashboard UI Components Needed

1. **Leaderboard Configuration Page:**
   - Input: Number of winners (1-200)
   - Input: Points to Dinar rate
   - Toggle: Active/Inactive
   - Save button

2. **Weekly Leaderboard View:**
   - Display top N players
   - Show current season info
   - Finalize button (admin only)

3. **Season Management:**
   - View current season
   - View finalized seasons
   - View winners list

## Mobile App Integration

### Flutter Endpoints

1. **Get Weekly Leaderboard:**
   - `GET /api/leaderboard/weekly`
   - Display top players with ranks

2. **Get User Rank:**
   - `GET /api/leaderboard/weekly/me`
   - Show user's current rank and points

3. **Withdraw Points (Winners):**
   - `POST /api/leaderboard/withdraw`
   - Convert weeklyPoints to dinars

### Flutter Models Needed

```dart
class LeaderboardEntry {
  final int rank;
  final String username;
  final String? fullName;
  final String? avatarUrl;
  final int points;
}

class LeaderboardResponse {
  final SeasonInfo season;
  final List<LeaderboardEntry> top;
  final int numberOfWinners;
}

class WithdrawalResponse {
  final int pointsConverted;
  final int dinarsAdded;
  final Wallet wallet;
}
```

## Configuration

### Environment Variables

No new environment variables needed. Configuration is stored in database (`LeaderboardConfig` collection).

### Default Values

- `numberOfWinners`: 10
- `pointsToDinarRate`: 0.1 (1 point = 0.1 dinars)

## Testing

### Test Scenarios

1. **Purchase Item:**
   - Verify points added to `weeklyPoints`
   - Verify XP added based on `item.givesXp * quantity`
   - Verify lifetime `points` also increased

2. **Weekly Finalization:**
   - Verify top N winners selected
   - Verify all `weeklyPoints` reset to 0
   - Verify next season created

3. **Winner Withdrawal:**
   - Verify only winners can withdraw
   - Verify correct conversion rate applied
   - Verify `weeklyPoints` reset after withdrawal
   - Verify dinars added to wallet

4. **Configuration:**
   - Verify admin can update number of winners
   - Verify admin can update conversion rate
   - Verify non-admin cannot access config endpoints

## Files Modified/Created

### Backend

**Created:**
- `src/modules/leaderboard/leaderboardConfig.model.ts` - Configuration model

**Modified:**
- `src/modules/leaderboard/leaderboard.routes.ts` - Added config and withdrawal endpoints
- `src/modules/leaderboard/leaderboard.service.ts` - Updated to use configurable winners
- `src/modules/drop/drop.routes.ts` - Updated XP calculation to use `item.givesXp * quantity`
- `src/modules/drop/drop.model.ts` - Added `givesXp` field to `IDropItem`

### Dashboard

**Modified:**
- `lib/api.ts` - Added `leaderboardApi` client

## Next Steps

1. **Dashboard UI:**
   - Create leaderboard configuration page
   - Create weekly leaderboard view
   - Add finalize button

2. **Mobile App:**
   - Integrate leaderboard API
   - Display weekly leaderboard
   - Add withdrawal button for winners
   - Show XP gain when purchasing items

3. **Cron Job (Optional):**
   - Automatically finalize weekly leaderboard at end of week
   - Can be added to `src/index.ts` using `node-cron`

## Notes

- Weekly points reset happens automatically when season is finalized
- Winners can withdraw their points even after week ends (if they were winners)
- XP is calculated per item purchase, not per point earned
- Conversion rate can be adjusted from dashboard without code changes


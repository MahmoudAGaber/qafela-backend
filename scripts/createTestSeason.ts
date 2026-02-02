import 'dotenv/config';
import mongoose from 'mongoose';
import { Season, getIsoWeekId, getWeekWindowUtc } from '../src/modules/leaderboard/season.model';
import { User } from '../src/modules/user/user.model';

async function createTestSeason() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/qafela';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get some users from the database
    const users = await User.find({}).limit(10).lean();
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Please create some users first.');
      await mongoose.disconnect();
      return;
    }

    console.log(`📊 Found ${users.length} users`);

    // Create a season for last week (7 days ago)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const seasonId = getIsoWeekId(lastWeek);
    const { start, end } = getWeekWindowUtc(lastWeek);

    // Check if season already exists
    let season = await Season.findOne({ seasonId });
    
    if (season) {
      console.log(`⚠️  Season ${seasonId} already exists. Updating it...`);
    } else {
      console.log(`📅 Creating season ${seasonId}...`);
      season = await Season.create({
        seasonId,
        startAt: start,
        endAt: end,
        finalized: true,
        winners: [],
      });
    }

    // Create winners from existing users
    // Assign some weekly points to users for testing
    const winners = users.slice(0, Math.min(5, users.length)).map((user, index) => {
      return {
        userId: user._id,
        username: user.username,
        points: 10000 - (index * 1000), // Decreasing points: 10000, 9000, 8000, etc.
        rank: index + 1,
      };
    });

    // Update season with winners
    season.finalized = true;
    (season as any).winners = winners;
    await season.save();

    console.log(`✅ Created/Updated season ${seasonId} with ${winners.length} winners:`);
    winners.forEach((winner, index) => {
      console.log(`   ${index + 1}. ${winner.username} - ${winner.points} points`);
    });

    // Also set some weekly points on users for current week testing
    console.log('\n📝 Setting weekly points for current week testing...');
    for (let i = 0; i < Math.min(users.length, 10); i++) {
      await User.updateOne(
        { _id: users[i]._id },
        { $set: { weeklyPoints: 5000 - (i * 200) } }
      );
    }
    console.log('✅ Set weekly points for current week');

    console.log('\n✅ Test data created successfully!');
    console.log(`\n📌 Last week season: ${seasonId}`);
    console.log(`   Start: ${start.toISOString()}`);
    console.log(`   End: ${end.toISOString()}`);
    console.log(`   Finalized: true`);
    console.log(`   Winners: ${winners.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createTestSeason();


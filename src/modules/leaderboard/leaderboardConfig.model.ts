import { Schema, model, Document } from 'mongoose';

export interface ILeaderboardConfig extends Document {
  key: string; // 'weekly_leaderboard'
  numberOfWinners: number; // Configurable number of winners (default: 10)
  pointsToDinarRate: number; // Conversion rate: 1 point = X dinars (default: 0.1)
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const configSchema = new Schema<ILeaderboardConfig>({
  key: { type: String, unique: true, index: true, required: true },
  numberOfWinners: { type: Number, default: 10, min: 1, max: 200 },
  pointsToDinarRate: { type: Number, default: 0.1, min: 0.01 }, // 1 point = 0.1 dinars
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const LeaderboardConfig = model<ILeaderboardConfig>('LeaderboardConfig', configSchema);

// Helper to get or create default config
export async function getLeaderboardConfig() {
  let config = await LeaderboardConfig.findOne({ key: 'weekly_leaderboard' });
  if (!config) {
    config = await LeaderboardConfig.create({
      key: 'weekly_leaderboard',
      numberOfWinners: 10,
      pointsToDinarRate: 0.1,
      active: true,
    });
  }
  return config;
}


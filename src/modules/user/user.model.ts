import { Schema, model, Document } from "mongoose";

interface Wallet {
  dinar: number;      // QD (in-game currency)
  usdMinor: number;   // Cash USD balance in cents
  txCount: number;
}

export interface ProfileInfo {
  avatarUrl?: string;
  bio?: string;
  bannerColor?: string;
}

export interface UserStats {
  dropsParticipated: number;
  itemsPurchased: number;
  barterTrades: number;
  rewardsClaimed: number;
  badgesEarned: number;
  lastLevelUp?: Date;
}

export interface IUser extends Document {
  username: string;
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  avatarUrl?: string;
  passwordHash?: string;
  points: number;         // lifetime points
  weeklyPoints: number;   // resets every season
  wallet: Wallet;
  level: number;
  xp: number;
  xpToNext: number;
  profile: ProfileInfo;
  stats: UserStats;
}

const walletSchema = new Schema<Wallet>(
  {
    dinar: { type: Number, default: 1000 },
    usdMinor: { type: Number, default: 0 },
    txCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const profileSchema = new Schema<ProfileInfo>(
  {
    avatarUrl: String,
    bio: { type: String, maxlength: 280 },
    bannerColor: { type: String, default: "#F4C889" },
  },
  { _id: false }
);

const statsSchema = new Schema<UserStats>(
  {
    dropsParticipated: { type: Number, default: 0 },
    itemsPurchased: { type: Number, default: 0 },
    barterTrades: { type: Number, default: 0 },
    rewardsClaimed: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    lastLevelUp: Date,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, index: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, index: true, required: true },
    countryCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    avatarUrl: { type: String },
    passwordHash: { type: String, select: false }, // Excluded by default, use select('+passwordHash') to include
    points: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    wallet: { type: walletSchema, default: () => ({}) },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    xpToNext: { type: Number, default: 100 },
    // Daily login streak
    lastLoginDate: Date, // Last date user logged in (YYYY-MM-DD format)
    loginStreak: { type: Number, default: 0 }, // Current streak count
    longestStreak: { type: Number, default: 0 }, // Longest streak achieved
    profile: { type: profileSchema, default: () => ({}) },
    stats: { type: statsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });

userSchema.pre("save", function (next) {
  const self = this as any;
  if (self.email && typeof self.email === "string") {
    self.email = self.email.toLowerCase();
  }
  next();
});

export const User = model<IUser>("User", userSchema);

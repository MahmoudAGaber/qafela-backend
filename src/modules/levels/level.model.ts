import { Schema, model, Document } from "mongoose";

export interface LevelReward {
  type: "badge" | "item" | "dinar" | "points";
  value: string; // badge key, item id, or amount
  name: string; // Display name
  icon?: string; // Icon URL or emoji
}

export interface ILevel extends Document {
  level: number;
  title: string; // Arabic title
  titleEn?: string; // English title
  description: string;
  xpRequired: number; // Total XP needed to reach this level
  badge: {
    key: string;
    name: string;
    icon: string; // Badge icon URL or emoji
  };
  rewards: LevelReward[];
  unlockFeatures?: string[]; // Features unlocked at this level (e.g., "premium_items", "special_drops")
  isActive: boolean;
}

const levelRewardSchema = new Schema<LevelReward>(
  {
    type: { type: String, enum: ["badge", "item", "dinar", "points"], required: true },
    value: { type: String, required: true },
    name: { type: String, required: true },
    icon: String,
  },
  { _id: false }
);

const badgeSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
  },
  { _id: false }
);

const levelSchema = new Schema<ILevel>(
  {
    level: { type: Number, unique: true, required: true, index: true },
    title: { type: String, required: true },
    titleEn: String,
    description: { type: String, required: true },
    xpRequired: { type: Number, required: true },
    badge: { type: badgeSchema, required: true },
    rewards: [levelRewardSchema],
    unlockFeatures: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Level = model<ILevel>("Level", levelSchema);




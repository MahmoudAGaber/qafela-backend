import { Schema, model, Document, Types } from "mongoose";

export type BadgeStatus = "locked" | "earned" | "claimed";

export interface IUserBadge extends Document {
  userId: Types.ObjectId;
  badgeKey: string;
  progress: number;
  target: number;
  status: BadgeStatus;
  earnedAt?: Date;
  claimedAt?: Date;
  meta?: Record<string, unknown>;
}

const userBadgeSchema = new Schema<IUserBadge>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    badgeKey: { type: String, required: true },
    progress: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    status: { type: String, enum: ["locked", "earned", "claimed"], default: "locked" },
    earnedAt: Date,
    claimedAt: Date,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

userBadgeSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

export const UserBadge = model<IUserBadge>("UserBadge", userBadgeSchema);


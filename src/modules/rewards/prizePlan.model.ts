import { Schema, model, Document } from 'mongoose';

export interface IPrizeTier {
  minRank: number;
  maxRank: number;
  amountMinor: number; // amount in minor units (e.g., piasters)
}

export interface IPrizePlan extends Document {
  key: string;
  currency: string; // e.g., EGP
  weeklyCapMinor: number;
  tiers: IPrizeTier[];
  active: boolean;
  activeFrom?: Date;
  activeTo?: Date;
  version?: number;
}

const tierSchema = new Schema<IPrizeTier>({
  minRank: { type: Number, required: true },
  maxRank: { type: Number, required: true },
  amountMinor: { type: Number, required: true },
}, { _id: false });

const prizePlanSchema = new Schema<IPrizePlan>({
  key: { type: String, unique: true, index: true },
  currency: { type: String, required: true },
  weeklyCapMinor: { type: Number, required: true },
  tiers: { type: [tierSchema], default: [] },
  active: { type: Boolean, default: true },
  activeFrom: Date,
  activeTo: Date,
  version: Number,
}, { timestamps: true });

export const PrizePlan = model<IPrizePlan>('PrizePlan', prizePlanSchema);


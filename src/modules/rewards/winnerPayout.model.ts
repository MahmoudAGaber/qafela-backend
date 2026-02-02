import { Schema, model, Types, Document } from 'mongoose';

export type PayoutStatus = 'available' | 'pending' | 'claimed' | 'failed';

export interface IWinnerPayout extends Document {
  userId: Types.ObjectId;
  seasonId: string;
  rank: number;
  amountMinor: number;
  currency: string;
  title: string;
  description?: string;
  status: PayoutStatus;
  createdAt: Date;
  claimedAt?: Date;
  paidAt?: Date;
  provider?: string;
  providerRef?: string;
  failureReason?: string;
}

const payoutSchema = new Schema<IWinnerPayout>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  seasonId: { type: String, required: true, index: true },
  rank: { type: Number, required: true },
  amountMinor: { type: Number, required: true },
  currency: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['available','pending','claimed','failed'], default: 'available', index: true },
  createdAt: { type: Date, default: Date.now },
  claimedAt: Date,
  paidAt: Date,
  provider: String,
  providerRef: String,
  failureReason: String,
}, { timestamps: false });

payoutSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const WinnerPayout = model<IWinnerPayout>('WinnerPayout', payoutSchema);


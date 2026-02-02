import { Schema, model, Document } from 'mongoose';

export interface ICurrencyRate extends Document {
  key: string;            // 'USD_QD'
  gcPerUsd: number;       // e.g., 20
  usdPerGc: number;       // e.g., 0.05
  active: boolean;
  effectiveFrom?: Date;
  version?: number;
}

const rateSchema = new Schema<ICurrencyRate>({
  key: { type: String, unique: true, index: true },
  gcPerUsd: { type: Number, required: true },
  usdPerGc: { type: Number, required: true },
  active: { type: Boolean, default: true },
  effectiveFrom: Date,
  version: Number,
}, { timestamps: true });

export const CurrencyRate = model<ICurrencyRate>('CurrencyRate', rateSchema);


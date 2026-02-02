import { Schema, model, Types, Document } from 'mongoose';

export interface ICashTx extends Document {
  userId: Types.ObjectId;
  type: 'topup' | 'withdrawal_request' | 'payout' | 'exchange_out_to_gc' | 'exchange_in_from_gc' | 'fee';
  amountUsdMinor: number; // cents, positive for credit, negative for debit
  balanceAfter: number;   // resulting usdMinor
  rateUsed?: number;      // gcPerUsd if relevant
  ref?: { kind: 'admin' | 'order' | 'prize' | 'withdrawal' | 'exchange'; id?: Types.ObjectId };
  idempotencyKey?: string;
  createdAt: Date;
}

const cashTxSchema = new Schema<ICashTx>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, enum: ['topup','withdrawal_request','payout','exchange_out_to_gc','exchange_in_from_gc','fee'], required: true },
  amountUsdMinor: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  rateUsed: Number,
  ref: { kind: { type: String }, id: { type: Schema.Types.ObjectId } },
  idempotencyKey: String,
  createdAt: { type: Date, default: Date.now },
});

cashTxSchema.index({ userId: 1, createdAt: -1 });

export const CashTx = model<ICashTx>('CashTx', cashTxSchema);


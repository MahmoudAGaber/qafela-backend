import { Schema, model, Types, Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  userId: Types.ObjectId;
  key: string;
  endpoint?: string;
  createdAt: Date;
  refKind?: 'order' | 'topup';
  refId?: Types.ObjectId;
}

const idempotencySchema = new Schema<IIdempotencyKey>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  key: { type: String, required: true },
  endpoint: String,
  createdAt: { type: Date, default: Date.now, index: true },
  refKind: { type: String },
  refId: { type: Schema.Types.ObjectId },
}, { timestamps: false });

idempotencySchema.index({ userId: 1, key: 1 }, { unique: true });
// TTL ~ 20 minutes
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 1200 });

export const IdempotencyKey = model<IIdempotencyKey>('IdempotencyKey', idempotencySchema);


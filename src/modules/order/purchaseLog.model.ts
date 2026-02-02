import { Schema, model, Types, Document } from "mongoose";

export interface IPurchaseLog extends Document {
  userId: Types.ObjectId;
  dropId: Types.ObjectId;
  itemId: Types.ObjectId;
  qty: number;
  costDinar: number;
  pointsGained: number;
  createdAt: Date;
  idempotencyKey?: string;
}

const purchaseLogSchema = new Schema<IPurchaseLog>({
  userId: { type: Schema.Types.ObjectId, index: true },
  dropId: { type: Schema.Types.ObjectId, index: true },
  itemId: { type: Schema.Types.ObjectId, index: true },
  qty: Number,
  costDinar: Number,
  pointsGained: Number,
  createdAt: { type: Date, default: Date.now },
  idempotencyKey: String,
});

purchaseLogSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $ne: null } } }
);
purchaseLogSchema.index({ userId: 1, dropId: 1, itemId: 1, createdAt: -1 });

export const PurchaseLog = model<IPurchaseLog>("PurchaseLog", purchaseLogSchema);

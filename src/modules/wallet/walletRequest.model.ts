import { Schema, model, Types, Document } from "mongoose";

export type WalletRequestType = "deposit" | "withdraw";
export type WalletRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled";

export interface IWalletRequest extends Document {
  userId: Types.ObjectId;
  type: WalletRequestType;
  direction: "in" | "out";
  methodKey: string;
  methodSnapshot: Record<string, unknown>;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  netAmount: number;
  currency: string;
  status: WalletRequestStatus;
  note?: string;
  adminNote?: string;
  holdTxId?: Types.ObjectId;
  autoSettled?: boolean;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletRequestSchema = new Schema<IWalletRequest>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ["deposit", "withdraw"], required: true },
    direction: { type: String, enum: ["in", "out"], required: true },
    methodKey: { type: String, required: true },
    methodSnapshot: { type: Schema.Types.Mixed, required: true },
    amount: { type: Number, required: true },
    feeAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    currency: { type: String, default: "QD" },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    note: String,
    adminNote: String,
    holdTxId: { type: Schema.Types.ObjectId, ref: "WalletTx" },
    autoSettled: { type: Boolean, default: false },
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

walletRequestSchema.index({ methodKey: 1, status: 1 });
walletRequestSchema.index({ userId: 1, createdAt: -1 });

export const WalletRequest = model<IWalletRequest>(
  "WalletRequest",
  walletRequestSchema
);

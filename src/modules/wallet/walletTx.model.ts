import { Schema, model, Types, Document } from "mongoose";

export type WalletTxType =
  | "topup"
  | "spend"
  | "reward"
  | "exchange_in"
  | "exchange_out"
  | "withdraw_hold"
  | "withdraw_release"
  | "adjustment";

export interface IWalletTx extends Document {
  userId: Types.ObjectId;
  type: WalletTxType;
  amountDinar: number; // ??????/???????? ???? ??????
  balanceAfter: number;
  ref?: {
    kind: "order" | "prize" | "admin" | "withdrawal" | "exchange";
    id?: Types.ObjectId;
  };
  meta?: {
    title?: string;
    subtitle?: string;
    icon?: string;
    direction?: "in" | "out";
    tags?: string[];
    methodKey?: string;
  };
  idempotencyKey?: string;
  createdAt: Date;
}

const walletTxSchema = new Schema<IWalletTx>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: [
      "topup",
      "spend",
      "reward",
      "exchange_in",
      "exchange_out",
      "withdraw_hold",
      "withdraw_release",
      "adjustment",
    ],
    required: true,
  },
  amountDinar: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  ref: { kind: { type: String }, id: { type: Schema.Types.ObjectId } },
  meta: {
    title: String,
    subtitle: String,
    icon: String,
    direction: String,
    methodKey: String,
    tags: [String],
  },
  idempotencyKey: String,
  createdAt: { type: Date, default: Date.now },
});

walletTxSchema.index({ userId: 1, createdAt: -1 });

export const WalletTx = model<IWalletTx>("WalletTx", walletTxSchema);

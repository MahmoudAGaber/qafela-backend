import { Schema, model, Document } from "mongoose";

export type PaymentMethodKind = "deposit" | "withdraw";
export type FeeType = "flat" | "percent";

export interface IPaymentMethod extends Document {
  key: string;
  label: string;
  kind: PaymentMethodKind;
  description?: string;
  feeType: FeeType;
  feeValue: number;
  feeLabel?: string;
  currency: "QD" | "USD";
  minAmount?: number;
  maxAmount?: number;
  processingTime?: string;
  instant?: boolean;
  order: number;
  icon?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
  settings?: {
    holdOnCreate?: boolean;
    autoApprove?: boolean;
    feeFromWallet?: boolean;
  };
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    key: { type: String, unique: true, index: true },
    label: { type: String, required: true },
    kind: { type: String, enum: ["deposit", "withdraw"], required: true },
    description: String,
    feeType: { type: String, enum: ["flat", "percent"], default: "flat" },
    feeValue: { type: Number, default: 0 },
    feeLabel: String,
    currency: { type: String, default: "QD" },
    minAmount: Number,
    maxAmount: Number,
    processingTime: String,
    instant: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    icon: String,
    active: { type: Boolean, default: true },
    metadata: Schema.Types.Mixed,
    settings: {
      holdOnCreate: { type: Boolean, default: undefined },
      autoApprove: { type: Boolean, default: undefined },
      feeFromWallet: { type: Boolean, default: undefined },
    },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ kind: 1, active: 1, order: 1 });

export const PaymentMethod = model<IPaymentMethod>(
  "PaymentMethod",
  paymentMethodSchema
);

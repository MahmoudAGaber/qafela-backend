import { Schema, model, Types, Document } from "mongoose";

export interface IInventoryItem {
  // For drop-based items
  itemId?: Types.ObjectId;
  // For barter-based items
  typeKey?: string;
  // Common fields
  title: string;
  icon?: string;
  rarity?: string;
  points?: number;
  qty: number;
  acquiredAt: Date;
  kind?: 'drop' | 'barter';
  barterAllowed?: boolean;
}

export interface IInventory extends Document {
  userId: Types.ObjectId;
  items: IInventoryItem[];
}

const inventoryItemSchema = new Schema<IInventoryItem>({
  itemId: { type: Schema.Types.ObjectId },
  typeKey: { type: String },
  title: { type: String, required: true },
  icon: String,
  rarity: String,
  points: Number,
  qty: { type: Number, default: 0 },
  acquiredAt: { type: Date, default: Date.now },
  kind: { type: String, enum: ['drop', 'barter'], default: 'drop' },
  barterAllowed: { type: Boolean },
}, { _id: false });

const inventorySchema = new Schema<IInventory>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  items: { type: [inventoryItemSchema], default: [] },
}, { timestamps: true });

export const Inventory = model<IInventory>("Inventory", inventorySchema);

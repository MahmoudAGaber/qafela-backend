import { Schema, model, Types, Document } from "mongoose";

export type Slot = "morning" | "noon" | "evening" | "random";

export interface IDropItem {
  _id: Types.ObjectId;
  key?: string;
  title: string;
  titleAr?: string;        // Arabic title
  priceDinar: number;      // سعر بالدينار
  givesPoints: number;     // النقاط المكتسبة
  givesXp?: number;        // XP المكتسبة
  barter: boolean;         // للمقايضة فقط؟
  stock: number;
  initialStock?: number;
  maxPerUser?: number;     // حد شراء للمستخدم
  rarity?: string;
  description?: string;
  visualId?: string;       // i1..i6 للواجهة
}

export interface IDrop extends Document {
  name: string;
  nameAr?: string;         // Arabic name
  slot: Slot;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  items: IDropItem[];
  // Scheduling metadata (optional)
  category?: 'daily_morning' | 'daily_midday' | 'daily_evening' | 'daily_extra' | 'seasonal';
  durationMinutes?: number;
  scheduleId?: string;   // YYYY-MM-DD::<slotKey>
  eventCode?: string;    // seasonal code if any
}

const dropItemSchema = new Schema<IDropItem>({
  key: { type: String },
  title: { type: String, required: true },
  titleAr: { type: String },  // Arabic title
  priceDinar: { type: Number, required: true },
  givesPoints: { type: Number, default: 0 },
  givesXp: { type: Number, default: 0 },
  barter: { type: Boolean, default: false },
  stock: { type: Number, required: true },
  initialStock: { type: Number },
  maxPerUser: Number,
  rarity: String,
  description: String,
  visualId: String,
  imageUrl: String,  // Already added via add(), but include in schema for clarity
}, { _id: true });

const dropSchema = new Schema<IDrop>({
  name: String,
  nameAr: String,  // Arabic name
  slot: { type: String, enum: ["morning", "noon", "evening", "random"], default: "morning" },
  startsAt: { type: Date, index: true },
  endsAt:   { type: Date, index: true },
  isActive: { type: Boolean, index: true, default: true },
  items:    { type: [dropItemSchema], default: [] },
  category: { type: String },
  durationMinutes: { type: Number },
  scheduleId: { type: String, index: true },
  eventCode: { type: String },
}, { timestamps: true });

// Query helpers
dropSchema.index({ startsAt: 1, endsAt: 1, isActive: 1 });
dropSchema.index({ 'items._id': 1 });

// Allow imageUrl on drop items stored in Drop documents
dropItemSchema.add({ imageUrl: String });

// TypeScript: augment IDropItem with imageUrl
export interface IDropItem { imageUrl?: string }

export const Drop = model<IDrop>("Drop", dropSchema);

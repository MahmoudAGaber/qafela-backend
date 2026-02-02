import { Schema, model, Document } from 'mongoose';

export type DailySlotKey = 'morning' | 'noon' | 'evening' | 'extra';
export type ScheduleCategory = 'daily_morning' | 'daily_midday' | 'daily_evening' | 'daily_extra' | 'seasonal';

export interface ITemplateItem {
  key?: string;
  title: string;
  priceDinar: number;
  givesPoints: number;
  barter: boolean;
  stock: number;
  initialStock?: number;
  maxPerUser?: number;
  rarity?: string;
  description?: string;
  visualId?: string;
  imageUrl?: string;
}

export interface IDropTemplate extends Document {
  key: string;
  name: string;
  items: ITemplateItem[];
  active: boolean;
}

const templateItemSchema = new Schema<ITemplateItem>({
  key: String,
  title: String,
  priceDinar: Number,
  givesPoints: Number,
  barter: Boolean,
  stock: Number,
  initialStock: Number,
  maxPerUser: Number,
  rarity: String,
  description: String,
  visualId: String,
  imageUrl: String,
}, { _id: false });

const dropTemplateSchema = new Schema<IDropTemplate>({
  key: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  items: { type: [templateItemSchema], default: [] },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const DropTemplate = model<IDropTemplate>('DropTemplate', dropTemplateSchema);

export interface ISeasonalEvent extends Document {
  code: string;
  name: string;
  startAt: Date;
  endAt: Date;
  templateKey: string;
  mode: 'replace' | 'additive';
  replaceSlot?: 'morning' | 'noon' | 'evening';
  windowStartHour?: number; // UTC hour
  windowEndHour?: number;   // UTC hour
  durationMinutes?: number;
  active: boolean;
}

const seasonalEventSchema = new Schema<ISeasonalEvent>({
  code: { type: String, unique: true, index: true },
  name: String,
  startAt: Date,
  endAt: Date,
  templateKey: String,
  mode: { type: String, enum: ['replace','additive'], default: 'additive' },
  replaceSlot: { type: String, enum: ['morning','noon','evening'], required: false },
  windowStartHour: Number,
  windowEndHour: Number,
  durationMinutes: Number,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const SeasonalEvent = model<ISeasonalEvent>('SeasonalEvent', seasonalEventSchema);

export interface ICaravanSchedule extends Document {
  dateId: string;      // YYYY-MM-DD (UTC)
  slotKey: string;     // 'morning'|'noon'|'evening'|'extra' or 'seasonal:<code>:<n>'
  category: ScheduleCategory;
  startAt: Date;
  endAt: Date;
  dropId?: any;
  status: 'scheduled' | 'published' | 'cancelled';
}

const caravanScheduleSchema = new Schema<ICaravanSchedule>({
  dateId: { type: String, index: true },
  slotKey: { type: String },
  category: { type: String },
  startAt: Date,
  endAt: Date,
  dropId: { type: Schema.Types.ObjectId, ref: 'Drop' },
  status: { type: String, enum: ['scheduled','published','cancelled'], default: 'scheduled' },
}, { timestamps: true });

caravanScheduleSchema.index({ dateId: 1, slotKey: 1 }, { unique: true });

export const CaravanSchedule = model<ICaravanSchedule>('CaravanSchedule', caravanScheduleSchema);

export function getDateIdUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type QafalaType = 'morning' | 'afternoon' | 'night' | 'random';

export interface IQafalaTemplate extends Document {
  type: QafalaType;
  name: string;
  imageUrl: string;  // Path to image in assets/Qafala folder
  items: ITemplateItem[];
  active: boolean;
  startHour?: number;  // UTC hour for fixed Qafalas (morning/afternoon/night)
  endHour?: number;    // UTC hour for fixed Qafalas
  durationMinutes?: number;
}

const qafalaTemplateSchema = new Schema<IQafalaTemplate>({
  type: { type: String, enum: ['morning', 'afternoon', 'night', 'random'], required: true, unique: true, index: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  items: { type: [templateItemSchema], default: [] },
  active: { type: Boolean, default: true },
  startHour: Number,
  endHour: Number,
  durationMinutes: Number,
}, { timestamps: true });

export const QafalaTemplate = model<IQafalaTemplate>('QafalaTemplate', qafalaTemplateSchema);

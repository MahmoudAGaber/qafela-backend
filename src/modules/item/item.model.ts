import { Schema, model, Document } from 'mongoose';

export interface IItem extends Document {
  key: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'barter' | 'barter_result';
  priceDinar: number;
  givesPoints: number;
  givesXp?: number;
  requiredLevel?: number;
  type?: string;
  barter: boolean;
  stock?: number;
  maxPerUser?: number | null;
  icon?: string;
  imageUrl?: string;
  visualId?: string;
  enabled: boolean;
}

const itemSchema = new Schema<IItem>(
  {
    key: { type: String, unique: true, index: true, required: true },
    title: { type: String, required: true },
    titleEn: String,
    description: String,
    descriptionEn: String,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary', 'barter', 'barter_result'],
      required: true,
    },
    priceDinar: { type: Number, required: true },
    givesPoints: { type: Number, required: true },
    givesXp: Number,
    requiredLevel: Number,
    type: String,
    barter: { type: Boolean, default: false },
    stock: Number,
    maxPerUser: { type: Number, default: null },
    icon: String,
    imageUrl: String,
    visualId: String,
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Item = model<IItem>('Item', itemSchema);


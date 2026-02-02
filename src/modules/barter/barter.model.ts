import { Schema, model, Document } from 'mongoose';

export interface IBarterType extends Document {
  key: string;      // e.g. 'oil', 'spices'
  name: string;     // localized name
  icon?: string;    // emoji or asset id
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;   // points gained when used
  source?: string;  // recipe | fallback | etc.
  enabled: boolean;
}

export interface IBarterRecipe extends Document {
  inputs: [string, string];  // unordered keys
  key: string;               // sorted pair key "a+b"
  outputKey: string;         // key of IBarterType
  description?: string;
}

export interface IBarterLog extends Document {
  userId: any;
  item1Key: string;
  item2Key: string;
  resultKey: string;
  item1Name?: string;
  item1Icon?: string;
  item1Rarity?: string;
  item2Name?: string;
  item2Icon?: string;
  item2Rarity?: string;
  resultName?: string;
  resultIcon?: string;
  resultRarity?: string;
  resultPoints?: number;
  createdAt: Date;
  used: boolean;
}

const barterTypeSchema = new Schema<IBarterType>({
  key: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  icon: String,
  rarity: { type: String, enum: ['common','rare','epic','legendary'], default: 'common' },
  points: { type: Number, default: 0 },
  source: { type: String },
  enabled: { type: Boolean, default: true },
});

const barterRecipeSchema = new Schema<IBarterRecipe>({
  inputs: { type: [String], validate: (v: string[]) => v.length === 2 },
  key: { type: String, required: true, index: true },
  outputKey: { type: String, required: true },
  description: String,
});
barterRecipeSchema.index({ key: 1 }, { unique: true });

const barterLogSchema = new Schema<IBarterLog>({
  userId: { type: Schema.Types.ObjectId, index: true },
  item1Key: String,
  item2Key: String,
  resultKey: String,
  item1Name: String,
  item1Icon: String,
  item1Rarity: String,
  item2Name: String,
  item2Icon: String,
  item2Rarity: String,
  resultName: String,
  resultIcon: String,
  resultRarity: String,
  resultPoints: Number,
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
});

export const BarterType = model<IBarterType>('BarterType', barterTypeSchema);
export const BarterRecipe = model<IBarterRecipe>('BarterRecipe', barterRecipeSchema);
export const BarterLog = model<IBarterLog>('BarterLog', barterLogSchema);

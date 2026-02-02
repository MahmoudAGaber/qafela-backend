import { Schema, model, Document } from 'mongoose';

export interface ISeasonWinner {
  userId: any;
  username: string;
  points: number;
  rank: number;
}

export interface ISeason extends Document {
  seasonId: string; // e.g. 2025-W46
  startAt: Date;
  endAt: Date;
  finalized: boolean;
  winners?: ISeasonWinner[];
  createdAt: Date;
  updatedAt: Date;
}

const seasonWinnerSchema = new Schema<ISeasonWinner>({
  userId: { type: Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  points: { type: Number, required: true },
  rank: { type: Number, required: true },
}, { _id: false });

const seasonSchema = new Schema<ISeason>({
  seasonId: { type: String, unique: true, index: true },
  startAt: { type: Date, required: true },
  endAt:   { type: Date, required: true },
  finalized: { type: Boolean, default: false },
  winners: { type: [seasonWinnerSchema], default: [] },
}, { timestamps: true });

export const Season = model<ISeason>('Season', seasonSchema);

// Helpers
export function getIsoWeekId(d: Date): string {
  // ISO week-numbering year and week
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thu of current week
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThu.getTime()) / 86400000 - 3) / 7);
  const year = date.getUTCFullYear();
  const ww = String(week).padStart(2, '0');
  return `${year}-W${ww}`;
}

export function getWeekWindowUtc(d: Date): { start: Date; end: Date } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - dayNum));
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}


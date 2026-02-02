import { Schema, model, Document } from 'mongoose';

export interface IJobLock extends Document {
  key: string;
  createdAt: Date;
}

const jobLockSchema = new Schema<IJobLock>({
  key: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

// TTL 2 hours by default (adjustable at index-level migrations if needed)
jobLockSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

export const JobLock = model<IJobLock>('JobLock', jobLockSchema);


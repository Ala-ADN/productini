import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressEntry {
  value: number;
  timestamp: Date;
  note?: string;
}

export interface IMilestone {
  name: string;
  targetPercentage: number;
  reached: boolean;
  reachedAt?: Date;
}

export interface IGoal extends Document {
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  status: string;
  milestones: IMilestone[];
  history: IProgressEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressEntrySchema = new Schema<IProgressEntry>({
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
});

const MilestoneSchema = new Schema<IMilestone>({
  name: { type: String, required: true },
  targetPercentage: { type: Number, required: true },
  reached: { type: Boolean, default: false },
  reachedAt: { type: Date }
});

const GoalSchema = new Schema<IGoal>({
  title: { type: String, required: true },
  description: { type: String },
  targetValue: { type: Number, default: 100 },
  currentValue: { type: Number, default: 0 },
  status: { type: String, default: 'NOT_STARTED' },
  milestones: [MilestoneSchema],
  history: [ProgressEntrySchema]
}, {
  timestamps: true
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);

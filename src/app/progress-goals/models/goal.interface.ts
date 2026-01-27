import { GoalStatus } from './status.enum';

/**
 * Represents a single progress entry in the history
 */
export interface ProgressEntry {
  id: string;
  value: number;
  timestamp: Date;
  note?: string;
}

/**
 * Represents a milestone checkpoint
 */
export interface Milestone {
  id: string;
  name: string;
  targetPercentage: number;
  reached: boolean;
  reachedAt?: Date;
}

/**
 * Main Goal interface representing a trackable goal
 * Structured to be compatible with MongoDB document structure
 */
export interface Goal {
  _id?: string;                    // MongoDB ObjectId (optional for new goals)
  title: string;
  description?: string;
  targetValue: number;             // The 100% target (e.g., 100 for percentage)
  currentValue: number;            // Current progress value
  status: GoalStatus;
  milestones: Milestone[];
  history: ProgressEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new goal
 */
export interface CreateGoalDto {
  title: string;
  description?: string;
  targetValue?: number;
}

/**
 * DTO for adding progress to a goal
 */
export interface AddProgressDto {
  value: number;
  note?: string;
}

/**
 * State interface for the progress store
 */
export interface ProgressState {
  goal: Goal | null;
  loading: boolean;
  error: string | null;
}

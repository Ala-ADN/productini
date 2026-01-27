import { GoalStatus } from './status.enum';

/**
 * Task Hardness levels
 */
export enum TaskHardness {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3
}

/**
 * Represents a weighted task within a plan
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  hardness: TaskHardness;           // Multiplier: 1, 2, or 3
  length: number;                   // Effort estimate (hours)
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * Computed weight helper (Hardness * Length)
 */
export function calculateTaskWeight(task: Task): number {
  return task.hardness * task.length;
}

/**
 * Represents a progress plan with weighted tasks
 */
export interface Plan {
  _id?: string;                     // MongoDB ObjectId
  name: string;
  description?: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Computed plan metrics
 */
export interface PlanMetrics {
  totalWeight: number;
  completedWeight: number;
  percentage: number;
  completedTaskCount: number;
  totalTaskCount: number;
}

/**
 * Calculate metrics for a plan
 */
export function calculatePlanMetrics(plan: Plan): PlanMetrics {
  const totalWeight = plan.tasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
  const completedWeight = plan.tasks
    .filter(task => task.isCompleted)
    .reduce((sum, task) => sum + calculateTaskWeight(task), 0);
  
  return {
    totalWeight,
    completedWeight,
    percentage: totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0,
    completedTaskCount: plan.tasks.filter(t => t.isCompleted).length,
    totalTaskCount: plan.tasks.length
  };
}

/**
 * DTO for creating a new plan
 */
export interface CreatePlanDto {
  name: string;
  description?: string;
  tasks: Omit<Task, 'id' | 'isCompleted' | 'completedAt'>[];
}

/**
 * DTO for toggling task completion
 */
export interface ToggleTaskDto {
  planId: string;
  taskId: string;
}

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

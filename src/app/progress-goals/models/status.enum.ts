/**
 * Enum representing the status of a goal
 * Used to track progress milestones and completion state
 */
export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  HALFWAY = 'HALFWAY',
  ALMOST_DONE = 'ALMOST_DONE',
  COMPLETED = 'COMPLETED'
}

/**
 * Milestone thresholds for status transitions
 */
export const MILESTONE_THRESHOLDS = {
  [GoalStatus.NOT_STARTED]: 0,
  [GoalStatus.IN_PROGRESS]: 1,
  [GoalStatus.HALFWAY]: 50,
  [GoalStatus.ALMOST_DONE]: 75,
  [GoalStatus.COMPLETED]: 100
} as const;

/**
 * Helper function to determine status from percentage
 */
export function getStatusFromPercentage(percentage: number): GoalStatus {
  if (percentage >= 100) return GoalStatus.COMPLETED;
  if (percentage >= 75) return GoalStatus.ALMOST_DONE;
  if (percentage >= 50) return GoalStatus.HALFWAY;
  if (percentage > 0) return GoalStatus.IN_PROGRESS;
  return GoalStatus.NOT_STARTED;
}

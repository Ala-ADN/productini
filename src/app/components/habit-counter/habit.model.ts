import type { HabitHistory } from '../../db';

export type { HabitHistory };

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  dailyGoal: number;
  completionsToday: number;
  streak: number;
  bestStreak: number;
  totalCompletions: number;
  createdAt: Date;
  lastCompletedAt: Date | null;
  history: HabitHistory[];
}

export interface HabitStats {
  totalHabits: number;
  totalCompletionsToday: number;
  totalGoalsMetToday: number;
  overallCompletionRate: number;
  longestStreak: number;
  mostProductiveDay: string;
}

export const HABIT_ICONS = ['💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '💤', '🥗', '🎨', '🎸', '💊'];

export const HABIT_COLORS = [
  '#667eea', // Purple
  '#f093fb', // Pink
  '#4ade80', // Green
  '#fbbf24', // Yellow
  '#f87171', // Red
  '#60a5fa', // Blue
  '#a78bfa', // Violet
  '#34d399', // Emerald
];

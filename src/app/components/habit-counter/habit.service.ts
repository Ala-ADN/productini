import { Injectable, signal, computed, effect } from '@angular/core';
import { Habit, HabitHistory, HabitStats, HABIT_COLORS, HABIT_ICONS } from './habit.model';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private readonly STORAGE_KEY = 'prodhub_habits';
  private readonly LAST_RESET_KEY = 'prodhub_last_reset';

  // Reactive state using signals
  readonly habits = signal<Habit[]>([]);
  readonly selectedHabitId = signal<string | null>(null);

  // Computed values
  readonly selectedHabit = computed(() => {
    const id = this.selectedHabitId();
    return this.habits().find((h) => h.id === id) ?? null;
  });

  readonly stats = computed<HabitStats>(() => {
    const allHabits = this.habits();

    const totalCompletionsToday = allHabits.reduce((sum, h) => sum + h.completionsToday, 0);
    const totalGoalsMetToday = allHabits.filter((h) => h.completionsToday >= h.dailyGoal).length;
    const longestStreak = Math.max(0, ...allHabits.map((h) => h.bestStreak));

    // Calculate overall completion rate from history
    const allHistory = allHabits.flatMap((h) => h.history);
    const completionRate =
      allHistory.length > 0
        ? (allHistory.filter((h) => h.goalMet).length / allHistory.length) * 100
        : 0;

    // Find most productive day
    const dayCompletions: Record<string, number> = {};
    allHistory.forEach((h) => {
      const day = new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCompletions[day] = (dayCompletions[day] || 0) + h.completions;
    });
    const mostProductiveDay =
      Object.entries(dayCompletions).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalHabits: allHabits.length,
      totalCompletionsToday,
      totalGoalsMetToday,
      overallCompletionRate: Math.round(completionRate),
      longestStreak,
      mostProductiveDay,
    };
  });

  readonly todayProgress = computed(() => {
    const allHabits = this.habits();
    if (allHabits.length === 0) return 0;
    const totalGoals = allHabits.reduce((sum, h) => sum + h.dailyGoal, 0);
    const totalCompleted = allHabits.reduce((sum, h) => sum + Math.min(h.completionsToday, h.dailyGoal), 0);
    return totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
  });

  constructor() {
    this.loadFromStorage();
    this.checkDailyReset();

    // Auto-save to localStorage whenever habits change
    effect(() => {
      const habits = this.habits();
      this.saveToStorage(habits);
    });
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Habit[];
        // Convert date strings back to Date objects
        const habits = parsed.map((h) => ({
          ...h,
          createdAt: new Date(h.createdAt),
          lastCompletedAt: h.lastCompletedAt ? new Date(h.lastCompletedAt) : null,
        }));
        this.habits.set(habits);
      }
    } catch (e) {
      console.error('Failed to load habits from storage:', e);
    }
  }

  private saveToStorage(habits: Habit[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to storage:', e);
    }
  }

  private checkDailyReset(): void {
    const today = this.getTodayString();
    const lastReset = localStorage.getItem(this.LAST_RESET_KEY);

    if (lastReset !== today) {
      this.performDailyReset();
      localStorage.setItem(this.LAST_RESET_KEY, today);
    }
  }

  private performDailyReset(): void {
    const today = this.getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    this.habits.update((habits) =>
      habits.map((habit) => {
        // Save yesterday's progress to history if there was any activity
        const historyEntry: HabitHistory = {
          date: yesterdayString,
          completions: habit.completionsToday,
          goalMet: habit.completionsToday >= habit.dailyGoal,
        };

        // Update streak
        let newStreak = habit.streak;
        if (habit.completionsToday >= habit.dailyGoal) {
          newStreak = habit.streak + 1;
        } else if (habit.completionsToday === 0) {
          newStreak = 0;
        }

        const newBestStreak = Math.max(habit.bestStreak, newStreak);

        // Only add to history if there was activity or it's a tracked day
        const newHistory =
          habit.completionsToday > 0 || habit.history.length > 0
            ? [...habit.history.slice(-29), historyEntry] // Keep last 30 days
            : habit.history;

        return {
          ...habit,
          completionsToday: 0,
          streak: newStreak,
          bestStreak: newBestStreak,
          history: newHistory,
        };
      })
    );
  }

  generateId(): string {
    return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addHabit(name: string, dailyGoal: number = 1, icon?: string, color?: string): void {
    const newHabit: Habit = {
      id: this.generateId(),
      name,
      icon: icon || HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)],
      color: color || HABIT_COLORS[this.habits().length % HABIT_COLORS.length],
      dailyGoal,
      completionsToday: 0,
      streak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      createdAt: new Date(),
      lastCompletedAt: null,
      history: [],
    };

    this.habits.update((habits) => [...habits, newHabit]);
  }

  removeHabit(id: string): void {
    this.habits.update((habits) => habits.filter((h) => h.id !== id));
    if (this.selectedHabitId() === id) {
      this.selectedHabitId.set(null);
    }
  }

  incrementHabit(id: string): void {
    this.habits.update((habits) =>
      habits.map((h) =>
        h.id === id
          ? {
              ...h,
              completionsToday: h.completionsToday + 1,
              totalCompletions: h.totalCompletions + 1,
              lastCompletedAt: new Date(),
            }
          : h
      )
    );
  }

  decrementHabit(id: string): void {
    this.habits.update((habits) =>
      habits.map((h) =>
        h.id === id && h.completionsToday > 0
          ? {
              ...h,
              completionsToday: h.completionsToday - 1,
              totalCompletions: Math.max(0, h.totalCompletions - 1),
            }
          : h
      )
    );
  }

  resetHabitToday(id: string): void {
    this.habits.update((habits) =>
      habits.map((h) =>
        h.id === id
          ? {
              ...h,
              totalCompletions: h.totalCompletions - h.completionsToday,
              completionsToday: 0,
            }
          : h
      )
    );
  }

  updateHabit(id: string, updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'dailyGoal'>>): void {
    this.habits.update((habits) =>
      habits.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }

  selectHabit(id: string | null): void {
    this.selectedHabitId.set(id);
  }

  getMotivationalMessage(habit: Habit): string {
    const progress = habit.dailyGoal > 0 ? habit.completionsToday / habit.dailyGoal : 0;

    if (habit.completionsToday === 0) {
      return 'Ready to start? 🚀';
    }
    if (progress < 0.5) {
      return 'Great start! Keep going! 💪';
    }
    if (progress < 1) {
      return 'Almost there! 🔥';
    }
    if (progress === 1) {
      return 'Goal achieved! 🎯';
    }
    return 'Overachiever! Amazing! 🏆';
  }
}

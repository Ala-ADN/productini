import { Injectable, signal, computed } from '@angular/core';
import { Habit, HabitStats, HABIT_COLORS, HABIT_ICONS } from './habit.model';
import { db, HabitRecord, HabitHistory } from '../../db';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  // Reactive state using signals
  readonly habits = signal<Habit[]>([]);
  readonly selectedHabitId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(true);

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
    this.initializeFromDB();
  }

  private async initializeFromDB(): Promise<void> {
    try {
      await this.checkDailyReset();
      await this.loadFromDB();
    } catch (e) {
      console.error('Failed to initialize habits from DB:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private habitRecordToHabit(record: HabitRecord): Habit {
    return {
      id: String(record.id),
      name: record.name,
      icon: record.icon,
      color: record.color,
      dailyGoal: record.dailyGoal,
      completionsToday: record.completionsToday,
      streak: record.streak,
      bestStreak: record.bestStreak,
      totalCompletions: record.totalCompletions,
      createdAt: new Date(record.createdAt),
      lastCompletedAt: record.lastCompletedAt ? new Date(record.lastCompletedAt) : null,
      history: record.history,
    };
  }

  private async loadFromDB(): Promise<void> {
    try {
      const records = await db.habits.orderBy('order').toArray();
      const habits = records.map((r) => this.habitRecordToHabit(r));
      this.habits.set(habits);
    } catch (e) {
      console.error('Failed to load habits from DB:', e);
    }
  }

  private async updateHabitInDB(id: number, updates: Partial<HabitRecord>): Promise<void> {
    await db.habits.update(id, updates);
  }

  private async deleteHabitFromDB(id: number): Promise<void> {
    await db.habits.delete(id);
  }

  private async checkDailyReset(): Promise<void> {
    const today = this.getTodayString();
    
    try {
      const metadata = await db.habitMetadata.get('habit_metadata');
      
      if (!metadata || metadata.lastResetDate !== today) {
        await this.performDailyReset();
        await db.habitMetadata.put({ id: 'habit_metadata', lastResetDate: today });
      }
    } catch (e) {
      console.error('Failed to check daily reset:', e);
    }
  }

  private async performDailyReset(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    try {
      const records = await db.habits.toArray();
      
      for (const record of records) {
        // Save yesterday's progress to history
        const historyEntry: HabitHistory = {
          date: yesterdayString,
          completions: record.completionsToday,
          goalMet: record.completionsToday >= record.dailyGoal,
        };

        // Update streak
        let newStreak = record.streak;
        if (record.completionsToday >= record.dailyGoal) {
          newStreak = record.streak + 1;
        } else if (record.completionsToday === 0) {
          newStreak = 0;
        }

        const newBestStreak = Math.max(record.bestStreak, newStreak);

        // Only add to history if there was activity or it's a tracked day
        const newHistory =
          record.completionsToday > 0 || record.history.length > 0
            ? [...record.history.slice(-29), historyEntry] // Keep last 30 days
            : record.history;

        await db.habits.update(record.id!, {
          completionsToday: 0,
          streak: newStreak,
          bestStreak: newBestStreak,
          history: newHistory,
        });
      }
    } catch (e) {
      console.error('Failed to perform daily reset:', e);
    }
  }

  async addHabit(name: string, dailyGoal: number = 1, icon?: string, color?: string): Promise<void> {
    const currentHabits = this.habits();
    const order = currentHabits.length;

    const newRecord: Omit<HabitRecord, 'id'> = {
      name,
      icon: icon || HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)],
      color: color || HABIT_COLORS[currentHabits.length % HABIT_COLORS.length],
      dailyGoal,
      completionsToday: 0,
      streak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      createdAt: Date.now(),
      lastCompletedAt: null,
      history: [],
      order,
    };

    try {
      const id = await db.habits.add(newRecord as HabitRecord);
      const newHabit: Habit = {
        id: String(id),
        name: newRecord.name,
        icon: newRecord.icon,
        color: newRecord.color,
        dailyGoal: newRecord.dailyGoal,
        completionsToday: 0,
        streak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date(newRecord.createdAt),
        lastCompletedAt: null,
        history: [],
      };
      this.habits.update((habits) => [...habits, newHabit]);
    } catch (e) {
      console.error('Failed to add habit:', e);
    }
  }

  async removeHabit(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    
    try {
      await this.deleteHabitFromDB(numericId);
      this.habits.update((habits) => habits.filter((h) => h.id !== id));
      
      if (this.selectedHabitId() === id) {
        this.selectedHabitId.set(null);
      }
    } catch (e) {
      console.error('Failed to remove habit:', e);
    }
  }

  async incrementHabit(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    const habit = this.habits().find((h) => h.id === id);
    
    if (!habit) return;

    const updates = {
      completionsToday: habit.completionsToday + 1,
      totalCompletions: habit.totalCompletions + 1,
      lastCompletedAt: Date.now(),
    };

    try {
      await this.updateHabitInDB(numericId, updates);
      this.habits.update((habits) =>
        habits.map((h) =>
          h.id === id
            ? {
                ...h,
                completionsToday: updates.completionsToday,
                totalCompletions: updates.totalCompletions,
                lastCompletedAt: new Date(updates.lastCompletedAt),
              }
            : h
        )
      );
    } catch (e) {
      console.error('Failed to increment habit:', e);
    }
  }

  async decrementHabit(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    const habit = this.habits().find((h) => h.id === id);
    
    if (!habit || habit.completionsToday === 0) return;

    const updates = {
      completionsToday: habit.completionsToday - 1,
      totalCompletions: Math.max(0, habit.totalCompletions - 1),
    };

    try {
      await this.updateHabitInDB(numericId, updates);
      this.habits.update((habits) =>
        habits.map((h) =>
          h.id === id
            ? {
                ...h,
                completionsToday: updates.completionsToday,
                totalCompletions: updates.totalCompletions,
              }
            : h
        )
      );
    } catch (e) {
      console.error('Failed to decrement habit:', e);
    }
  }

  async resetHabitToday(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    const habit = this.habits().find((h) => h.id === id);
    
    if (!habit) return;

    const updates = {
      totalCompletions: habit.totalCompletions - habit.completionsToday,
      completionsToday: 0,
    };

    try {
      await this.updateHabitInDB(numericId, updates);
      this.habits.update((habits) =>
        habits.map((h) =>
          h.id === id
            ? {
                ...h,
                totalCompletions: updates.totalCompletions,
                completionsToday: 0,
              }
            : h
        )
      );
    } catch (e) {
      console.error('Failed to reset habit:', e);
    }
  }

  async updateHabit(id: string, updates: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'dailyGoal'>>): Promise<void> {
    const numericId = parseInt(id, 10);

    try {
      await this.updateHabitInDB(numericId, updates);
      this.habits.update((habits) =>
        habits.map((h) => (h.id === id ? { ...h, ...updates } : h))
      );
    } catch (e) {
      console.error('Failed to update habit:', e);
    }
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

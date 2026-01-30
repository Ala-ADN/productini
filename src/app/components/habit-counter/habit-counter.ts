import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HabitService } from './habit.service';
import { Habit, HABIT_ICONS, HABIT_COLORS } from './habit.model';

@Component({
  selector: 'app-habit-counter',
  imports: [FormsModule],
  templateUrl: './habit-counter.html',
  styleUrl: './habit-counter.css',
})
export class HabitCounter {
  protected readonly habitService = inject(HabitService);
  protected readonly Math = Math; // Expose Math to template

  // UI State
  protected readonly showAddForm = signal(false);
  protected readonly showEditForm = signal(false);
  protected readonly showStats = signal(false);
  protected readonly editingHabit = signal<Habit | null>(null);

  // Form state
  protected readonly newHabitName = signal('');
  protected readonly newHabitGoal = signal(1);
  protected readonly newHabitIcon = signal(HABIT_ICONS[0]);
  protected readonly newHabitColor = signal(HABIT_COLORS[0]);

  // Available options
  protected readonly availableIcons = HABIT_ICONS;
  protected readonly availableColors = HABIT_COLORS;

  // Computed
  protected readonly habits = this.habitService.habits;
  protected readonly stats = this.habitService.stats;
  protected readonly todayProgress = this.habitService.todayProgress;
  protected readonly selectedHabit = this.habitService.selectedHabit;

  protected readonly currentDate = computed(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  toggleAddForm(): void {
    this.showAddForm.update((v) => !v);
    if (this.showAddForm()) {
      this.resetForm();
    }
  }

  toggleStats(): void {
    this.showStats.update((v) => !v);
  }

  private resetForm(): void {
    this.newHabitName.set('');
    this.newHabitGoal.set(1);
    this.newHabitIcon.set(HABIT_ICONS[0]);
    this.newHabitColor.set(HABIT_COLORS[0]);
  }

  addHabit(): void {
    const name = this.newHabitName().trim();
    if (name) {
      this.habitService.addHabit(
        name,
        this.newHabitGoal(),
        this.newHabitIcon(),
        this.newHabitColor()
      );
      this.showAddForm.set(false);
      this.resetForm();
    }
  }

  startEdit(habit: Habit, event: Event): void {
    event.stopPropagation();
    this.editingHabit.set({ ...habit });
    this.showEditForm.set(true);
  }

  saveEdit(): void {
    const habit = this.editingHabit();
    if (habit) {
      this.habitService.updateHabit(habit.id, {
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        dailyGoal: habit.dailyGoal,
      });
      this.showEditForm.set(false);
      this.editingHabit.set(null);
    }
  }

  cancelEdit(): void {
    this.showEditForm.set(false);
    this.editingHabit.set(null);
  }

  updateEditingHabit(field: keyof Habit, value: any): void {
    this.editingHabit.update((h) => (h ? { ...h, [field]: value } : null));
  }

  removeHabit(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this habit?')) {
      this.habitService.removeHabit(id);
    }
  }

  incrementHabit(id: string, event: Event): void {
    event.stopPropagation();
    this.habitService.incrementHabit(id);
  }

  decrementHabit(id: string, event: Event): void {
    event.stopPropagation();
    this.habitService.decrementHabit(id);
  }

  resetHabit(id: string, event: Event): void {
    event.stopPropagation();
    this.habitService.resetHabitToday(id);
  }

  selectHabit(habit: Habit): void {
    this.habitService.selectHabit(
      this.habitService.selectedHabitId() === habit.id ? null : habit.id
    );
  }

  getProgressPercentage(habit: Habit): number {
    if (habit.dailyGoal === 0) return 100;
    return Math.min(100, Math.round((habit.completionsToday / habit.dailyGoal) * 100));
  }

  getMotivationalMessage(habit: Habit): string {
    return this.habitService.getMotivationalMessage(habit);
  }

  isGoalMet(habit: Habit): boolean {
    return habit.completionsToday >= habit.dailyGoal;
  }

  getStreakEmoji(streak: number): string {
    if (streak === 0) return '';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    if (streak < 30) return '⭐';
    return '👑';
  }

  getHistoryDays(habit: Habit): { date: string; completed: boolean; completions: number }[] {
    const days: { date: string; completed: boolean; completions: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (i === 0) {
        // Today
        days.push({
          date: 'Today',
          completed: habit.completionsToday >= habit.dailyGoal,
          completions: habit.completionsToday,
        });
      } else {
        const historyEntry = habit.history.find((h) => h.date === dateStr);
        days.push({
          date: dayName,
          completed: historyEntry?.goalMet ?? false,
          completions: historyEntry?.completions ?? 0,
        });
      }
    }

    return days;
  }
}

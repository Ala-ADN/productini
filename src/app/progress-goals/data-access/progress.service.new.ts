import { Injectable, signal, computed } from '@angular/core';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { db, Todo } from '../../db';
import { GoalStatus, getStatusFromPercentage } from '../models/status.enum';

interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  status: GoalStatus;
  tasksByPriority: {
    high: { total: number; completed: number };
    medium: { total: number; completed: number };
    low: { total: number; completed: number };
  };
}

/**
 * ProgressService - Data Access Layer
 * 
 * This service manages goal progress state using local Dexie database.
 * Calculates progress based on completed todos.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // ============================================
  // Signal-based State
  // ============================================
  
  private readonly _todos = signal<Todo[]>([]);
  private readonly _loading = signal<boolean>(true);
  
  readonly loading = this._loading.asReadonly();
  
  // Computed progress statistics
  readonly stats = computed<ProgressStats>(() => {
    const todos = this._todos();
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.completed).length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const tasksByPriority = {
      high: {
        total: todos.filter(t => t.priority === 'high').length,
        completed: todos.filter(t => t.completed && t.priority === 'high').length
      },
      medium: {
        total: todos.filter(t => t.priority === 'medium').length,
        completed: todos.filter(t => t.completed && t.priority === 'medium').length
      },
      low: {
        total: todos.filter(t => t.priority === 'low').length,
        completed: todos.filter(t => t.completed && t.priority === 'low').length
      }
    };
    
    return {
      totalTasks,
      completedTasks,
      percentage,
      status: getStatusFromPercentage(percentage),
      tasksByPriority
    };
  });
  
  readonly percentage = computed(() => this.stats().percentage);
  readonly status = computed(() => this.stats().status);
  readonly isComplete = computed(() => this.stats().status === GoalStatus.COMPLETED);
  readonly totalTasks = computed(() => this.stats().totalTasks);
  readonly completedTasks = computed(() => this.stats().completedTasks);
  readonly todos = this._todos.asReadonly();

  constructor() {
    this.initializeTodos();
  }

  // ============================================
  // Initialization
  // ============================================

  private initializeTodos(): void {
    // Use Dexie's liveQuery to reactively update todos
    const todosObservable = from(
      liveQuery(() => db.todos.orderBy('order').toArray())
    );
    
    todosObservable.subscribe({
      next: (todos) => {
        this._todos.set(todos);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load todos:', error);
        this._loading.set(false);
      }
    });
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Get todos filtered by completion status
   */
  getTodosByStatus(completed: boolean): Todo[] {
    return this._todos().filter(t => t.completed === completed);
  }

  /**
   * Get todos filtered by priority
   */
  getTodosByPriority(priority: 'high' | 'medium' | 'low'): Todo[] {
    return this._todos().filter(t => t.priority === priority);
  }

  /**
   * Get overdue todos
   */
  getOverdueTodos(): Todo[] {
    const now = new Date().toISOString().split('T')[0];
    return this._todos().filter(t => !t.completed && t.dueDate && t.dueDate < now);
  }

  /**
   * Get today's todos
   */
  getTodaysTodos(): Todo[] {
    const today = new Date().toISOString().split('T')[0];
    return this._todos().filter(t => t.dueDate === today);
  }

  /**
   * Calculate progress for a specific date range
   */
  getProgressForDateRange(startDate: string, endDate: string): ProgressStats {
    const todos = this._todos().filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate >= startDate && t.dueDate <= endDate;
    });
    
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.completed).length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const tasksByPriority = {
      high: {
        total: todos.filter(t => t.priority === 'high').length,
        completed: todos.filter(t => t.completed && t.priority === 'high').length
      },
      medium: {
        total: todos.filter(t => t.priority === 'medium').length,
        completed: todos.filter(t => t.completed && t.priority === 'medium').length
      },
      low: {
        total: todos.filter(t => t.priority === 'low').length,
        completed: todos.filter(t => t.completed && t.priority === 'low').length
      }
    };
    
    return {
      totalTasks,
      completedTasks,
      percentage,
      status: getStatusFromPercentage(percentage),
      tasksByPriority
    };
  }

  /**
   * Get completion streak (consecutive days with at least one task completed)
   */
  getCompletionStreak(): number {
    // This would require tracking completion dates in the Todo model
    // For now, return 0 as a placeholder
    return 0;
  }
}

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of, delay } from 'rxjs';
import {
  Plan,
  Task,
  CreatePlanDto,
  ToggleTaskDto,
  calculatePlanMetrics,
  calculateTaskWeight,
  TaskHardness
} from '../models/goal.interface';

/**
 * PlanService - Multi-Plan Management with Weighted Task System
 * 
 * Manages multiple progress plans where progress is calculated
 * based on weighted task completion (Hardness × Length).
 * 
 * Uses Signals for reactive state and RxJS for async operations.
 */
@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private readonly API_URL = 'http://localhost:3000/api/plans';

  // ============================================
  // Signal-based State
  // ============================================
  
  /** All available plans */
  private readonly _plans = signal<Plan[]>([]);
  
  /** Currently active plan ID */
  private readonly _activePlanId = signal<string | null>(null);
  
  /** Loading state */
  private readonly _loading = signal<boolean>(false);
  
  /** Error state */
  private readonly _error = signal<string | null>(null);

  // ============================================
  // Public Readonly Signals
  // ============================================
  
  readonly plans = this._plans.asReadonly();
  readonly activePlanId = this._activePlanId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Computed: Get the currently active plan */
  readonly activePlan = computed(() => {
    const id = this._activePlanId();
    return this._plans().find(plan => plan._id === id) || null;
  });

  /** Computed: Get metrics for the active plan */
  readonly activePlanMetrics = computed(() => {
    const plan = this.activePlan();
    return plan ? calculatePlanMetrics(plan) : null;
  });

  /** Computed: Get percentage for active plan */
  readonly activePercentage = computed(() => {
    const metrics = this.activePlanMetrics();
    return metrics ? metrics.percentage : 0;
  });

  constructor() {
    this.initializePlans();
  }

  // ============================================
  // Initialization
  // ============================================

  private initializePlans(): void {
    this._loading.set(true);
    
    // For now, use local mock data until backend is ready
    // This simulates async behavior with delay
    of(this.getMockPlans()).pipe(
      delay(500), // Simulate network delay
      tap(plans => {
        this._plans.set(plans);
        if (plans.length > 0 && !this._activePlanId()) {
          this._activePlanId.set(plans[0]._id || null);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Failed to load plans:', error);
        this._error.set('Failed to load plans');
        this._loading.set(false);
        return of([]);
      })
    ).subscribe();

    /* TODO: Enable when backend is ready
    this.http.get<Plan[]>(this.API_URL).pipe(
      tap(plans => {
        this._plans.set(plans);
        if (plans.length > 0 && !this._activePlanId()) {
          this._activePlanId.set(plans[0]._id || null);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Failed to load plans:', error);
        this._error.set('Failed to load plans');
        this._loading.set(false);
        return of([]);
      })
    ).subscribe();
    */
  }

  // ============================================
  // Public Methods
  // ============================================

  /** Set the active plan by ID */
  setActivePlan(planId: string): void {
    const plan = this._plans().find(p => p._id === planId);
    if (plan) {
      this._activePlanId.set(planId);
    }
  }

  /** Create a new plan */
  createPlan(dto: CreatePlanDto): Observable<Plan> {
    const newPlan: Plan = {
      _id: this.generateId(),
      name: dto.name,
      description: dto.description,
      tasks: dto.tasks.map(t => ({
        ...t,
        id: this.generateId(),
        isCompleted: false
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock implementation - replace with HTTP call later
    return of(newPlan).pipe(
      delay(300),
      tap(plan => {
        this._plans.update(plans => [...plans, plan]);
        this._activePlanId.set(plan._id!);
      })
    );

    /* TODO: Enable when backend is ready
    return this.http.post<Plan>(this.API_URL, dto).pipe(
      tap(plan => {
        this._plans.update(plans => [...plans, plan]);
        this._activePlanId.set(plan._id!);
      })
    );
    */
  }

  /** Toggle task completion status */
  toggleTask(planId: string, taskId: string): Observable<Plan> {
    const plan = this._plans().find(p => p._id === planId);
    if (!plan) {
      return of(plan!);
    }

    const updatedPlan: Plan = {
      ...plan,
      tasks: plan.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              isCompleted: !task.isCompleted,
              completedAt: !task.isCompleted ? new Date() : undefined
            }
          : task
      ),
      updatedAt: new Date()
    };

    // Mock implementation
    return of(updatedPlan).pipe(
      delay(200),
      tap(updated => {
        this._plans.update(plans =>
          plans.map(p => p._id === planId ? updated : p)
        );
      })
    );

    /* TODO: Enable when backend is ready
    return this.http.put<Plan>(`${this.API_URL}/${planId}/toggle-task`, { taskId }).pipe(
      tap(updated => {
        this._plans.update(plans =>
          plans.map(p => p._id === planId ? updated : p)
        );
      })
    );
    */
  }

  /** Delete a plan */
  deletePlan(planId: string): Observable<void> {
    // Mock implementation
    return of(void 0).pipe(
      delay(200),
      tap(() => {
        this._plans.update(plans => plans.filter(p => p._id !== planId));
        
        // If deleted plan was active, switch to first available
        if (this._activePlanId() === planId) {
          const remaining = this._plans();
          this._activePlanId.set(remaining.length > 0 ? remaining[0]._id || null : null);
        }
      })
    );
  }

  // ============================================
  // Utilities
  // ============================================

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getMockPlans(): Plan[] {
    return [
      {
        _id: 'plan1',
        name: 'Learn Angular',
        description: 'Master Angular development with advanced features',
        tasks: [
          {
            id: 'task1',
            title: 'Complete Signals Tutorial',
            description: 'Learn about Angular Signals',
            hardness: TaskHardness.MEDIUM,
            length: 4,
            isCompleted: true,
            completedAt: new Date('2026-02-01')
          },
          {
            id: 'task2',
            title: 'Build CRUD App',
            description: 'Create a full CRUD application',
            hardness: TaskHardness.HARD,
            length: 8,
            isCompleted: false
          },
          {
            id: 'task3',
            title: 'Learn RxJS Operators',
            description: 'Master reactive programming',
            hardness: TaskHardness.HARD,
            length: 6,
            isCompleted: false
          }
        ],
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01')
      },
      {
        _id: 'plan2',
        name: 'Fitness Goals',
        description: 'Get in shape this month',
        tasks: [
          {
            id: 'task4',
            title: 'Morning Run 5km',
            hardness: TaskHardness.MEDIUM,
            length: 1,
            isCompleted: true,
            completedAt: new Date('2026-02-02')
          },
          {
            id: 'task5',
            title: 'Gym Session - Strength',
            hardness: TaskHardness.HARD,
            length: 2,
            isCompleted: true,
            completedAt: new Date('2026-02-02')
          },
          {
            id: 'task6',
            title: 'Yoga Class',
            hardness: TaskHardness.EASY,
            length: 1,
            isCompleted: false
          }
        ],
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-02')
      }
    ];
  }
}

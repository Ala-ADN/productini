import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of, delay, map } from 'rxjs';
import {
  Goal,
  ProgressEntry,
  Milestone,
  AddProgressDto,
  ProgressState
} from '../models/goal.interface';
import { GoalStatus, getStatusFromPercentage, MILESTONE_THRESHOLDS } from '../models/status.enum';

/**
 * ProgressService - Data Access Layer
 * 
 * This service manages goal progress state and provides Observable-based methods
 * structured for easy migration to MongoDB HTTP calls.
 * 
 * Current Implementation: In-memory BehaviorSubject
 * Future Implementation: Replace with HttpClient calls to MongoDB API
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  
  // ============================================
  // Private State (BehaviorSubject for RxJS compatibility)
  // ============================================
  
  private readonly _state$ = new BehaviorSubject<ProgressState>({
    goal: this.createDefaultGoal(),
    loading: false,
    error: null
  });

  // ============================================
  // Public Observables (for toSignal conversion)
  // ============================================
  
  /** Observable stream of the current progress state */
  readonly state$: Observable<ProgressState> = this._state$.asObservable();
  
  /** Observable stream of just the goal */
  readonly goal$: Observable<Goal | null> = this._state$.pipe(
    map(state => state.goal)
  );

  /** Observable stream of current percentage */
  readonly percentage$: Observable<number> = this._state$.pipe(
    map(state => state.goal ? (state.goal.currentValue / state.goal.targetValue) * 100 : 0)
  );

  /** Observable stream of progress history */
  readonly history$: Observable<ProgressEntry[]> = this._state$.pipe(
    map(state => state.goal?.history ?? [])
  );

  /** Observable stream of milestones */
  readonly milestones$: Observable<Milestone[]> = this._state$.pipe(
    map(state => state.goal?.milestones ?? [])
  );

  // ============================================
  // Signal-based State (for direct signal usage)
  // ============================================
  
  private readonly _goalSignal = signal<Goal | null>(this.createDefaultGoal());
  
  /** Signal for current goal */
  readonly goalSignal = this._goalSignal.asReadonly();
  
  /** Computed signal for current percentage */
  readonly percentageSignal = computed(() => {
    const goal = this._goalSignal();
    return goal ? (goal.currentValue / goal.targetValue) * 100 : 0;
  });

  /** Computed signal for goal status */
  readonly statusSignal = computed(() => {
    const percentage = this.percentageSignal();
    return getStatusFromPercentage(percentage);
  });

  /** Computed signal for checking if goal is complete */
  readonly isCompleteSignal = computed(() => this.statusSignal() === GoalStatus.COMPLETED);

  // ============================================
  // Public Methods (Async - MongoDB Ready)
  // ============================================

  /**
   * Add progress to the current goal
   * @param dto - The progress data to add
   * @returns Observable<Goal> - The updated goal
   * 
   * Future MongoDB: POST /api/goals/:id/progress
   */
  addProgress(dto: AddProgressDto): Observable<Goal> {
    return new Observable<Goal>(observer => {
      // Simulate async operation (replace with HTTP call)
      setTimeout(() => {
        const currentState = this._state$.getValue();
        const currentGoal = currentState.goal;

        if (!currentGoal) {
          observer.error(new Error('No goal exists'));
          return;
        }

        // Calculate new value (capped at target)
        const newValue = Math.min(
          currentGoal.currentValue + dto.value,
          currentGoal.targetValue
        );

        // Create progress entry
        const entry: ProgressEntry = {
          id: this.generateId(),
          value: dto.value,
          timestamp: new Date(),
          note: dto.note
        };

        // Update milestones
        const newPercentage = (newValue / currentGoal.targetValue) * 100;
        const updatedMilestones = this.updateMilestones(
          currentGoal.milestones,
          newPercentage
        );

        // Create updated goal
        const updatedGoal: Goal = {
          ...currentGoal,
          currentValue: newValue,
          status: getStatusFromPercentage(newPercentage),
          history: [...currentGoal.history, entry],
          milestones: updatedMilestones,
          updatedAt: new Date()
        };

        // Update state
        this.updateState({ goal: updatedGoal });
        this._goalSignal.set(updatedGoal);

        observer.next(updatedGoal);
        observer.complete();
      }, 100); // Simulated network delay
    });
  }

  /**
   * Set progress to a specific value (from slider)
   * @param value - The absolute value to set (0-100)
   * @returns Observable<Goal> - The updated goal
   */
  setProgress(value: number): Observable<Goal> {
    return new Observable<Goal>(observer => {
      setTimeout(() => {
        const currentState = this._state$.getValue();
        const currentGoal = currentState.goal;

        if (!currentGoal) {
          observer.error(new Error('No goal exists'));
          return;
        }

        // Clamp value
        const clampedValue = Math.max(0, Math.min(value, currentGoal.targetValue));
        const newPercentage = (clampedValue / currentGoal.targetValue) * 100;

        // Update milestones
        const updatedMilestones = this.updateMilestones(
          currentGoal.milestones,
          newPercentage
        );

        // Create updated goal
        const updatedGoal: Goal = {
          ...currentGoal,
          currentValue: clampedValue,
          status: getStatusFromPercentage(newPercentage),
          milestones: updatedMilestones,
          updatedAt: new Date()
        };

        // Update state
        this.updateState({ goal: updatedGoal });
        this._goalSignal.set(updatedGoal);

        observer.next(updatedGoal);
        observer.complete();
      }, 50);
    });
  }

  /**
   * Reset the goal progress to zero
   * @returns Observable<Goal> - The reset goal
   * 
   * Future MongoDB: PUT /api/goals/:id/reset
   */
  reset(): Observable<Goal> {
    return new Observable<Goal>(observer => {
      setTimeout(() => {
        const currentState = this._state$.getValue();
        const currentGoal = currentState.goal;

        if (!currentGoal) {
          observer.error(new Error('No goal exists'));
          return;
        }

        // Reset milestones
        const resetMilestones = currentGoal.milestones.map(m => ({
          ...m,
          reached: false,
          reachedAt: undefined
        }));

        // Create reset goal
        const resetGoal: Goal = {
          ...currentGoal,
          currentValue: 0,
          status: GoalStatus.NOT_STARTED,
          milestones: resetMilestones,
          history: [], // Clear history on reset
          updatedAt: new Date()
        };

        // Update state
        this.updateState({ goal: resetGoal });
        this._goalSignal.set(resetGoal);

        observer.next(resetGoal);
        observer.complete();
      }, 100);
    });
  }

  /**
   * Get the progress history
   * @returns Observable<ProgressEntry[]> - The history entries
   * 
   * Future MongoDB: GET /api/goals/:id/history
   */
  getHistory(): Observable<ProgressEntry[]> {
    return this.history$.pipe(delay(50)); // Simulated delay
  }

  /**
   * Get the current goal
   * @returns Observable<Goal | null>
   * 
   * Future MongoDB: GET /api/goals/:id
   */
  getGoal(): Observable<Goal | null> {
    return this.goal$.pipe(delay(50));
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private createDefaultGoal(): Goal {
    return {
      title: 'Daily Progress Goal',
      description: 'Track your daily progress towards completion',
      targetValue: 100,
      currentValue: 0,
      status: GoalStatus.NOT_STARTED,
      milestones: this.createDefaultMilestones(),
      history: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createDefaultMilestones(): Milestone[] {
    return [
      { id: '1', name: 'Getting Started', targetPercentage: 25, reached: false },
      { id: '2', name: 'Halfway There', targetPercentage: 50, reached: false },
      { id: '3', name: 'Almost Done', targetPercentage: 75, reached: false },
      { id: '4', name: 'Goal Complete!', targetPercentage: 100, reached: false }
    ];
  }

  private updateMilestones(milestones: Milestone[], percentage: number): Milestone[] {
    return milestones.map(milestone => {
      if (!milestone.reached && percentage >= milestone.targetPercentage) {
        return {
          ...milestone,
          reached: true,
          reachedAt: new Date()
        };
      }
      // Handle case where percentage drops below milestone (from reset or slider)
      if (milestone.reached && percentage < milestone.targetPercentage) {
        return {
          ...milestone,
          reached: false,
          reachedAt: undefined
        };
      }
      return milestone;
    });
  }

  private updateState(partial: Partial<ProgressState>): void {
    this._state$.next({
      ...this._state$.getValue(),
      ...partial
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

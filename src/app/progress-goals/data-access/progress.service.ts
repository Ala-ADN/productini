import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import {
  Goal,
  ProgressEntry,
  Milestone,
  AddProgressDto,
  ProgressState
} from '../models/goal.interface';
import { GoalStatus, getStatusFromPercentage } from '../models/status.enum';

/**
 * ProgressService - Data Access Layer
 * 
 * This service manages goal progress state with MongoDB backend.
 * Uses HttpClient for API calls to Express server.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/goals';

  // ============================================
  // Private State
  // ============================================
  
  private readonly _state$ = new BehaviorSubject<ProgressState>({
    goal: null,
    loading: false,
    error: null
  });

  private readonly _goalId = signal<string | null>(null);

  // ============================================
  // Public Observables
  // ============================================
  
  readonly state$: Observable<ProgressState> = this._state$.asObservable();
  
  readonly goal$: Observable<Goal | null> = this._state$.pipe(
    map(state => state.goal)
  );

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
  // Signal-based State
  // ============================================
  
  private readonly _goalSignal = signal<Goal | null>(null);
  
  readonly goalSignal = this._goalSignal.asReadonly();
  
  readonly percentageSignal = computed(() => {
    const goal = this._goalSignal();
    return goal ? (goal.currentValue / goal.targetValue) * 100 : 0;
  });

  readonly statusSignal = computed(() => {
    const percentage = this.percentageSignal();
    return getStatusFromPercentage(percentage);
  });

  readonly isCompleteSignal = computed(() => this.statusSignal() === GoalStatus.COMPLETED);

  constructor() {
    this.initializeGoal();
  }

  // ============================================
  // Initialization
  // ============================================

  private initializeGoal(): void {
    this.updateState({ loading: true });
    
    this.http.get<Goal[]>(this.API_URL).pipe(
      tap(goals => {
        if (goals && goals.length > 0) {
          const goal = this.mapGoalFromApi(goals[0]);
          this._goalId.set(goal._id || null);
          this.updateState({ goal, loading: false });
          this._goalSignal.set(goal);
        } else {
          // No goals in DB, use local default
          const localGoal = this.createDefaultGoal();
          this.updateState({ goal: localGoal, loading: false });
          this._goalSignal.set(localGoal);
        }
      }),
      catchError(error => {
        console.error('Failed to fetch goals:', error);
        this.updateState({ error: 'Failed to connect to server', loading: false });
        const localGoal = this.createDefaultGoal();
        this.updateState({ goal: localGoal });
        this._goalSignal.set(localGoal);
        return of([]);
      })
    ).subscribe();
  }

  // ============================================
  // Public Methods (MongoDB API)
  // ============================================

  addProgress(dto: AddProgressDto): Observable<Goal> {
    const goalId = this._goalId();
    if (!goalId) {
      return this.addProgressLocal(dto);
    }

    return this.http.post<Goal>(`${this.API_URL}/${goalId}/add-progress`, dto).pipe(
      map(goal => this.mapGoalFromApi(goal)),
      tap(goal => {
        this.updateState({ goal });
        this._goalSignal.set(goal);
      }),
      catchError(error => {
        console.error('API Error, falling back to local:', error);
        return this.addProgressLocal(dto);
      })
    );
  }

  setProgress(value: number): Observable<Goal> {
    const goalId = this._goalId();
    if (!goalId) {
      return this.setProgressLocal(value);
    }

    return this.http.put<Goal>(`${this.API_URL}/${goalId}/progress`, { value }).pipe(
      map(goal => this.mapGoalFromApi(goal)),
      tap(goal => {
        this.updateState({ goal });
        this._goalSignal.set(goal);
      }),
      catchError(error => {
        console.error('API Error, falling back to local:', error);
        return this.setProgressLocal(value);
      })
    );
  }

  reset(): Observable<Goal> {
    const goalId = this._goalId();
    if (!goalId) {
      return this.resetLocal();
    }

    return this.http.post<Goal>(`${this.API_URL}/${goalId}/reset`, {}).pipe(
      map(goal => this.mapGoalFromApi(goal)),
      tap(goal => {
        this.updateState({ goal });
        this._goalSignal.set(goal);
      }),
      catchError(error => {
        console.error('API Error, falling back to local:', error);
        return this.resetLocal();
      })
    );
  }

  getHistory(): Observable<ProgressEntry[]> {
    return this.history$;
  }

  getGoal(): Observable<Goal | null> {
    return this.goal$;
  }

  // ============================================
  // Local Fallback Methods
  // ============================================

  private addProgressLocal(dto: AddProgressDto): Observable<Goal> {
    return new Observable<Goal>(observer => {
      const currentState = this._state$.getValue();
      const currentGoal = currentState.goal;

      if (!currentGoal) {
        observer.error(new Error('No goal exists'));
        return;
      }

      const newValue = Math.min(currentGoal.currentValue + dto.value, currentGoal.targetValue);
      const entry: ProgressEntry = {
        id: this.generateId(),
        value: dto.value,
        timestamp: new Date(),
        note: dto.note
      };

      const newPercentage = (newValue / currentGoal.targetValue) * 100;
      const updatedGoal: Goal = {
        ...currentGoal,
        currentValue: newValue,
        status: getStatusFromPercentage(newPercentage),
        history: [...currentGoal.history, entry],
        milestones: this.updateMilestones(currentGoal.milestones, newPercentage),
        updatedAt: new Date()
      };

      this.updateState({ goal: updatedGoal });
      this._goalSignal.set(updatedGoal);
      observer.next(updatedGoal);
      observer.complete();
    });
  }

  private setProgressLocal(value: number): Observable<Goal> {
    return new Observable<Goal>(observer => {
      const currentState = this._state$.getValue();
      const currentGoal = currentState.goal;

      if (!currentGoal) {
        observer.error(new Error('No goal exists'));
        return;
      }

      const clampedValue = Math.max(0, Math.min(value, currentGoal.targetValue));
      const newPercentage = (clampedValue / currentGoal.targetValue) * 100;

      const updatedGoal: Goal = {
        ...currentGoal,
        currentValue: clampedValue,
        status: getStatusFromPercentage(newPercentage),
        milestones: this.updateMilestones(currentGoal.milestones, newPercentage),
        updatedAt: new Date()
      };

      this.updateState({ goal: updatedGoal });
      this._goalSignal.set(updatedGoal);
      observer.next(updatedGoal);
      observer.complete();
    });
  }

  private resetLocal(): Observable<Goal> {
    return new Observable<Goal>(observer => {
      const currentState = this._state$.getValue();
      const currentGoal = currentState.goal;

      if (!currentGoal) {
        observer.error(new Error('No goal exists'));
        return;
      }

      const resetGoal: Goal = {
        ...currentGoal,
        currentValue: 0,
        status: GoalStatus.NOT_STARTED,
        milestones: currentGoal.milestones.map(m => ({ ...m, reached: false, reachedAt: undefined })),
        history: [],
        updatedAt: new Date()
      };

      this.updateState({ goal: resetGoal });
      this._goalSignal.set(resetGoal);
      observer.next(resetGoal);
      observer.complete();
    });
  }

  // ============================================
  // Private Helpers
  // ============================================

  private mapGoalFromApi(apiGoal: any): Goal {
    return {
      _id: apiGoal._id,
      title: apiGoal.title,
      description: apiGoal.description,
      targetValue: apiGoal.targetValue,
      currentValue: apiGoal.currentValue,
      status: apiGoal.status as GoalStatus,
      milestones: apiGoal.milestones.map((m: any) => ({
        id: m._id || this.generateId(),
        name: m.name,
        targetPercentage: m.targetPercentage,
        reached: m.reached,
        reachedAt: m.reachedAt ? new Date(m.reachedAt) : undefined
      })),
      history: apiGoal.history.map((h: any) => ({
        id: h._id || this.generateId(),
        value: h.value,
        timestamp: new Date(h.timestamp),
        note: h.note
      })),
      createdAt: new Date(apiGoal.createdAt),
      updatedAt: new Date(apiGoal.updatedAt)
    };
  }

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
        return { ...milestone, reached: true, reachedAt: new Date() };
      }
      if (milestone.reached && percentage < milestone.targetPercentage) {
        return { ...milestone, reached: false, reachedAt: undefined };
      }
      return milestone;
    });
  }

  private updateState(partial: Partial<ProgressState>): void {
    this._state$.next({ ...this._state$.getValue(), ...partial });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

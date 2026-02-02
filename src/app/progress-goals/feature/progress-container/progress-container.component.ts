import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  computed,
  signal,
  ViewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProgressService } from '../../data-access/progress.service';
import { ProgressBarComponent } from '../../ui/progress-bar/progress-bar.component';
import { GoalInputComponent } from '../../ui/goal-input/goal-input.component';
import { MilestoneListComponent } from '../../ui/milestone-list/milestone-list.component';
import { GoalStatus } from '../../models/status.enum';
import { PercentagePipe } from '../../utils/percentage.pipe';

/**
 * ProgressContainerComponent - Smart (Container) Component
 * 
 * Orchestrates the Progress & Goals widget by:
 * - Injecting and managing the ProgressService
 * - Using toSignal() to convert Observable streams to Signals
 * - Using computed() for derived state
 * - Using effect() for side effects (milestone notifications)
 * - Assembling presentational components
 */
@Component({
  selector: 'app-progress-container',
  standalone: true,
  imports: [
    ProgressBarComponent,
    GoalInputComponent,
    MilestoneListComponent,
    PercentagePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-widget">
      <!-- Header -->
      <header class="widget-header">
        <div class="header-content">
          <h2 class="widget-title">{{ goal()?.title ?? 'Progress Tracker' }}</h2>
          <span class="status-badge" [class]="statusClass()">
            {{ statusLabel() }}
          </span>
        </div>
        @if (goal()?.description) {
          <p class="widget-description">{{ goal()?.description }}</p>
        }
      </header>

      <!-- Main Progress Display -->
      <section class="progress-section">
        <div class="percentage-display">
          <span class="percentage-value">{{ percentage() | percentage }}</span>
          <span class="percentage-label">Complete</span>
        </div>
        
        <app-progress-bar
          [value]="percentage()"
          [showLabel]="false"
        />
      </section>

      <!-- Input Controls -->
      <section class="input-section">
        <app-goal-input
          #goalInput
          (setValue)="onSetValue($event)"
          (addProgress)="onAddProgress($event)"
        />
      </section>

      <!-- Milestones -->
      <section class="milestones-section">
        <app-milestone-list
          [milestones]="milestones()"
          [currentPercentage]="percentage()"
        />
      </section>

      <!-- Actions -->
      <footer class="widget-footer">
        <button
          type="button"
          class="reset-btn"
          (click)="onReset()"
          [disabled]="percentage() === 0"
        >
          Reset Progress
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .progress-widget {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      padding: 24px;
      max-width: 420px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .widget-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .widget-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .widget-description {
      margin: 8px 0 0;
      font-size: 14px;
      color: #6b7280;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.not-started {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.in-progress {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-badge.halfway {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.almost-done {
      background: #fce7f3;
      color: #be185d;
    }

    .status-badge.completed {
      background: #d1fae5;
      color: #059669;
    }

    .progress-section {
      margin-bottom: 24px;
    }

    .percentage-display {
      text-align: center;
      margin-bottom: 16px;
    }

    .percentage-value {
      display: block;
      font-size: 56px;
      font-weight: 800;
      color: #111827;
      line-height: 1;
    }

    .percentage-label {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .milestones-section {
      margin-bottom: 24px;
    }

    .widget-footer {
      display: flex;
      justify-content: center;
    }

    .reset-btn {
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      background: #fee2e2;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .reset-btn:hover:not(:disabled) {
      background: #fecaca;
    }

    .reset-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ProgressContainerComponent {
  private readonly progressService = inject(ProgressService);

  @ViewChild('goalInput') goalInputRef?: GoalInputComponent;

  // ============================================
  // Signal State (using toSignal for RxJS interop)
  // ============================================

  /** Goal signal from service Observable */
  readonly goal = toSignal(this.progressService.goal$, { initialValue: null });

  /** Percentage signal from service Observable */
  readonly percentage = toSignal(this.progressService.percentage$, { initialValue: 0 });

  /** Milestones signal from service Observable */
  readonly milestones = toSignal(this.progressService.milestones$, { initialValue: [] });

  // ============================================
  // Computed Signals (derived state)
  // ============================================

  /** Computed status from current percentage */
  readonly status = computed(() => {
    const pct = this.percentage();
    if (pct >= 100) return GoalStatus.COMPLETED;
    if (pct >= 75) return GoalStatus.ALMOST_DONE;
    if (pct >= 50) return GoalStatus.HALFWAY;
    if (pct > 0) return GoalStatus.IN_PROGRESS;
    return GoalStatus.NOT_STARTED;
  });

  /** Computed CSS class for status badge */
  readonly statusClass = computed(() => {
    const status = this.status();
    return {
      [GoalStatus.NOT_STARTED]: 'not-started',
      [GoalStatus.IN_PROGRESS]: 'in-progress',
      [GoalStatus.HALFWAY]: 'halfway',
      [GoalStatus.ALMOST_DONE]: 'almost-done',
      [GoalStatus.COMPLETED]: 'completed'
    }[status];
  });

  /** Computed display label for status */
  readonly statusLabel = computed(() => {
    const status = this.status();
    return {
      [GoalStatus.NOT_STARTED]: 'Not Started',
      [GoalStatus.IN_PROGRESS]: 'In Progress',
      [GoalStatus.HALFWAY]: 'Halfway',
      [GoalStatus.ALMOST_DONE]: 'Almost Done',
      [GoalStatus.COMPLETED]: 'Complete!'
    }[status];
  });

  /** Computed check if goal is complete */
  readonly isComplete = computed(() => this.status() === GoalStatus.COMPLETED);

  // ============================================
  // Milestone tracking for effect
  // ============================================

  private readonly previousMilestonesReached = signal<Set<string>>(new Set());

  constructor() {
    // Effect to detect milestone achievements and trigger notifications
    effect(() => {
      const currentMilestones = this.milestones();
      const previousReached = this.previousMilestonesReached();

      for (const milestone of currentMilestones) {
        if (milestone.reached && !previousReached.has(milestone.id)) {
          // New milestone reached - trigger notification
          this.onMilestoneReached(milestone.name, milestone.targetPercentage);
        }
      }

      // Update tracking set
      const newReached = new Set(
        currentMilestones.filter(m => m.reached).map(m => m.id)
      );
      this.previousMilestonesReached.set(newReached);
    });
  }

  // ============================================
  // Event Handlers
  // ============================================

  /** Handle slider value change */
  onSetValue(value: number): void {
    this.progressService.setProgress(value).subscribe();
  }

  /** Handle quick add button click */
  onAddProgress(amount: number): void {
    this.progressService.addProgress({ value: amount }).subscribe();
  }

  /** Handle reset button click */
  onReset(): void {
    this.progressService.reset().subscribe(() => {
      // Sync the input component slider
      this.goalInputRef?.updateValue(0);
      this.previousMilestonesReached.set(new Set());
    });
  }

  // ============================================
  // Side Effects
  // ============================================

  /** Called when a milestone is reached */
  private onMilestoneReached(name: string, percentage: number): void {
    console.log(`🎉 Milestone Reached: ${name} (${percentage}%)`);
    
    // Could add toast notification, sound, or animation here
    if (percentage === 100) {
      console.log('🏆 Goal Complete! Congratulations!');
    }
  }
}

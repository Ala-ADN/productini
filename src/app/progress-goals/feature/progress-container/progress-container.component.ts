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
import { DecimalPipe } from '@angular/common';

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
    DecimalPipe,
    ProgressBarComponent,
    GoalInputComponent,
    MilestoneListComponent,
    PercentagePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-widget">
      <div class="widget-header">
        <h2 class="widget-title">{{ goal()?.title || 'Progress Tracker' }}</h2>
        <span class="status-badge">{{ percentage() === 0 ? 'Not Started' : percentage() >= 100 ? 'Complete!' : 'In Progress' }}</span>
      </div>
      
      @if (goal()?.description) {
        <p class="widget-description">{{ goal()?.description }}</p>
      }
      
      <div class="progress-display">
        <div class="percentage-circle">
          <span class="percentage-value">{{ percentage() | number:'1.0-0' }}%</span>
          <span class="percentage-label">Complete</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-section">
        <app-progress-bar
          [value]="percentage()"
          [showLabel]="true"
        />
      </div>
      
      <div class="progress-info">
        <div class="info-item">
          <span class="info-label">Current</span>
          <span class="info-value">{{ goal()?.currentValue || 0 }}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Target</span>
          <span class="info-value">{{ goal()?.targetValue || 100 }}</span>
        </div>
      </div>

      <!-- Input Controls -->
      <div class="input-section">
        <app-goal-input
          (setValue)="onSetValue($event)"
          (addProgress)="onAddProgress($event)"
        />
      </div>

      <!-- Milestones -->
      <div class="milestones-section">
        <app-milestone-list
          [milestones]="milestones()"
          [currentPercentage]="percentage()"
        />
      </div>

      <!-- Reset Button -->
      <div class="actions-section">
        <button
          type="button"
          class="reset-btn"
          (click)="onReset()"
          [disabled]="percentage() === 0"
        >
          🔄 Reset Progress
        </button>
      </div>
    </div>
  `,
  styles: [`
    .progress-widget {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 2.5rem;
      max-width: 500px;
      margin: 0 auto;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .widget-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      flex: 1;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      white-space: nowrap;
    }

    .widget-description {
      margin: 0 0 2rem;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .progress-display {
      display: flex;
      justify-content: center;
      margin: 2.5rem 0;
    }

    .percentage-circle {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
      position: relative;
    }

    .percentage-circle::before {
      content: '';
      position: absolute;
      inset: 8px;
      background: white;
      border-radius: 50%;
    }

    .percentage-value {
      position: relative;
      z-index: 1;
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .percentage-label {
      position: relative;
      z-index: 1;
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .progress-info {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 12px;
      margin-top: 2rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .info-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .info-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
    }

    .info-divider {
      width: 1px;
      height: 3rem;
      background: #e5e7eb;
    }

    .progress-bar-section {
      margin: 2rem 0;
    }

    .input-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .milestones-section {
      margin: 2rem 0;
    }

    .actions-section {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }

    .reset-btn {
      padding: 0.75rem 2rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      background: #fee2e2;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .reset-btn:hover:not(:disabled) {
      background: #fecaca;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
    }

    .reset-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .reset-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .progress-widget {
        padding: 1.5rem;
      }

      .widget-title {
        font-size: 1.25rem;
      }

      .percentage-circle {
        width: 160px;
        height: 160px;
      }

      .percentage-value {
        font-size: 2.5rem;
      }

      .info-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ProgressContainerComponent {
  private readonly progressService = inject(ProgressService);

  // Connect to real service data
  readonly goal = toSignal(this.progressService.goal$, { initialValue: null });
  readonly percentage = toSignal(this.progressService.percentage$, { initialValue: 0 });
  readonly milestones = toSignal(this.progressService.milestones$, { initialValue: [] });

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
    this.progressService.reset().subscribe();
  }
}

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
import { PlanService } from '../../data-access/plan.service';
import { ProgressBarComponent } from '../../ui/progress-bar/progress-bar.component';
import { GoalInputComponent } from '../../ui/goal-input/goal-input.component';
import { MilestoneListComponent } from '../../ui/milestone-list/milestone-list.component';
import { PlanSelectorComponent } from '../../ui/plan-selector/plan-selector.component';
import { TaskItemComponent } from '../../ui/task-item/task-item.component';
import { PlanCreatorComponent } from '../../ui/plan-creator/plan-creator.component';
import { GoalStatus } from '../../models/status.enum';
import { CreatePlanDto } from '../../models/goal.interface';

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
    PlanSelectorComponent,
    TaskItemComponent,
    PlanCreatorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
      <!-- Sidebar: Plan Selector -->
      <aside class="sidebar">
        <app-plan-selector
          [plans]="planService.plans()"
          [activePlanId]="planService.activePlanId()"
          (selectPlan)="onSelectPlan($event)"
          (createPlan)="onCreatePlan()"
        />
      </aside>

      <!-- Main Content: Active Plan Details -->
      <main class="main-content">
        @if (planService.activePlan(); as plan) {
          <div class="plan-details">
            <!-- Header -->
            <header class="plan-header">
              <div class="header-content">
                <h2 class="plan-title">{{ plan.name }}</h2>
                @if (planService.activePlanMetrics(); as metrics) {
                  <span class="status-badge">
                    {{ metrics.completedTaskCount }} / {{ metrics.totalTaskCount }} tasks
                  </span>
                }
              </div>
              @if (plan.description) {
                <p class="plan-description">{{ plan.description }}</p>
              }
            </header>

            <!-- Progress Display -->
            <section class="progress-section">
              <div class="percentage-circle">
                <span class="percentage-value">
                  {{ planService.activePercentage() | number:'1.0-0' }}%
                </span>
                <span class="percentage-label">Complete</span>
              </div>
              
              <app-progress-bar
                [value]="planService.activePercentage()"
                [showLabel]="false"
              />

              @if (planService.activePlanMetrics(); as metrics) {
                <div class="metrics-grid">
                  <div class="metric-card">
                    <span class="metric-label">Completed Weight</span>
                    <span class="metric-value">{{ metrics.completedWeight }}</span>
                  </div>
                  <div class="metric-card">
                    <span class="metric-label">Total Weight</span>
                    <span class="metric-value">{{ metrics.totalWeight }}</span>
                  </div>
                </div>
              }
            </section>

            <!-- Task List -->
            <section class="tasks-section">
              <h3 class="section-title">Tasks</h3>
              <div class="task-list">
                @for (task of plan.tasks; track task.id) {
                  <app-task-item
                    [task]="task"
                    (toggleTask)="onToggleTask($event)"
                  />
                } @empty {
                  <div class="empty-tasks">
                    <p>No tasks yet. Add tasks to start tracking progress!</p>
                  </div>
                }
              </div>
            </section>
          </div>
        } @else {
          <div class="empty-plan">
            <h3>No Plan Selected</h3>
            <p>Select a plan from the sidebar or create a new one to get started.</p>
          </div>
        }
      </main>

      <!-- Plan Creator Modal -->
      @if (showCreator()) {
        <app-plan-creator
          (createPlan)="onPlanCreate($event)"
          (cancel)="onCloseCreator()"
        />
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .sidebar {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      height: fit-content;
      position: sticky;
      top: 2rem;
    }

    .main-content {
      background: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      min-height: 500px;
    }

    .plan-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .plan-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
    }

    .plan-description {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
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

    .progress-section {
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-radius: 12px;
    }

    .percentage-circle {
      width: 160px;
      height: 160px;
      margin: 0 auto 1.5rem;
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
      inset: 6px;
      background: white;
      border-radius: 50%;
    }

    .percentage-value {
      position: relative;
      z-index: 1;
      font-size: 2.5rem;
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
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .metric-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .tasks-section {
      margin-top: 2rem;
    }

    .section-title {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-tasks,
    .empty-plan {
      text-align: center;
      padding: 3rem 2rem;
      color: #9ca3af;
    }

    .empty-plan h3 {
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .empty-plan p,
    .empty-tasks p {
      margin: 0;
      font-size: 0.875rem;
    }

    @media (max-width: 1024px) {
      .dashboard-container {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem;
      }

      .plan-title {
        font-size: 1.5rem;
      }

      .percentage-circle {
        width: 140px;
        height: 140px;
      }

      .percentage-value {
        font-size: 2rem;
      }
    }
  `]
})
export class ProgressContainerComponent {
  readonly planService = inject(PlanService);
  
  /** Modal visibility state */
  readonly showCreator = signal<boolean>(false);

  constructor() {
    // Effect: Trigger notification when any plan reaches 100%
    effect(() => {
      const percentage = this.planService.activePercentage();
      const plan = this.planService.activePlan();
      
      if (percentage >= 100 && plan) {
        this.onPlanComplete(plan.name);
      }
    });
  }

  /** Handle plan selection */
  onSelectPlan(planId: string): void {
    this.planService.setActivePlan(planId);
  }

  /** Handle task toggle */
  onToggleTask(taskId: string): void {
    const activePlanId = this.planService.activePlanId();
    if (activePlanId) {
      this.planService.toggleTask(activePlanId, taskId).subscribe();
    }
  }

  /** Handle create new plan button click */
  onCreatePlan(): void {
    this.showCreator.set(true);
  }

  /** Handle plan creation from modal */
  onPlanCreate(dto: CreatePlanDto): void {
    this.planService.createPlan(dto).subscribe({
      next: (plan) => {
        console.log('✅ Plan created successfully:', plan.name);
        this.showCreator.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to create plan:', error);
        // TODO: Show error toast/notification
      }
    });
  }

  /** Handle modal close */
  onCloseCreator(): void {
    this.showCreator.set(false);
  }

  /** Triggered when plan reaches 100% */
  private onPlanComplete(planName: string): void {
    console.log(`🎉 Plan "${planName}" Complete! Congratulations!`);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎯 Plan Complete!', {
        body: `Congratulations! You've completed "${planName}"!`,
        icon: '/favicon.ico'
      });
    }
  }
}

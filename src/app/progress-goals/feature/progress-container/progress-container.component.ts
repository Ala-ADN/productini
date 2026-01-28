import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ProgressService } from '../../data-access/progress.service';
import { ProgressBarComponent } from '../../ui/progress-bar/progress-bar.component';

/**
 * ProgressContainerComponent - Smart (Container) Component
 * 
 * Displays progress based on completed todos from Dexie database
 */
@Component({
  selector: 'app-progress-container',
  standalone: true,
  imports: [
    DecimalPipe,
    ProgressBarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-dashboard">
      <!-- Header -->
      <header class="dashboard-header">
        <h2 class="dashboard-title">📊 Task Progress</h2>
        <p class="dashboard-subtitle">Track your productivity and task completion</p>
      </header>

      <!-- Main Progress Display -->
      <section class="progress-section">
        <div class="percentage-circle">
          <span class="percentage-value">
            {{ progressService.percentage() | number:'1.0-0' }}%
          </span>
          <span class="percentage-label">Complete</span>
        </div>
        
        <app-progress-bar
          [value]="progressService.percentage()"
          [showLabel]="false"
        />

        <div class="task-summary">
          <span class="task-count">
            {{ progressService.completedTasks() }} / {{ progressService.totalTasks() }} tasks completed
          </span>
          <span class="status-badge" [class]="'status-' + progressService.status()">
            {{ getStatusText() }}
          </span>
        </div>
      </section>

      <!-- Priority Breakdown -->
      @if (progressService.stats(); as stats) {
        <section class="breakdown-section">
          <h3 class="section-title">By Priority</h3>
          <div class="priority-grid">
            <div class="priority-card high">
              <div class="priority-icon">🔴</div>
              <div class="priority-stats">
                <span class="priority-label">High</span>
                <span class="priority-count">
                  {{ stats.tasksByPriority.high.completed }} / {{ stats.tasksByPriority.high.total }}
                </span>
              </div>
            </div>
            
            <div class="priority-card medium">
              <div class="priority-icon">🟡</div>
              <div class="priority-stats">
                <span class="priority-label">Medium</span>
                <span class="priority-count">
                  {{ stats.tasksByPriority.medium.completed }} / {{ stats.tasksByPriority.medium.total }}
                </span>
              </div>
            </div>
            
            <div class="priority-card low">
              <div class="priority-icon">🟢</div>
              <div class="priority-stats">
                <span class="priority-label">Low</span>
                <span class="priority-count">
                  {{ stats.tasksByPriority.low.completed }} / {{ stats.tasksByPriority.low.total }}
                </span>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- Quick Stats -->
      <section class="stats-section">
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-content">
            <span class="stat-label">Pending</span>
            <span class="stat-value">{{ progressService.totalTasks() - progressService.completedTasks() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-content">
            <span class="stat-label">Completed</span>
            <span class="stat-value">{{ progressService.completedTasks() }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .progress-dashboard {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .dashboard-title {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .dashboard-subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .progress-section {
      background: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .percentage-circle {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 160px;
      height: 160px;
      margin: 0 auto 1.5rem auto;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
    }

    .percentage-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
    }

    .percentage-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.25rem;
    }

    .task-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .task-count {
      font-size: 1rem;
      color: #374151;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-NOT_STARTED {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-IN_PROGRESS {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-HALFWAY {
      background: #fef3c7;
      color: #92400e;
    }

    .status-ALMOST_DONE {
      background: #fce7f3;
      color: #831843;
    }

    .status-COMPLETED {
      background: #d1fae5;
      color: #065f46;
    }

    .breakdown-section,
    .stats-section {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .section-title {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
    }

    .priority-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .priority-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
    }

    .priority-icon {
      font-size: 1.5rem;
    }

    .priority-stats {
      display: flex;
      flex-direction: column;
    }

    .priority-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
    }

    .priority-count {
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border: 2px solid #e5e7eb;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.875rem;
      font-weight: 800;
      color: #111827;
      line-height: 1;
    }

    @media (max-width: 768px) {
      .progress-dashboard {
        padding: 1rem;
      }

      .priority-grid {
        grid-template-columns: 1fr;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProgressContainerComponent {
  protected readonly progressService = inject(ProgressService);

  protected getStatusText(): string {
    const status = this.progressService.status();
    switch (status) {
      case 'NOT_STARTED': return 'Not Started';
      case 'IN_PROGRESS': return 'In Progress';
      case 'HALFWAY': return 'Halfway';
      case 'ALMOST_DONE': return 'Almost Done';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  }
}

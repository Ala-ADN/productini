import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import { Task, calculateTaskWeight, TaskHardness } from '../../models/goal.interface';
import { DatePipe } from '@angular/common';

/**
 * TaskItemComponent - Presentational Component
 * 
 * Displays a single task with its weight, completion status,
 * and allows toggling completion.
 */
@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="task-item" [class.completed]="task().isCompleted">
      <div class="task-checkbox">
        <input
          type="checkbox"
          [checked]="task().isCompleted"
          (change)="onToggle()"
          [id]="'task-' + task().id"
          class="checkbox-input"
        />
        <label [for]="'task-' + task().id" class="checkbox-label"></label>
      </div>

      <div class="task-content">
        <div class="task-header">
          <h4 class="task-title">{{ task().title }}</h4>
          <div class="task-badges">
            <span class="badge hardness" [attr.data-hardness]="hardnessLevel()">
              {{ hardnessLevel() }}
            </span>
            <span class="badge weight">⚖️ {{ taskWeight() }}pts</span>
          </div>
        </div>
        
        @if (task().description) {
          <p class="task-description">{{ task().description }}</p>
        }

        <div class="task-meta">
          <span class="meta-item">
            ⏱️ {{ task().length }}h
          </span>
          @if (task().isCompleted && task().completedAt) {
            <span class="meta-item completed-date">
              ✓ {{ task().completedAt | date:'short' }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .task-item:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .task-item.completed {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .task-checkbox {
      flex-shrink: 0;
      position: relative;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }

    .checkbox-label {
      display: block;
      width: 24px;
      height: 24px;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .checkbox-input:checked + .checkbox-label {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
    }

    .checkbox-input:checked + .checkbox-label::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .checkbox-label:hover {
      border-color: #667eea;
    }

    .task-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .task-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .task-item.completed .task-title {
      text-decoration: line-through;
      color: #6b7280;
    }

    .task-badges {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge.hardness {
      background: #fef3c7;
      color: #d97706;
    }

    .badge.hardness[data-hardness="Easy"] {
      background: #d1fae5;
      color: #059669;
    }

    .badge.hardness[data-hardness="Hard"] {
      background: #fee2e2;
      color: #dc2626;
    }

    .badge.weight {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .task-description {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .meta-item.completed-date {
      color: #059669;
      font-weight: 600;
    }
  `]
})
export class TaskItemComponent {
  /** Signal Input: Task data */
  readonly task = input.required<Task>();

  /** Signal Output: Emitted when task completion is toggled */
  readonly toggleTask = output<string>();

  /** Computed: Task weight (hardness × length) */
  readonly taskWeight = computed(() => calculateTaskWeight(this.task()));

  /** Computed: Hardness level as string */
  readonly hardnessLevel = computed(() => {
    const hardness = this.task().hardness;
    return hardness === TaskHardness.EASY ? 'Easy' :
           hardness === TaskHardness.MEDIUM ? 'Medium' : 'Hard';
  });

  /** Handle checkbox toggle */
  onToggle(): void {
    this.toggleTask.emit(this.task().id);
  }
}

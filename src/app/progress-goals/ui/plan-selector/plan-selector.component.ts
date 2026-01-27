import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { Plan } from '../../models/goal.interface';

/**
 * PlanSelectorComponent - Presentational Component
 * 
 * Displays a list of available plans and allows selection.
 * Uses signal inputs and outputs for reactive communication.
 */
@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-selector">
      <h3 class="selector-title">My Plans</h3>
      <div class="plan-list">
        @for (plan of plans(); track plan._id) {
          <button
            type="button"
            class="plan-item"
            [class.active]="plan._id === activePlanId()"
            (click)="onSelectPlan(plan._id!)"
          >
            <span class="plan-icon">📋</span>
            <div class="plan-info">
              <span class="plan-name">{{ plan.name }}</span>
              @if (plan.description) {
                <span class="plan-desc">{{ plan.description }}</span>
              }
            </div>
          </button>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <p>No plans yet. Create your first plan!</p>
          </div>
        }
      </div>
      <button
        type="button"
        class="create-btn"
        (click)="onCreate()"
      >
        + New Plan
      </button>
    </div>
  `,
  styles: [`
    .plan-selector {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .selector-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
    }

    .plan-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .plan-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      background: #f9fafb;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .plan-item:hover {
      background: #f3f4f6;
      border-color: #e5e7eb;
    }

    .plan-item.active {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-color: #667eea;
    }

    .plan-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .plan-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .plan-name {
      font-weight: 600;
      color: #111827;
      font-size: 0.875rem;
    }

    .plan-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem 1rem;
      color: #9ca3af;
      text-align: center;
    }

    .empty-icon {
      font-size: 2.5rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .create-btn {
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .create-btn:hover {
      transform: translateY(-1px);
    }

    .create-btn:active {
      transform: translateY(0);
    }
  `]
})
export class PlanSelectorComponent {
  /** Signal Input: Array of available plans */
  readonly plans = input.required<Plan[]>();
  
  /** Signal Input: Currently active plan ID */
  readonly activePlanId = input<string | null>(null);

  /** Signal Output: Emitted when a plan is selected */
  readonly selectPlan = output<string>();
  
  /** Signal Output: Emitted when create new plan is clicked */
  readonly createPlan = output<void>();

  /** Handle plan selection */
  onSelectPlan(planId: string): void {
    this.selectPlan.emit(planId);
  }

  /** Handle create plan button */
  onCreate(): void {
    this.createPlan.emit();
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed
} from '@angular/core';
import { Milestone } from '../../models/goal.interface';

/**
 * MilestoneListComponent - Presentational (Dumb) Component
 * 
 * Displays a list of milestones with their completion status.
 * Uses signal inputs for reactive updates.
 * Uses OnPush change detection for performance.
 * 
 * Inputs:
 * - milestones: Milestone[] - Array of milestone objects
 * - currentPercentage: number - Current progress percentage
 */
@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="milestone-list">
      <h4 class="milestone-title">Milestones</h4>
      <ul class="milestones">
        @for (milestone of milestones(); track milestone.id) {
          <li 
            class="milestone-item"
            [class.reached]="milestone.reached"
            [class.next]="isNextMilestone(milestone)"
          >
            <span class="milestone-icon">
              @if (milestone.reached) {
                ✓
              } @else {
                ○
              }
            </span>
            <span class="milestone-info">
              <span class="milestone-name">{{ milestone.name }}</span>
              <span class="milestone-target">{{ milestone.targetPercentage }}%</span>
            </span>
            @if (milestone.reached && milestone.reachedAt) {
              <span class="milestone-time">
                {{ formatTime(milestone.reachedAt) }}
              </span>
            }
          </li>
        } @empty {
          <li class="milestone-empty">No milestones defined</li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .milestone-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .milestone-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .milestones {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .milestone-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .milestone-item.reached {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }

    .milestone-item.next {
      border-color: #4f46e5;
      border-style: dashed;
    }

    .milestone-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #9ca3af;
    }

    .milestone-item.reached .milestone-icon {
      background: #10b981;
      color: #fff;
    }

    .milestone-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .milestone-name {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .milestone-target {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
    }

    .milestone-time {
      font-size: 11px;
      color: #10b981;
    }

    .milestone-empty {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      padding: 16px;
    }
  `]
})
export class MilestoneListComponent {
  /** Array of milestones to display */
  readonly milestones = input.required<Milestone[]>();
  
  /** Current progress percentage */
  readonly currentPercentage = input<number>(0);

  /** Computed signal to find the next unreached milestone */
  private readonly nextMilestone = computed(() => {
    const milestones = this.milestones();
    return milestones.find(m => !m.reached);
  });

  /** Check if this milestone is the next to be reached */
  isNextMilestone(milestone: Milestone): boolean {
    const next = this.nextMilestone();
    return next?.id === milestone.id;
  }

  /** Format timestamp for display */
  formatTime(date: Date): string {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

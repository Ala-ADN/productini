import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed
} from '@angular/core';
import { ColorScaleDirective } from '../../utils/color-scale.directive';
import { PercentagePipe } from '../../utils/percentage.pipe';

/**
 * ProgressBarComponent - Presentational (Dumb) Component
 * 
 * Visualizes the progress percentage with a dynamic color bar.
 * Uses OnPush change detection for performance.
 * 
 * Inputs:
 * - value: number (0-100) - Current progress percentage
 * - showLabel: boolean - Whether to show percentage label
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [ColorScaleDirective, PercentagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-bar-wrapper">
      <div class="progress-bar-track">
        <div 
          class="progress-bar-fill"
          [appColorScale]="value()"
          [style.width.%]="clampedValue()"
        ></div>
      </div>
      @if (showLabel()) {
        <span class="progress-label">{{ value() | percentage }}</span>
      }
    </div>
  `,
  styles: [`
    .progress-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .progress-bar-track {
      flex: 1;
      height: 24px;
      background: #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 12px;
      transition: width 0.3s ease, background-color 0.3s ease;
      min-width: 0;
    }

    .progress-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      min-width: 48px;
      text-align: right;
    }
  `]
})
export class ProgressBarComponent {
  /** Current progress value (0-100) */
  readonly value = input.required<number>();
  
  /** Whether to show the percentage label */
  readonly showLabel = input<boolean>(true);

  /** Computed signal to clamp value between 0-100 */
  readonly clampedValue = computed(() => 
    Math.max(0, Math.min(100, this.value()))
  );
}

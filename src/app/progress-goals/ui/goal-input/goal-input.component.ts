import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * GoalInputComponent - Presentational (Dumb) Component
 * 
 * Provides input controls for adding progress or setting value directly.
 * Uses OnPush change detection for performance.
 * 
 * Outputs:
 * - addProgress: number - Emitted when user adds incremental progress
 * - setValue: number - Emitted when user sets value via slider
 */
@Component({
  selector: 'app-goal-input',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="goal-input-wrapper">
      <!-- Slider Control -->
      <div class="slider-section">
        <label class="slider-label">
          <span>Adjust Progress</span>
          <span class="slider-value">{{ sliderValue() }}%</span>
        </label>
        <input
          type="range"
          class="slider"
          [min]="0"
          [max]="100"
          [value]="sliderValue()"
          (input)="onSliderInput($event)"
          aria-label="Progress slider"
        />
        <div class="slider-markers">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Quick Add Buttons -->
      <div class="quick-add-section">
        <span class="quick-add-label">Quick Add:</span>
        <div class="quick-add-buttons">
          @for (amount of quickAddAmounts; track amount) {
            <button
              type="button"
              class="quick-add-btn"
              (click)="onQuickAdd(amount)"
              [disabled]="isAddDisabled(amount)"
            >
              +{{ amount }}%
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .goal-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .slider-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .slider-value {
      font-weight: 700;
      color: #4f46e5;
      font-size: 16px;
    }

    .slider {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #e5e7eb;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4f46e5;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
      transition: transform 0.15s ease;
    }

    .slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }

    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4f46e5;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
    }

    .slider-markers {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #9ca3af;
      padding: 0 2px;
    }

    .quick-add-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-add-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .quick-add-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quick-add-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .quick-add-btn:hover:not(:disabled) {
      background: #4f46e5;
      color: #fff;
      border-color: #4f46e5;
    }

    .quick-add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class GoalInputComponent {
  /** Output signal for adding incremental progress */
  readonly addProgress = output<number>();
  
  /** Output signal for setting value via slider */
  readonly setValue = output<number>();

  /** Internal slider value signal */
  readonly sliderValue = signal<number>(0);

  /** Quick add button amounts */
  readonly quickAddAmounts = [5, 10, 25] as const;

  /** Current max value that can be added */
  private readonly maxAddable = computed(() => 100 - this.sliderValue());

  /** Check if add amount would exceed 100% */
  isAddDisabled(amount: number): boolean {
    return this.sliderValue() + amount > 100;
  }

  /** Handle slider input changes */
  onSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    this.sliderValue.set(value);
    this.setValue.emit(value);
  }

  /** Handle quick add button clicks */
  onQuickAdd(amount: number): void {
    const newValue = Math.min(this.sliderValue() + amount, 100);
    this.sliderValue.set(newValue);
    this.addProgress.emit(amount);
    this.setValue.emit(newValue);
  }

  /** Update slider value from parent (for sync) */
  updateValue(value: number): void {
    this.sliderValue.set(Math.max(0, Math.min(100, value)));
  }
}

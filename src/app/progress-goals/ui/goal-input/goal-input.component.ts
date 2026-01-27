import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  computed,
  input,
  effect
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

/**
 * GoalInputComponent - Presentational (Dumb) Component
 * 
 * Provides input controls for adding progress or setting value directly.
 * Uses Reactive Forms for robust validation and state management.
 * Uses OnPush change detection for performance.
 * 
 * Inputs:
 * - currentValue: number - Current progress value (0-100)
 * - maxValue: number - Maximum allowed value (default 100)
 * 
 * Outputs:
 * - addProgress: number - Emitted when user adds incremental progress
 * - setValue: number - Emitted when user sets value via slider or form
 */
@Component({
  selector: 'app-goal-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="goal-input-wrapper">
      <!-- Direct Value Form -->
      <form [formGroup]="valueForm" (ngSubmit)="onSubmitValue()" class="value-form">
        <label class="form-label">
          <span>Set Progress Value:</span>
          <div class="input-group">
            <input
              type="number"
              formControlName="value"
              class="value-input"
              placeholder="0-100"
              aria-label="Progress value"
            />
            <button
              type="submit"
              class="submit-btn"
              [disabled]="valueForm.invalid"
            >
              Set
            </button>
          </div>
        </label>
        @if (valueForm.get('value')?.invalid && valueForm.get('value')?.touched) {
          <span class="error-text">Value must be between 0 and {{ maxValue() }}</span>
        }
      </form>

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
          [max]="maxValue()"
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

    .value-form {
      margin-bottom: 1rem;
    }

    .form-label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
    }

    .value-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .value-input:focus {
      border-color: #4f46e5;
    }

    .value-input:invalid {
      border-color: #ef4444;
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-text {
      color: #ef4444;
      font-size: 12px;
      margin-top: -0.25rem;
    }
  `]
})
export class GoalInputComponent {
  /** Signal Input: Current progress value */
  readonly currentValue = input<number>(0);
  
  /** Signal Input: Maximum allowed value */
  readonly maxValue = input<number>(100);

  /** Output signal for adding incremental progress */
  readonly addProgress = output<number>();
  
  /** Output signal for setting value directly */
  readonly setValue = output<number>();

  /** Reactive form for value input */
  readonly valueForm = new FormGroup({
    value: new FormControl<number>(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ])
  });

  /** Internal slider value signal */
  readonly sliderValue = signal<number>(0);

  /** Quick add button amounts */
  readonly quickAddAmounts = [5, 10, 25] as const;

  /** Check if add amount would exceed max */
  isAddDisabled(amount: number): boolean {
    return this.sliderValue() + amount > this.maxValue();
  }

  constructor() {
    // Sync slider with current value changes
    effect(() => {
      const current = this.currentValue();
      this.sliderValue.set(current);
      this.valueForm.patchValue({ value: current }, { emitEvent: false });
    });

    // Update form validator when maxValue changes
    effect(() => {
      const max = this.maxValue();
      this.valueForm.get('value')?.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(max)
      ]);
      this.valueForm.get('value')?.updateValueAndValidity();
    });
  }

  /** Handle form submission */
  onSubmitValue(): void {
    if (this.valueForm.valid) {
      const value = this.valueForm.value.value ?? 0;
      this.sliderValue.set(value);
      this.setValue.emit(value);
    }
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
    if (!this.isAddDisabled(amount)) {
      this.addProgress.emit(amount);
    }
  }
}

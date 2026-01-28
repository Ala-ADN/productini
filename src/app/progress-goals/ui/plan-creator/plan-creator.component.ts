import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { TaskHardness, CreatePlanDto } from '../../models/goal.interface';

/**
 * PlanCreatorComponent - Plan Creation Form
 * 
 * Uses Reactive Forms with FormArray for dynamic task management.
 * Allows users to create plans with weighted tasks.
 */
@Component({
  selector: 'app-plan-creator',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="creator-overlay" (click)="onCancel()">
      <div class="creator-modal" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>Create New Plan</h2>
          <button type="button" class="close-btn" (click)="onCancel()">✕</button>
        </header>

        <form [formGroup]="planForm" (ngSubmit)="onSubmit()" class="plan-form">
          <!-- Plan Details -->
          <section class="form-section">
            <div class="form-group">
              <label for="plan-name" class="form-label">Plan Name *</label>
              <input
                id="plan-name"
                type="text"
                formControlName="name"
                class="form-input"
                placeholder="e.g., Learn Angular"
              />
              @if (planForm.get('name')?.invalid && planForm.get('name')?.touched) {
                <span class="error-text">Plan name is required</span>
              }
            </div>

            <div class="form-group">
              <label for="plan-desc" class="form-label">Description</label>
              <textarea
                id="plan-desc"
                formControlName="description"
                class="form-input"
                rows="2"
                placeholder="Optional description..."
              ></textarea>
            </div>
          </section>

          <!-- Tasks Section -->
          <section class="form-section">
            <div class="section-header">
              <h3>Tasks</h3>
              <button
                type="button"
                class="add-task-btn"
                (click)="addTask()"
              >
                + Add Task
              </button>
            </div>

            <div formArrayName="tasks" class="tasks-list">
              @for (task of tasks.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="task-form-item">
                  <div class="task-form-header">
                    <span class="task-number">Task {{ i + 1 }}</span>
                    <button
                      type="button"
                      class="remove-btn"
                      (click)="removeTask(i)"
                      [disabled]="tasks.length === 1"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Title *</label>
                      <input
                        type="text"
                        formControlName="title"
                        class="form-input"
                        placeholder="Task title"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Description</label>
                      <input
                        type="text"
                        formControlName="description"
                        class="form-input"
                        placeholder="Optional details"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Hardness *</label>
                      <select formControlName="hardness" class="form-select">
                        <option [value]="TaskHardness.EASY">Easy (×1)</option>
                        <option [value]="TaskHardness.MEDIUM">Medium (×2)</option>
                        <option [value]="TaskHardness.HARD">Hard (×3)</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Time (hours) *</label>
                      <input
                        type="number"
                        formControlName="length"
                        class="form-input"
                        placeholder="Hours"
                        min="0.5"
                        step="0.5"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Weight</label>
                      <div class="weight-display">
                        {{ calculateWeight(i) }}
                      </div>
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="no-tasks">No tasks yet. Add your first task!</p>
              }
            </div>

            <div class="total-weight">
              <span>Total Plan Weight:</span>
              <strong>{{ calculateTotalWeight() }} points</strong>
            </div>
          </section>

          <!-- Form Actions -->
          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="planForm.invalid || isSubmitting()"
            >
              {{ isSubmitting() ? 'Creating...' : 'Create Plan' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .creator-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .creator-modal {
      background: white;
      border-radius: 16px;
      max-width: 700px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.25rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .plan-form {
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
    }

    .add-task-btn {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .add-task-btn:hover {
      transform: translateY(-1px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.flex-1 {
      flex: 1;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .form-input,
    .form-select {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: #667eea;
    }

    .form-input:invalid:not(:placeholder-shown) {
      border-color: #ef4444;
    }

    textarea.form-input {
      resize: vertical;
      font-family: inherit;
    }

    .error-text {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: -0.25rem;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-form-item {
      padding: 1rem;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
    }

    .task-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .task-number {
      font-weight: 700;
      color: #667eea;
      font-size: 0.875rem;
    }

    .remove-btn {
      padding: 0.375rem 0.75rem;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .remove-btn:hover:not(:disabled) {
      background: #fecaca;
    }

    .remove-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .weight-display {
      padding: 0.75rem;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 8px;
      font-weight: 700;
      text-align: center;
    }

    .total-weight {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 1rem;
    }

    .total-weight strong {
      color: #667eea;
      font-size: 1.25rem;
    }

    .no-tasks {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .form-row {
        flex-direction: column;
      }

      .creator-modal {
        max-height: 95vh;
      }
    }
  `]
})
export class PlanCreatorComponent {
  private fb = new FormBuilder();
  
  /** Expose TaskHardness enum to template */
  readonly TaskHardness = TaskHardness;

  /** Signal Output: Emitted when plan is created */
  readonly createPlan = output<CreatePlanDto>();
  
  /** Signal Output: Emitted when modal is closed */
  readonly cancel = output<void>();

  /** Loading state */
  readonly isSubmitting = signal<boolean>(false);

  /** Reactive Form */
  readonly planForm: FormGroup;

  constructor() {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      tasks: this.fb.array([this.createTaskFormGroup()])
    });
  }

  /** Get tasks FormArray */
  get tasks(): FormArray {
    return this.planForm.get('tasks') as FormArray;
  }

  /** Create a new task FormGroup */
  private createTaskFormGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      hardness: [TaskHardness.MEDIUM, [Validators.required]],
      length: [1, [Validators.required, Validators.min(0.5)]]
    });
  }

  /** Add a new task to the FormArray */
  addTask(): void {
    this.tasks.push(this.createTaskFormGroup());
  }

  /** Remove a task from the FormArray */
  removeTask(index: number): void {
    if (this.tasks.length > 1) {
      this.tasks.removeAt(index);
    }
  }

  /** Calculate weight for a specific task */
  calculateWeight(index: number): number {
    const task = this.tasks.at(index);
    const hardness = task.get('hardness')?.value || TaskHardness.MEDIUM;
    const length = task.get('length')?.value || 0;
    return hardness * length;
  }

  /** Calculate total weight of all tasks */
  calculateTotalWeight(): number {
    return this.tasks.controls.reduce((total, _, index) => {
      return total + this.calculateWeight(index);
    }, 0);
  }

  /** Handle form submission */
  onSubmit(): void {
    if (this.planForm.valid) {
      this.isSubmitting.set(true);
      
      const formValue = this.planForm.value;
      const dto: CreatePlanDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        tasks: formValue.tasks
      };

      this.createPlan.emit(dto);
    }
  }

  /** Handle cancel */
  onCancel(): void {
    this.cancel.emit();
  }
}

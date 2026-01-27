import { Component } from '@angular/core';

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [],
  templateUrl: './progress-indicator.component.html',
  styleUrl: './progress-indicator.component.css'
})
export class ProgressIndicatorComponent {
  // Local state - slider value (0-100)
  progressValue: number = 0;

  // Update progress when slider changes
  onSliderChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.progressValue = Number(target.value);
  }
}

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { PomodoroService } from '../services/pomodoro.service';
import { PomodoroShortcutsDirective } from '../directives/pomodoro-shortcuts.directive';
import { PomodoroStatsComponent } from '../pomodoro-stats/pomodoro-stats.component';

@Component({
  selector: 'app-pomodoro-widget',
  standalone: true,
  imports: [CommonModule, PomodoroShortcutsDirective, PomodoroStatsComponent],
  templateUrl: './pomodoro-widget.component.html',
  styleUrls: ['./pomodoro-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [PomodoroShortcutsDirective],
})
export class PomodoroWidgetComponent implements OnInit {
  // Inject the shared service
  constructor(
    public pomodoroService: PomodoroService,
    private location: Location,
  ) {}

  ngOnInit() {
    // Request notification permission when component initializes
    this.pomodoroService.requestNotificationPermission();
  }

  goBack() {
    this.location.back();
  }

  // Delegate all methods to the service
  get MODES() {
    return this.pomodoroService.MODES;
  }

  get mode() {
    return this.pomodoroService.mode;
  }

  get timeLeft() {
    return this.pomodoroService.timeLeft;
  }

  get isActive() {
    return this.pomodoroService.isActive;
  }

  get progress() {
    return this.pomodoroService.progress;
  }

  get formattedTime() {
    return this.pomodoroService.formattedTime;
  }

  get currentTask() {
    return this.pomodoroService.currentTask();
  }

  toggleTimer() {
    this.pomodoroService.toggleTimer();
  }

  switchMode(newMode: 'WORK' | 'BREAK') {
    this.pomodoroService.switchMode(newMode);
  }

  reset() {
    this.pomodoroService.reset();
  }

  updateWorkMinutes(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.pomodoroService.setWorkMinutes(value);
  }

  updateBreakMinutes(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.pomodoroService.setBreakMinutes(value);
  }
}

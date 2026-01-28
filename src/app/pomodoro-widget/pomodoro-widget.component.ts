import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../services/pomodoro.service';

@Component({
  selector: 'app-pomodoro-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pomodoro-widget.component.html',
  styleUrls: ['./pomodoro-widget.component.scss'],
})
export class PomodoroWidgetComponent implements OnInit {
  // Inject the shared service
  constructor(public pomodoroService: PomodoroService) {}

  ngOnInit() {
    // Request notification permission when component initializes
    this.pomodoroService.requestNotificationPermission();
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
}

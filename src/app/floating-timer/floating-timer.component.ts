import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PomodoroService } from '../services/pomodoro.service';

@Component({
  selector: 'app-floating-timer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (pomodoroService.isActive()) {
      <div class="floating-timer" [routerLink]="['/pomodoro']">
        <div class="timer-content" [class.break-mode]="pomodoroService.mode() === 'BREAK'">
          <div class="mini-circle">
            <svg viewBox="0 0 36 36" class="mini-chart">
              <circle class="mini-circle-bg" cx="18" cy="18" r="15.9155" />
              <circle 
                class="mini-circle-progress" 
                cx="18" 
                cy="18" 
                r="15.9155"
                [attr.stroke-dasharray]="pomodoroService.progress() + ', 100'"
              />
            </svg>
            <span class="timer-icon">{{ pomodoroService.mode() === 'WORK' ? '🎯' : '☕' }}</span>
          </div>
          <div class="timer-info">
            <div class="timer-time">{{ pomodoroService.formattedTime() }}</div>
            <div class="timer-label">{{ pomodoroService.MODES[pomodoroService.mode()].label }}</div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .floating-timer {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .timer-content {
      background: white;
      border-radius: 16px;
      padding: 12px 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
      border: 2px solid #e63946;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
      }

      &.break-mode {
        border-color: #2a9d8f;
      }
    }

    .mini-circle {
      position: relative;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .mini-chart {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .mini-circle-bg {
      fill: none;
      stroke: #edf2f4;
      stroke-width: 3;
    }

    .mini-circle-progress {
      fill: none;
      stroke: #e63946;
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dasharray 0.3s ease;
    }

    .break-mode .mini-circle-progress {
      stroke: #2a9d8f;
    }

    .timer-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 20px;
    }

    .timer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timer-time {
      font-size: 18px;
      font-weight: 700;
      color: #2b2d42;
      font-variant-numeric: tabular-nums;
    }

    .timer-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8d99ae;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .floating-timer {
        bottom: 16px;
        right: 16px;
      }

      .timer-content {
        padding: 10px 12px;
        gap: 10px;
      }

      .mini-circle {
        width: 40px;
        height: 40px;
      }

      .timer-icon {
        font-size: 16px;
      }

      .timer-time {
        font-size: 16px;
      }

      .timer-label {
        font-size: 10px;
      }
    }
  `]
})
export class FloatingTimerComponent {
  constructor(public pomodoroService: PomodoroService) {}
}

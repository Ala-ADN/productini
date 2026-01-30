import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../services/pomodoro.service';

interface BarData {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value: number;
}

@Component({
  selector: 'app-pomodoro-stats',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-container">
      <div class="stats-header">
        <h3>Your Progress</h3>
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-value">{{ stats().totalSessions }}</span>
            <span class="stat-label">Sessions</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats().focusTime }}</span>
            <span class="stat-label">Minutes</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats().longestStreak }}</span>
            <span class="stat-label">Streak</span>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="chart-svg">
          <!-- Grid lines -->
          @for (line of gridLines(); track $index) {
            <line 
              [attr.x1]="padding" 
              [attr.y1]="line.y" 
              [attr.x2]="width - padding" 
              [attr.y2]="line.y"
              class="grid-line"
            />
          }

          <!-- Bars -->
          @for (bar of bars(); track bar.label) {
            <g class="bar-group">
              <rect 
                [attr.x]="bar.x" 
                [attr.y]="bar.y"
                [attr.width]="bar.width" 
                [attr.height]="bar.height"
                [class.bar-filled]="bar.value > 0"
                class="bar"
              />
              <text 
                [attr.x]="bar.x + bar.width / 2" 
                [attr.y]="height - padding + 20"
                class="bar-label"
              >
                {{ bar.label }}
              </text>
              @if (bar.value > 0) {
                <text 
                  [attr.x]="bar.x + bar.width / 2" 
                  [attr.y]="bar.y - 8"
                  class="bar-value"
                >
                  {{ bar.value }}
                </text>
              }
            </g>
          }
        </svg>
      </div>

      <div class="keyboard-hints">
        <span class="hint"><kbd>Ctrl</kbd> + <kbd>Space</kbd> Start/Pause</span>
        <span class="hint"><kbd>Esc</kbd> Reset</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #edf2f4;
    }

    .stats-header {
      margin-bottom: 1.5rem;

      h3 {
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        text-align: center;
      }
    }

    .stats-summary {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-radius: 12px;
      min-width: 70px;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
        line-height: 1;
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
    }

    .chart-container {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .chart-svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .grid-line {
      stroke: #e0e0e0;
      stroke-width: 1;
      stroke-dasharray: 4 4;
    }

    .bar {
      fill: #edf2f4;
      transition: all 0.3s ease;

      &.bar-filled {
        fill: var(--primary);
      }

      &:hover.bar-filled {
        fill: var(--primary-dark);
        transform: translateY(-2px);
      }
    }

    .bar-label {
      fill: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .bar-value {
      fill: var(--text-primary);
      font-size: 12px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .keyboard-hints {
      display: flex;
      gap: 1rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .hint {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;

      kbd {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 0.125rem 0.375rem;
        font-size: 0.7rem;
        font-family: monospace;
        font-weight: 600;
        color: var(--text-primary);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }

    @media (max-width: 480px) {
      .stats-summary {
        gap: 0.5rem;
      }

      .stat-item {
        padding: 0.5rem 0.75rem;
        min-width: 60px;

        .stat-value {
          font-size: 1.25rem;
        }

        .stat-label {
          font-size: 0.65rem;
        }
      }

      .chart-container {
        padding: 0.75rem;
      }

      .keyboard-hints {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class PomodoroStatsComponent {
  width = 340;
  height = 180;
  padding = 30;

  constructor(private pomodoroService: PomodoroService) {}

  stats = computed(() => this.pomodoroService.statistics());

  gridLines = computed(() => {
    const lines = [];
    const chartHeight = this.height - 2 * this.padding;
    for (let i = 0; i <= 4; i++) {
      lines.push({
        y: this.padding + (chartHeight / 4) * i
      });
    }
    return lines;
  });

  bars = computed(() => {
    const data = this.stats().last7Days;
    const maxValue = Math.max(...data.map(d => d.sessions), 1);
    const barWidth = (this.width - 2 * this.padding) / data.length - 8;
    const chartHeight = this.height - 2 * this.padding;

    return data.map((day, index) => {
      const barHeight = (day.sessions / maxValue) * chartHeight * 0.8;
      const x = this.padding + index * ((this.width - 2 * this.padding) / data.length) + 4;
      const y = this.height - this.padding - barHeight;

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        label: day.date,
        value: day.sessions
      };
    });
  });
}

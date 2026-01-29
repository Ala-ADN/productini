import { Injectable, signal, computed } from '@angular/core';
import { interval, Subject, merge, EMPTY, defer } from 'rxjs';
import { switchMap, takeWhile, tap, finalize, share, map } from 'rxjs/operators';

export type PomodoroMode = 'WORK' | 'BREAK';

export interface PomodoroSession {
  id: string;
  type: PomodoroMode;
  duration: number; // in minutes
  completedAt: Date;
  interrupted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PomodoroService {
  // CONFIG: Configurable durations
  workMinutes = signal(25);
  breakMinutes = signal(5);

  readonly MODES = {
    WORK: { label: 'Focus', color: 'var(--primary)' },
    BREAK: { label: 'Chill', color: 'var(--success)' },
  };

  // STATE: Global signals for timer state
  mode = signal<PomodoroMode>('WORK');
  timeLeft = signal(this.workMinutes() * 60);
  isActive = signal(false);
  currentTask = signal('Deep Work');
  sessionHistory = signal<PomodoroSession[]>([]);

  // RxJS Subjects for reactive control
  private start$ = new Subject<void>();
  private pause$ = new Subject<void>();
  private sessionStartTime?: Date;
  private sessionStartDuration?: number;

  // COMPUTED: Derived state
  progress = computed(() => {
    const total = (this.mode() === 'WORK' ? this.workMinutes() : this.breakMinutes()) * 60;
    const current = this.timeLeft();
    return ((total - current) / total) * 100;
  });

  formattedTime = computed(() => {
    const minutes = Math.floor(this.timeLeft() / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (this.timeLeft() % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  // Statistics computed from session history
  statistics = computed(() => {
    const history = this.sessionHistory();
    const workSessions = history.filter((s) => s.type === 'WORK' && !s.interrupted);
    const totalSessions = workSessions.length;
    const focusTime = workSessions.reduce((acc, s) => acc + s.duration, 0);

    return {
      totalSessions,
      focusTime,
      longestStreak: this.calculateStreak(history),
      last7Days: this.getLast7DaysStats(history),
    };
  });

  // Advanced RxJS: Timer observable with sophisticated patterns
  private timer$ = defer(() => {
    return interval(1000).pipe(
      takeWhile(() => this.timeLeft() > 0),
      tap(() => this.timeLeft.update((t) => t - 1)),
      finalize(() => this.completeSession()),
      share(),
    );
  });

  // Reactive timer control with switchMap
  private timerControl$ = merge(
    this.start$.pipe(map(() => true)),
    this.pause$.pipe(map(() => false)),
  ).pipe(switchMap((shouldRun) => (shouldRun ? this.timer$ : EMPTY)));

  constructor() {
    // Subscribe to reactive timer control
    this.timerControl$.subscribe();
    // Load session history from localStorage
    this.loadSessionHistory();
  }

  toggleTimer() {
    this.isActive.set(!this.isActive());

    if (this.isActive()) {
      this.sessionStartTime = new Date();
      this.sessionStartDuration = this.timeLeft();
      this.start$.next();
    } else {
      this.pause$.next();
      // Record interrupted session if significant time passed
      if (this.sessionStartTime && this.sessionStartDuration) {
        const elapsed = this.sessionStartDuration - this.timeLeft();
        if (elapsed > 60) {
          // More than 1 minute
          this.recordSession(true);
        }
      }
    }
  }

  completeSession() {
    this.isActive.set(false);
    this.pause$.next();
    this.recordSession(false);
    // Play notification sound
    this.playNotification();
    // Auto-switch mode
    this.switchMode(this.mode() === 'WORK' ? 'BREAK' : 'WORK');
  }

  switchMode(newMode: PomodoroMode) {
    this.mode.set(newMode);
    this.reset();
  }

  reset() {
    this.isActive.set(false);
    this.pause$.next();
    const minutes = this.mode() === 'WORK' ? this.workMinutes() : this.breakMinutes();
    this.timeLeft.set(minutes * 60);
    this.sessionStartTime = undefined;
    this.sessionStartDuration = undefined;
  }

  setWorkMinutes(minutes: number) {
    if (minutes >= 1 && minutes <= 90) {
      this.workMinutes.set(minutes);
      if (this.mode() === 'WORK' && !this.isActive()) {
        this.timeLeft.set(minutes * 60);
      }
    }
  }

  setBreakMinutes(minutes: number) {
    if (minutes >= 1 && minutes <= 30) {
      this.breakMinutes.set(minutes);
      if (this.mode() === 'BREAK' && !this.isActive()) {
        this.timeLeft.set(minutes * 60);
      }
    }
  }

  setCurrentTask(task: string) {
    this.currentTask.set(task);
  }

  private playNotification() {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: `Your ${this.MODES[this.mode()].label} session is complete.`,
        icon: '⏱️',
      });
    }

    // Audio notification
    const audio = new Audio();
    audio.src = 'https://pomofocus.io/audios/alarms/alarm-wood.mp3';
    audio.play().catch(() => {
      console.log('Audio playback failed.');
    });
  }

  // Request notification permission
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Session recording and history management
  private recordSession(interrupted: boolean) {
    if (!this.sessionStartTime || !this.sessionStartDuration) return;

    const elapsed = this.sessionStartDuration - this.timeLeft();
    const session: PomodoroSession = {
      id: `${Date.now()}-${Math.random()}`,
      type: this.mode(),
      duration: Math.floor(elapsed / 60),
      completedAt: new Date(),
      interrupted,
    };

    this.sessionHistory.update((history) => [...history, session]);
    this.saveSessionHistory();
  }

  private calculateStreak(history: PomodoroSession[]): number {
    const workSessions = history.filter((s) => s.type === 'WORK' && !s.interrupted);
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < workSessions.length; i++) {
      currentStreak++;
      if (
        i === workSessions.length - 1 ||
        workSessions[i + 1].completedAt.getTime() - workSessions[i].completedAt.getTime() > 3600000
      ) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  private getLast7DaysStats(
    history: PomodoroSession[],
  ): { date: string; sessions: number; minutes: number }[] {
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySessions = history.filter((s) => {
        const sessionDate = new Date(s.completedAt);
        return sessionDate >= date && sessionDate < nextDate && s.type === 'WORK' && !s.interrupted;
      });

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: daySessions.length,
        minutes: daySessions.reduce((acc, s) => acc + s.duration, 0),
      });
    }

    return last7Days;
  }

  private saveSessionHistory() {
    try {
      localStorage.setItem('pomodoro-history', JSON.stringify(this.sessionHistory()));
    } catch (e) {
      console.error('Failed to save session history', e);
    }
  }

  private loadSessionHistory() {
    try {
      const stored = localStorage.getItem('pomodoro-history');
      if (stored) {
        const history = JSON.parse(stored).map((s: any) => ({
          ...s,
          completedAt: new Date(s.completedAt),
        }));
        this.sessionHistory.set(history);
      }
    } catch (e) {
      console.error('Failed to load session history', e);
    }
  }
}

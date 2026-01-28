import { Injectable, signal, computed } from '@angular/core';
import { interval, Subscription } from 'rxjs';

export type PomodoroMode = 'WORK' | 'BREAK';

@Injectable({
  providedIn: 'root'
})
export class PomodoroService {
  // CONFIG: Constants for maintainability
  readonly MODES = {
    WORK: { label: 'Focus', minutes: 25, color: 'var(--primary)' },
    BREAK: { label: 'Chill', minutes: 5, color: 'var(--success)' }
  };

  // STATE: Global signals for timer state
  mode = signal<PomodoroMode>('WORK');
  timeLeft = signal(this.MODES.WORK.minutes * 60);
  isActive = signal(false);
  currentTask = signal('Deep Work');

  // COMPUTED: Derived state
  progress = computed(() => {
    const total = this.MODES[this.mode()].minutes * 60;
    const current = this.timeLeft();
    return ((total - current) / total) * 100;
  });

  formattedTime = computed(() => {
    const minutes = Math.floor(this.timeLeft() / 60).toString().padStart(2, '0');
    const seconds = (this.timeLeft() % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  private timerSub?: Subscription;

  toggleTimer() {
    this.isActive.set(!this.isActive());

    if (this.isActive()) {
      this.timerSub = interval(1000).subscribe(() => {
        if (this.timeLeft() > 0) {
          this.timeLeft.update(t => t - 1);
        } else {
          this.completeSession();
        }
      });
    } else {
      this.timerSub?.unsubscribe();
    }
  }

  completeSession() {
    this.isActive.set(false);
    this.timerSub?.unsubscribe();
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
    this.timerSub?.unsubscribe();
    this.timeLeft.set(this.MODES[this.mode()].minutes * 60);
  }

  setCurrentTask(task: string) {
    this.currentTask.set(task);
  }

  private playNotification() {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: `Your ${this.MODES[this.mode()].label} session is complete.`,
        icon: '⏱️'
      });
    }
    
    // Audio notification
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmm98OScTgwNUKrk7K1iHAU7k9n1xXIpBSh+zPDYjj4IElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HElyx6OyrYBoGPZPY88p2KwUme8rx13k0Bxhnu+vmnU4MC06o5O6wYx0FOpHX88tyLAUne87w2Ig4BxJcs+jqqmAbBj2S1/PJdiwEJ3vM8duPPgUQWbfm6aZYFQlEnuPywW8gBSh+zPDXjT0HE=';
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  }

  // Request notification permission
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

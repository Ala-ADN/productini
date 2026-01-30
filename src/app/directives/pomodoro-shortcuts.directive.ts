import { Directive, HostListener } from '@angular/core';
import { PomodoroService } from '../services/pomodoro.service';

@Directive({
  selector: '[appPomodoroShortcuts]',
  standalone: true
})
export class PomodoroShortcutsDirective {
  constructor(private pomodoroService: PomodoroService) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    // Ctrl+Space or Cmd+Space: Toggle timer
    if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.pomodoroService.toggleTimer();
    }

    // Ctrl+R or Cmd+R: Reset (only if not default browser behavior)
    if (event.key === 'r' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault();
      this.pomodoroService.reset();
    }

    // Escape: Reset
    if (event.key === 'Escape' && this.pomodoroService.isActive()) {
      this.pomodoroService.reset();
    }
  }
}

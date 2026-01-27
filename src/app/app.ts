import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HabitCounter } from './components/habit-counter/habit-counter';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HabitCounter],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Prodhub');
}

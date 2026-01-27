import { Component, signal } from '@angular/core';
import { ProgressContainerComponent } from './progress-goals';

@Component({
  selector: 'app-root',
  imports: [ProgressContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Prodhub');
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QuoteGeneratorComponent } from './quote-generator/quote-generator.component';
import { TodoListComponent } from './todo-list/todo-list.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, QuoteGeneratorComponent,TodoListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-app');
}

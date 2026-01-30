import { Routes } from '@angular/router';
import { TodoListComponent } from './todo-list/todo-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PomodoroWidgetComponent } from './pomodoro-widget/pomodoro-widget.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'todo', component: TodoListComponent },
  { path: 'pomodoro', component: PomodoroWidgetComponent },
];

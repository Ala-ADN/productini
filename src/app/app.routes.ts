import { Routes } from '@angular/router';
import { TodoListComponent } from './todo-list/todo-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'todo', component: TodoListComponent },
];

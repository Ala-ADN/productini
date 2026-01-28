import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'todo',
        loadComponent: () => import('./todo-list/todo-list.component').then(m => m.TodoListComponent)
    },
    {
        path: 'progress',
        loadComponent: () => import('./progress-goals/feature/progress-container/progress-container.component').then(m => m.ProgressContainerComponent)
    },
];

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
        path: 'quotes',
        loadComponent: () => import('./quote-generator/quote-generator.component').then(m => m.QuoteGeneratorComponent)
    },
];

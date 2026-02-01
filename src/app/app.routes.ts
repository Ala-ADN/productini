import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
];

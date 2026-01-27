import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 * Usage in routes: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.checkAuth();

  if (!isAuthenticated) {
    // Redirect to login with return URL
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};

/**
 * Guest Guard - Redirects authenticated users away from login/register
 * Usage in routes: canActivate: [guestGuard]
 */
export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.checkAuth();

  if (isAuthenticated) {
    // Already logged in, redirect to home
    router.navigate(['/']);
    return false;
  }

  return true;
};

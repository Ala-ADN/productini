import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { db, User, Session } from '../db';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals for reactive auth state
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly isInitialized = signal(false);

  // Computed values
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = computed(() => !this.isInitialized());

  constructor(private readonly router: Router) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication on app startup
   */
  private async initializeAuth(): Promise<void> {
    try {
      const session = await db.session.get('current_session');
      if (session) {
        this.currentUser.set({
          id: session.userId,
          email: session.email,
          username: session.username,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      this.isInitialized.set(true);
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!email || !username || !password) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Check if email already exists
      const existingUser = await db.users.where('email').equals(email.toLowerCase()).first();
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Check if username already exists
      const existingUsername = await db.users.where('username').equals(username).first();
      if (existingUsername) {
        return { success: false, error: 'Username already taken' };
      }

      // Create user (in production, hash the password!)
      const userId = await db.users.add({
        email: email.toLowerCase(),
        username,
        passwordHash: password, // ⚠️ DEMO ONLY - hash in production!
        createdAt: Date.now(),
        lastLoginAt: null,
      });

      // Auto-login after registration
      await this.createSession(userId, email, username);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find user by email
      const user = await db.users.where('email').equals(email.toLowerCase()).first();

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check password (in production, compare hashed passwords!)
      if (user.passwordHash !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      await db.users.update(user.id!, { lastLoginAt: Date.now() });

      // Create session
      await this.createSession(user.id!, user.email, user.username);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Clear session from DB
      await db.session.delete('current_session');

      // Clear current user
      this.currentUser.set(null);

      // Navigate to login
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Create session
   */
  private async createSession(userId: number, email: string, username: string): Promise<void> {
    const session: Session = {
      id: 'current_session',
      userId,
      email,
      username,
      loginAt: Date.now(),
    };

    await db.session.put(session);

    this.currentUser.set({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Check if user is authenticated (for guards)
   */
  async checkAuth(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    // Try to restore session
    const session = await db.session.get('current_session');
    if (session) {
      this.currentUser.set({
        id: session.userId,
        email: session.email,
        username: session.username,
      });
      return true;
    }

    return false;
  }
}

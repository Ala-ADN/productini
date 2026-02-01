import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form state
  protected readonly email = signal('');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    // Validate passwords match
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    const result = await this.authService.register(
      this.email(),
      this.username(),
      this.password()
    );

    this.isLoading.set(false);

    if (result.success) {
      await this.router.navigate(['/']);
    } else {
      this.errorMessage.set(result.error || 'Registration failed');
    }
  }
}

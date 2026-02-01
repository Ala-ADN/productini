import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form state
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const result = await this.authService.login(
      this.email(),
      this.password()
    );

    this.isLoading.set(false);

    if (result.success) {
      await this.router.navigate(['/']);
    } else {
      this.errorMessage.set(result.error || 'Login failed');
    }
  }
}

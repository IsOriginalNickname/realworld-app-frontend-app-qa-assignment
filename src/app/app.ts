import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatErrors } from './shared/formatting';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Signals for UI State
  readonly isSubmitting = signal(false);
  readonly errors = signal<string[]>([]);
  
  readonly currentUser = this.authService.currentUser;

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        // Assuming your Laravel API returns { "errors": { "email": ["invalid"] } }
        const formattedErrors = formatErrors(err.error?.errors);
        this.errors.set(formattedErrors.length ? formattedErrors : ['Invalid credentials']);
        this.isSubmitting.set(false);
      }
    });
  }
}
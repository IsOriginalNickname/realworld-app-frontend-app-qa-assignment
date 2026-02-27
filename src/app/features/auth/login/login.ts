import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { formatErrors } from '../../../shared/formatting';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for UI State
  readonly isSubmitting = signal(false);
  readonly errors = signal<string[]>([]);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errors.set([]);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        // Assuming your Laravel API returns { "errors": { "email": ["invalid"] } }
        const formattedErrors = formatErrors(err.error?.errors);
        this.errors.set(formattedErrors.length ? formattedErrors : ['Invalid credentials']);
        this.isSubmitting.set(false);
      }
    });
  }
}
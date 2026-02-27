import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth-service';
import { Router } from '@angular/router';
import { passwordMatchValidator } from '../../../shared/validators';
import { HttpErrorResponse } from '@angular/common/http';
import { formatErrors } from '../../../shared/formatting';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for UI State
  readonly isSubmitting = signal(false);
  readonly errors = signal<string[]>([]);

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    passwordConfirmation: ['', [Validators.required]],
  }, {
    validators: [passwordMatchValidator]
  });

  onSubmit() {
    if(this.registerForm.invalid) return;
    
    this.isSubmitting.set(true);
    this.errors.set([]);

    const {username, email, password} = this.registerForm.getRawValue();

    this.authService.register({username, email, password}).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        const formattedErrors = formatErrors(err.error?.errors);
        this.errors.set(formattedErrors.length ? formattedErrors : ['Unknown error occured']);
        this.isSubmitting.set(false);
      }
    })
  }
}
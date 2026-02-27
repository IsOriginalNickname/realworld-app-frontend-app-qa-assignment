import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirm = control.get('passwordConfirmation')?.value;

  // If both fields exist and do not match, return an error object
  return password && confirm && password !== confirm 
    ? { passwordMismatch: true } 
    : null;
};
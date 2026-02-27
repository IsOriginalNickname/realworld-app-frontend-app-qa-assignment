import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EditUser, UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  selectedFile: File | null = null;
  readonly imagePreview = signal<string | null>(null);

  readonly isSubmitting = signal<boolean>(false);

  readonly userForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    bio: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.fetchUser();
  }

  fetchUser() {
    this.userService.editUser().subscribe({
      next: (user: EditUser) => {
        this.userForm.patchValue({
          email: user.email,
          bio: user.bio        
        });
        if(user.image) {
          this.imagePreview.set(user.image);
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if(input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if(this.userForm.invalid) return;

    this.isSubmitting.set(true);

    const formData = new FormData();
    const formValue = this.userForm.getRawValue();

    formData.append('user[email]', formValue.email);
    formData.append('user[bio]', formValue.bio);

    if (this.selectedFile) {
      formData.append('user[image]', this.selectedFile);
    }

    this.userService.updateUser(formData).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.router.navigate(['/profile', user.username]);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      },
    });
  }
}
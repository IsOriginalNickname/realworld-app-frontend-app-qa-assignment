import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../services/api-service';
import { Router } from '@angular/router';
import { User } from '../models/auth/user';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);

  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    const token = localStorage.getItem('jwtToken');

    if(token) {
      this.refreshUser();
    }
  }

  login(credentials: LoginCredentials) : Observable<UserResponse> {
    return this.api.post<UserResponse>('/users/login', {user: credentials})
      .pipe(
        tap(
          res => this.setAuth(res.user)
        )
      );
  }
  register(credentials: RegisterCredentials) : Observable<UserResponse> {
    return this.api.post<UserResponse>('/users/', {user: credentials})
      .pipe(
        tap(
          res => this.setAuth(res.user)
        )
      );
  }
  logout() : Observable<void> {
    return this.api.get<void>('/user/logout').pipe(
      tap(
        _ => this.purgeAuth()
      )
    );
  }
  refreshUser(): void {
    this.api.get<UserResponse>('/user').subscribe({
      next: (res) => this.currentUser.set(res.user),
      error: () => this.purgeAuth() // Token invalid/expired
    });
  }

  private setAuth(user: User) : void {
    localStorage.setItem('jwtToken', user.token);
    this.currentUser.set(user);
  }

  private purgeAuth() : void {
    localStorage.removeItem('jwtToken');
    this.currentUser.set(null);
  }
}

interface LoginCredentials {
    email: string, 
    password: string
}
interface RegisterCredentials {
    username: string, 
    email: string, 
    password: string
}
interface UserResponse {
  user: User;
}
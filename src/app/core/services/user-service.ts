import { inject, Injectable } from '@angular/core';
import { ApiService } from './api-service';
import { map } from 'rxjs';
import { User } from '../models/auth/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);

  editUser() {
    return this.api.get<EditUserResponse>('/user/edit').pipe(
      map(response => response.user)
    );
  }
  updateUser(formData: FormData) {
    return this.api.post<UserResponse>(`/user`, formData).pipe(
      map(response => response.user)
    );
  }
}

interface EditUserResponse {
  user: EditUser;
};
interface UserResponse {
  user: User;
};

export interface EditUser {
  username: string;
  email: string;
  bio: string;
  image: string;
};
import { inject, Injectable } from '@angular/core';
import { ApiService } from './api-service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly api = inject(ApiService);

  get(username: string) {
    return this.api.get<ProfileResponse>(`/profiles/${username}`).pipe(
      map(response => response.profile)
    );
  }

  follow(username: string) {
    return this.api.post<ProfileResponse>(`/profiles/${username}/follow`)
      .pipe(map(res => res.profile));
  }

  unfollow(username: string) {
    return this.api.delete<ProfileResponse>(`/profiles/${username}/follow`)
      .pipe(map(res => res.profile));
  }
}

interface ProfileResponse {
  profile: Profile;
};
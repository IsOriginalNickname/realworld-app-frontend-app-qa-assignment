import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from './api-service';
import { finalize, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private readonly api = inject(ApiService);

  readonly tags = signal<string[]>([]);
  readonly isLoading = signal<boolean>(false);

  getTags() {
    this.isLoading.set(true);

    this.api.get<TagResponse>('/tags')
      .pipe(
        tap({
          next: (response) => {
            this.tags.set(response.tags);
          },
          error: (err) => {
            console.error('Failed to load tags', err);
            // Optionally set an error signal here
          }
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}

interface TagResponse {
  tags: string[]
}
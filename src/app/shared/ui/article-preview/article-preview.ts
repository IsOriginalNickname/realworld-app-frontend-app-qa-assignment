import { Component, inject, input, output } from '@angular/core';
import { Article } from '../../../core/models/article';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-article-preview',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './article-preview.html',
  styleUrl: './article-preview.css',
})
export class ArticlePreviewComponent {

  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;

  readonly article = input.required<Article>();
  readonly toggleFavorite = output<Article>();

  rerouteToLogin() {
    this.router.navigate(['/login']);
  }
}
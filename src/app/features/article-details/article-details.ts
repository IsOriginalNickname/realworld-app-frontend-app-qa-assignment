import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ArticleService } from '../../core/services/article-service';
import { Article } from '../../core/models/article';
import { DatePipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CommentList } from "../../shared/ui/comment-list/comment-list";
import { ProfileService } from '../../core/services/profile-service';

@Component({
  selector: 'app-article-details',
  imports: [DatePipe, RouterLink, CommentList, NgClass],
  templateUrl: './article-details.html',
  styleUrl: './article-details.css',
})
export class ArticleDetails implements OnInit {
  readonly slug = input.required<string>();
  private readonly articleService = inject(ArticleService);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  isLoading = signal(true);;
  article = signal<Article|null>(null);

  ngOnInit(): void {
    this.articleService.getArticle(this.slug()).subscribe({
      next: (article: Article) => {
        this.article.set(article);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.log(err);
        this.isLoading.set(false);
      }
    });
  }

  editArticle() {
    // Navigate to the editor with the slug parameter
    this.router.navigate(['/editor', this.article()!.slug]);
  }

  deleteArticle() {
    const confirmed = window.confirm('Are you sure you want to delete this article?');

    if (confirmed) {
      this.articleService.deleteArticle(this.article()!.slug!).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Failed to delete', err);
          alert('Could not delete article.');
        }
      });
    }
  }

  toggleFollow() {
    const p = this.article()?.author;
    if (!p) return;

    // Optimistic Update
    this.article.update(current => current ? { 
      ...current, 
      author: { 
        ...current.author!, 
        following: !current.author!.following 
      } 
    } : null);

    const request$ = p.following 
      ? this.profileService.unfollow(p.username)
      : this.profileService.follow(p.username);

    request$.subscribe({
      error: () => {
        this.article.update(current => current ? { 
          ...current, 
          author: { 
            ...current.author!, 
            following: !current.author!.following 
          } 
        } : null);
      }
    });
  }

  toggleFavorite() {
    const isFavorited = this.article()!.favorited;
    const newCount = isFavorited ? this.article()!.favoritesCount! - 1 : this.article()!.favoritesCount! + 1;

    const request$ = isFavorited
      ? this.articleService.unfavorite(this.article()!.slug!)
      : this.articleService.favorite(this.article()!.slug!);

    this.article.update(a => a ? { ...a, favorited: !isFavorited, favoritesCount: newCount } : null);

    request$.subscribe({
      error: (err) => {
        this.article.update(a => a ? { ...a, favorited: isFavorited, favoritesCount: newCount } : null);
      }
    });
  }
}

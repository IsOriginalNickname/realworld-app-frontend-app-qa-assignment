import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ArticlePreviewComponent } from '../../shared/ui/article-preview/article-preview';
import { PopularTags } from "../../shared/ui/popular-tags/popular-tags";
import { Article } from '../../core/models/article';
import { ArticleService, ArticleListConfig } from '../../core/services/article-service';
import { AuthService } from '../../core/auth/auth-service';
import { finalize, tap } from 'rxjs';

// Update type: 'tag' is no longer a feed type, it's just a filter
type FeedType = 'global' | 'feed';

@Component({
  selector: 'app-home',
  imports: [ArticlePreviewComponent, PopularTags],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly articleService = inject(ArticleService);
  public readonly authService = inject(AuthService);

  articles = signal<Article[]>([]);
  isLoading = signal(false);
  articlesCount = signal(0);
  
  readonly limit = 10;
  readonly currentPage = signal(1);
  
  // State
  readonly feedType = signal<FeedType>('global');
  readonly selectedTagName = signal<string | null>(null); // Nullable

  readonly totalPages = computed(() => {
    const count = this.articlesCount();
    const pages = Math.ceil(count / this.limit);
    return Array.from({ length: pages }, (_, i) => i + 1);
  });

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.setFeedType('feed');
    } else {
      this.fetchData();
    }
  }

  setFeedType(type: FeedType) {
    this.feedType.set(type);
    this.selectedTagName.set(null); // Reset tag when switching main tabs
    this.currentPage.set(1);
    this.fetchData();
  }

  onTagSelected(tag: string) {
    this.selectedTagName.set(tag); // Set filter
    // Do NOT change feedType. Keep user on 'global' or 'feed'
    this.currentPage.set(1);
    this.fetchData();
  }

  // Helper to remove the filter
  clearTag() {
    this.selectedTagName.set(null);
    this.currentPage.set(1);
    this.fetchData();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    const offset = (this.currentPage() - 1) * this.limit;
    
    const config: ArticleListConfig['filters'] = {
        limit: this.limit,
        offset: offset
    };

    // Apply tag filter if it exists
    if (this.selectedTagName()) {
        config.tag = this.selectedTagName()!;
    }

    let request$;

    // Determine API endpoint based on tab, passing the config (which now includes tag)
    if (this.feedType() === 'feed') {
        request$ = this.articleService.getFeed(config);
    } else {
        request$ = this.articleService.getArticles(config);
    }

    request$.pipe(
        tap({
          next: (response) => {
            this.articles.set(response.articles);
            this.articlesCount.set(response.articlesCount);
          },
          error: (err) => {
            console.error('Failed to load articles', err);
          }
        }),
        finalize(() => this.isLoading.set(false))
      ).subscribe();
  }
  
  // toggleFavorite remains the same...
  toggleFavorite(article: Article) { /* ... */ }
}
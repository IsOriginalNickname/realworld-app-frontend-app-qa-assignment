import { inject, Injectable } from '@angular/core';
import { ApiService } from './api-service';
import { map, tap } from 'rxjs';
import { Article } from '../models/article';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly api = inject(ApiService);

  getArticles(config: Partial<ArticleListConfig['filters']> = {}) {
    // Prepare Query Params
    let params = new HttpParams();
    
    // Default limit/offset if not provided
    const limit = config.limit ?? 10;
    const offset = config.offset ?? 0;

    params = params.set('limit', limit);
    params = params.set('offset', offset);

    // Add optional filters
    if (config.tag) params = params.set('tag', config.tag);
    if (config.author) params = params.set('author', config.author);
    if (config.favorited) params = params.set('favorited', config.favorited);

    return this.api.get<ArticlesResponse>('/articles', params);
  }

  getFeed(config: ArticleListConfig['filters'] = {}) {
    let params = new HttpParams();
    
    const limit = config.limit ?? 10;
    const offset = config.offset ?? 0;

    params = params.set('limit', limit);
    params = params.set('offset', offset);

    if (config.tag) params = params.set('tag', config.tag);
    if (config.author) params = params.set('author', config.author);
    if (config.favorited) params = params.set('favorited', config.favorited);

    return this.api.get<ArticlesResponse>('/articles/feed', params);
  }

  favorite(slug: string) {
    return this.api.post<ArticleResponse>(`/articles/${slug}/favorite`);
  }

  unfavorite(slug: string) {
    return this.api.delete<ArticleResponse>(`/articles/${slug}/unfavorite`);
  }

  getArticle(slug: string) {
    return this.api.get<ArticleResponse>(`/articles/${slug}`)
      .pipe(
        map(article => article.article)
      );
  }

  // fetch the article for editing
  editArticle(slug: string) {
    return this.api.get<EditArticleResponse>(`/articles/${slug}/edit`)
      .pipe(
        map(article => article.article)
      );
  }
  createArticle(article: Article) {
    return this.api.post<CreateArticleResponse>(`/articles`, {article: article})
      .pipe(
        map(article => article.article)
      );
  }
  updateArticle(slug: string, article: Article) {
    return this.api.put<UpdateArticleResponse>(`/articles/${slug}`, {article: article})
      .pipe(
        map(article => article.article)
      );
  }
  deleteArticle(slug: string) {
    return this.api.delete(`/articles/${slug}`);
  }
}


interface ArticleResponse {
  article: Article
}
interface EditArticleResponse {
  article: Article
}
interface CreateArticleResponse {
  article: Article
}
interface UpdateArticleResponse {
  article: Article
}

interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export interface ArticleListConfig {
  filters: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  };
}
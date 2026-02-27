import { inject, Injectable } from '@angular/core';
import { ApiService } from './api-service';
import { Article } from '../models/article';
import { ArticleComment } from '../models/article-comment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly api = inject(ApiService);

  getComments(article: Article) {
    return this.api.get<CommentsResponse>(`/articles/${article.slug}/comments`);
  }

  addComment(slug: string, body: string) {
    return this.api.post<{ comment: ArticleComment }>(`/articles/${slug}/comments`, {
      comment: { body }
    }).pipe(map(res => res.comment));
  }

  deleteComment(slug: string, commentId: number) {
    return this.api.delete(`/articles/${slug}/comments/${commentId}`);
  }
}

export interface CommentsResponse {
  comments: ArticleComment[];
};
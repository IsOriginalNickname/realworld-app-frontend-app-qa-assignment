import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Article } from '../../../core/models/article';
import { CommentService } from '../../../core/services/comment-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ArticleComment } from '../../../core/models/article-comment';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'; // <--- Import these
import { finalize, tap } from 'rxjs';

@Component({
  selector: 'app-comment-list',
  imports: [RouterLink, DatePipe, ReactiveFormsModule], // <--- Add ReactiveFormsModule
  templateUrl: './comment-list.html',
  styleUrl: './comment-list.css',
})
export class CommentList implements OnInit {
  readonly article = input.required<Article>();

  private readonly authService = inject(AuthService);
  private readonly commentService = inject(CommentService);

  readonly user = this.authService.currentUser;
  
  // State for the list and the submission status
  comments = signal<ArticleComment[]>([]);
  isSubmitting = signal(false);

  // Form Control for the textarea
  commentControl = new FormControl('', { 
    nonNullable: true, 
    validators: [Validators.required] 
  });

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.commentService.getComments(this.article()).subscribe({
      next: (response) => {
        this.comments.set(response.comments);
      },
      error: (err: any) => console.log(err)
    });
  }

  addComment() {
    if (this.commentControl.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    this.commentService.addComment(this.article().slug!, this.commentControl.value)
      .pipe(
        tap({
          next: (newComment) => {
            this.comments.update(current => [newComment, ...current]);
            
            this.commentControl.reset();
            this.isSubmitting.set(false);
          },
          error: (err) => {
            console.error(err);
            this.isSubmitting.set(false);
          }
        }),
        finalize(() => this.fetchData())
      ).subscribe();
  }

  deleteComment(commentId: number) {
    this.commentService.deleteComment(this.article().slug!, commentId).subscribe({
      next: () => {
        this.comments.update(current => current.filter(c => c.id !== commentId));
      },
      error: (err) => console.error(err)
    });
  }
}
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ArticleService } from '../../core/services/article-service';
import { Router, RouterLink } from '@angular/router';
import { Article } from '../../core/models/article';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-create-edit-article',
  imports: [ReactiveFormsModule],
  templateUrl: './create-edit-article.html',
  styleUrl: './create-edit-article.css',
})
export class CreateEditArticle implements OnInit {
  // route parameter
  readonly slug = input<string>();

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly articleService = inject(ArticleService);

  readonly errors = signal<string[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  readonly articleForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    body: ['', [Validators.required]],
    tagList: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const currentSlug = this.slug();

    if(currentSlug) {
      this.fetchArticle();  
    }
  }

  fetchArticle() {
    this.articleService.editArticle(this.slug()!).subscribe({
      next: (article: Article) => {
        this.articleForm.patchValue({
          title: article.title,
          description: article.description,
          body: article.body,
          tagList: article.tagList.join(' '),
        });
      },
      error: (err: any) => {
        console.error('Could not load article', err);
        this.router.navigate(['/']); // Redirect if not found
      }
    });
  }

  onSubmit() {
    if (this.articleForm.invalid) return;

    this.isSubmitting.set(true);
    this.errors.set([]);

    // 1. Prepare the payload
    const formValue = this.articleForm.getRawValue();
    
    // Convert string "tag1 tag2" -> array ["tag1", "tag2"]
    const tagListArray = formValue.tagList
      .split(' ') // Split by space (or comma, depending on your UI preference)
      .map(t => t.trim())
      .filter(t => !!t); // Remove empty strings

    const articleData: Article = {
      ...formValue,
      tagList: tagListArray
    };

    // 2. Determine if Create or Update
    const currentSlug = this.slug();
    const request$ = currentSlug
      ? this.articleService.updateArticle(currentSlug, articleData)
      : this.articleService.createArticle(articleData);

    // 3. Execute Request
    request$.subscribe({
      next: (article) => {
        // Navigate to the newly created/updated article
        this.router.navigate(['/article', article.slug]);
      },
      error: (err: HttpErrorResponse) => {
        // TODO: make an error handler component for forms
        const errorList = [];
        if (err.error?.errors) {
          for (const [key, msgs] of Object.entries(err.error.errors)) {
            errorList.push(`${key} ${msgs}`);
          }
        } else {
          errorList.push('Something went wrong. Please try again.');
        }
        this.errors.set(errorList);
        this.isSubmitting.set(false);
      }
    });
  }
}
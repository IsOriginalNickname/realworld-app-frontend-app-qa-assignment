import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () => import('./features/home/home')
      .then(m => m.Home),
    title: 'Home',
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login')
      .then(m => m.Login),
    title: 'Sign in'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register')
      .then(m => m.Register),
    title: 'Sign up'
  },
  {
    path: 'article/:slug', 
    loadComponent: () => import('./features/article-details/article-details').then(m => m.ArticleDetails),
    title: 'Article Details'
  },
  {
    path: 'editor', 
    loadComponent: () => import('./features/create-edit-article/create-edit-article').then(m => m.CreateEditArticle),
    title: 'Create article'
  },
  {
    path: 'editor/:slug', 
    loadComponent: () => import('./features/create-edit-article/create-edit-article').then(m => m.CreateEditArticle),
    title: 'Edit article'
  },
  {
    path: 'settings', 
    loadComponent: () => import('./features/settings/settings').then(m => m.Settings),
    title: 'Settings'
  },
  {
    path: 'profile/:username', 
    loadComponent: () => import('./features/profile/profile-page').then(m => m.ProfilePage),
    title: 'Profile'
  },
];
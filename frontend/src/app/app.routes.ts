import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Pulpit · CaloByte',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'history',
    title: 'Historia · CaloByte',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'recipes',
    title: 'Przepisy · CaloByte',
    loadComponent: () =>
      import('./features/recipes/recipe-list/recipe-list.component').then(
        (m) => m.RecipeListComponent,
      ),
  },
  {
    path: 'recipes/new',
    title: 'Nowy przepis · CaloByte',
    loadComponent: () =>
      import('./features/recipes/recipe-form/recipe-form.component').then(
        (m) => m.RecipeFormComponent,
      ),
  },
  {
    path: 'recipes/:id/edit',
    title: 'Edycja przepisu · CaloByte',
    loadComponent: () =>
      import('./features/recipes/recipe-form/recipe-form.component').then(
        (m) => m.RecipeFormComponent,
      ),
  },
  {
    path: 'recipes/:id',
    title: 'Przepis · CaloByte',
    loadComponent: () =>
      import('./features/recipes/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'profile',
    title: 'Profil · CaloByte',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

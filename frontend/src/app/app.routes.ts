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
    path: 'recipes/:id',
    title: 'Przepis · CaloByte',
    loadComponent: () =>
      import('./features/recipes/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];

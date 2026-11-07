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
    path: 'profile',
    title: 'Profil · CaloByte',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'chat',
    title: 'Czat · CaloByte',
    loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

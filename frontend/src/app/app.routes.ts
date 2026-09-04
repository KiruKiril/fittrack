import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard)
      },
      {
        path: 'uebungen',
        loadComponent: () => import('./features/uebungen/uebungen').then((m) => m.Uebungen)
      },
      {
        path: 'trainings',
        loadComponent: () => import('./features/trainings/trainings-list/trainings-list').then((m) => m.TrainingsList)
      },
      {
        path: 'trainings/neu',
        loadComponent: () => import('./features/trainings/training-form/training-form').then((m) => m.TrainingForm)
      },
      {
        path: 'trainings/:id',
        loadComponent: () => import('./features/trainings/training-detail/training-detail').then((m) => m.TrainingDetail)
      },
      {
        path: 'log',
        loadComponent: () => import('./features/log/log-history/log-history').then((m) => m.LogHistory)
      },
      {
        path: 'log/neu/:trainingId',
        loadComponent: () => import('./features/log/log-form/log-form').then((m) => m.LogForm)
      },
      {
        path: 'log/:id',
        loadComponent: () => import('./features/log/log-detail/log-detail').then((m) => m.LogDetail)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

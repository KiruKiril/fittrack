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
    path: 'trainings/:id/live',
    loadComponent: () => import('./features/live-session/live-session').then((m) => m.LiveSession),
    canActivate: [authGuard]
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
        path: 'splits',
        loadComponent: () => import('./features/splits/splits-list/splits-list').then((m) => m.SplitsList)
      },
      {
        path: 'splits/neu',
        loadComponent: () => import('./features/splits/split-form/split-form').then((m) => m.SplitForm)
      },
      {
        path: 'splits/:id',
        loadComponent: () => import('./features/splits/split-detail/split-detail').then((m) => m.SplitDetail)
      },
      {
        path: 'log',
        loadComponent: () => import('./features/log/log-history/log-history').then((m) => m.LogHistory)
      },
      {
        path: 'log/kalender',
        loadComponent: () => import('./features/log/log-calendar/log-calendar').then((m) => m.LogCalendar)
      },
      {
        path: 'log/neu',
        loadComponent: () => import('./features/log/log-form-picker/log-form-picker').then((m) => m.LogFormPicker)
      },
      {
        path: 'log/neu/uebung/:uebungId',
        loadComponent: () => import('./features/log/log-form-ausdauer/log-form-ausdauer').then((m) => m.LogFormAusdauer)
      },
      {
        path: 'log/neu/:trainingId',
        loadComponent: () => import('./features/log/log-form/log-form').then((m) => m.LogForm)
      },
      {
        path: 'log/:id/bearbeiten',
        loadComponent: () => import('./features/log/log-edit/log-edit').then((m) => m.LogEdit)
      },
      {
        path: 'log/:id',
        loadComponent: () => import('./features/log/log-detail/log-detail').then((m) => m.LogDetail)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

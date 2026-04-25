import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'issue',
    loadComponent: () =>
      import('./components/issue-cert/issue-cert.component').then(
        (m) => m.IssueCertComponent
      ),
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./components/verify-cert/verify-cert.component').then(
        (m) => m.VerifyCertComponent
      ),
  },
  { path: '**', redirectTo: '' },
];

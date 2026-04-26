import { Routes } from '@angular/router';
import { issueGuard } from './guards/issue.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./components/admin-approvals/admin-approvals.component').then(
        (m) => m.AdminApprovalsComponent
      ),
  },
  {
    path: 'issue',
    canActivate: [issueGuard],
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

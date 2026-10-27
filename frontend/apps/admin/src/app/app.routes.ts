import { Route } from '@angular/router';
import {
  authGuard,
  guestGuard,
  roleGuard,
} from '@care/shared-data-access-auth';
import { ForbiddenPage, NotFoundPage } from '@care/shared-ui-layout';

export const appRoutes: Route[] = [
  {
    path: 'login',
    title: 'title.login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@care/shared-feature-auth').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard('ADMIN')],
        loadChildren: () =>
          import('@care/admin-feature-dashboard').then(
            (m) => m.dashboardRoutes,
          ),
      },
      {
        path: 'forbidden',
        title: 'title.forbidden',
        component: ForbiddenPage,
      },
      { path: '**', title: 'title.notFound', component: NotFoundPage },
    ],
  },
];

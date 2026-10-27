import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    title: 'title.dashboard',
    loadComponent: () =>
      import('./dashboard.page').then((m) => m.DashboardPage),
  },
];

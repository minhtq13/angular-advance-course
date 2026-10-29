import { Route } from '@angular/router';

export const servicePlanRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./service-plan-list/service-plan-list.page').then(
        (m) => m.ServicePlanListPage,
      ),
  },
];

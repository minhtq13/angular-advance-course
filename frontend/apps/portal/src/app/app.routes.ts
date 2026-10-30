import { Route } from '@angular/router';
import { provideHttpTicketPort } from '@care/portal-data-access-tickets';
import { authGuard, guestGuard } from '@care/shared-data-access-auth';
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
      { path: '', pathMatch: 'full', redirectTo: 'subscribers' },
      {
        path: 'subscribers',
        loadChildren: () =>
          import('@care/portal-feature-subscribers').then(
            (m) => m.subscriberRoutes,
          ),
      },
      {
        path: 'tickets',
        // Composition root: chọn adapter cho TicketPort tại đây, feature không biết HTTP.
        providers: [provideHttpTicketPort()],
        loadChildren: () =>
          import('@care/portal-feature-tickets').then((m) => m.ticketRoutes),
      },
      {
        path: 'service-plans',
        title: 'title.servicePlans',
        loadChildren: () =>
          import('@care/portal-feature-service-plans').then(
            (m) => m.servicePlanRoutes,
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

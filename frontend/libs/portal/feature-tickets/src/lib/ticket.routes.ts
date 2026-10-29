import { Route } from '@angular/router';

export const ticketRoutes: Route[] = [
  {
    path: 'new',
    title: 'title.ticketNew',
    loadComponent: () =>
      import('./ticket-create/ticket-create.page').then(
        (m) => m.TicketCreatePage,
      ),
  },
  {
    path: '',
    title: 'title.tickets',
    loadComponent: () =>
      import('./ticket-list/ticket-list.page').then((m) => m.TicketListPage),
  },
];

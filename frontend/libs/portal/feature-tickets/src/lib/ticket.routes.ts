import { Route } from '@angular/router';

export const ticketRoutes: Route[] = [
  {
    path: '',
    title: 'title.tickets',
    loadComponent: () =>
      import('./ticket-list/ticket-list.page').then((m) => m.TicketListPage),
  },
];

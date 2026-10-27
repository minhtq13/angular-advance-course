import { Route } from '@angular/router';

export const subscriberRoutes: Route[] = [
  {
    path: '',
    title: 'title.subscribers',
    loadComponent: () =>
      import('./subscriber-list/subscriber-list.page').then(
        (m) => m.SubscriberListPage,
      ),
  },
  {
    path: ':id',
    title: 'title.subscriberDetail',
    loadComponent: () =>
      import('./subscriber-detail/subscriber-detail.page').then(
        (m) => m.SubscriberDetailPage,
      ),
  },
];

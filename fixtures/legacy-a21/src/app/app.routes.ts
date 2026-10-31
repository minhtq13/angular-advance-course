import { Routes } from '@angular/router';
import { TicketListComponent } from './tickets/ticket-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  { path: 'tickets', component: TicketListComponent },
];

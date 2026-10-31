import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Ticket } from './ticket';

/** Kiểu cũ (cố ý): constructor DI, BehaviorSubject làm state. */
@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly tickets$ = new BehaviorSubject<Ticket[]>([]);

  constructor(private http: HttpClient) {}

  get tickets(): Observable<Ticket[]> {
    return this.tickets$.asObservable();
  }

  load(): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>('tickets.json')
      .pipe(tap((list) => this.tickets$.next(list)));
  }

  approve(id: number): void {
    this.tickets$.next(
      this.tickets$.value.map((t) =>
        t.id === id ? { ...t, status: 'RESOLVED' } : t,
      ),
    );
  }

  countNew(): Observable<number> {
    return this.tickets$.pipe(
      map((list) => list.filter((t) => t.status === 'NEW').length),
    );
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Trip, CreateTripRequest, UpdateTripRequest } from './trip.model';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);

  private readonly _trips = signal<Trip[]>([]);

  readonly trips = this._trips.asReadonly();

  constructor() {
    this.http.get<Trip[]>('/api/trips').subscribe({
      next: (trips) => this._trips.set(trips),
      error: (err) => console.error('Failed to load trips:', err),
    });
  }

  create(request: CreateTripRequest): Observable<Trip> {
    return this.http.post<Trip>('/api/trips', request).pipe(
      tap((trip) => this._trips.update((trips) => [...trips, trip])),
    );
  }

  update(id: string, request: UpdateTripRequest): Observable<Trip> {
    return this.http.put<Trip>(`/api/trips/${id}`, request).pipe(
      tap((updated) =>
        this._trips.update((trips) => trips.map((t) => (t.id === id ? updated : t))),
      ),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/trips/${id}`).pipe(
      tap(() => this._trips.update((trips) => trips.filter((t) => t.id !== id))),
    );
  }
}

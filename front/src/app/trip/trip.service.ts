import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Trip } from './trip.model';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);

  readonly trips = toSignal(
    this.http.get<Trip[]>('/api/trips').pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] as Trip[] }
  );
}

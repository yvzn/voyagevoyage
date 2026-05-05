import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TravelConstraints, UpdateTravelConstraintsRequest } from './constraints.model';

@Injectable({
  providedIn: 'root',
})
export class ConstraintsService {
  private readonly http = inject(HttpClient);

  private readonly _constraints = signal<TravelConstraints | null>(null);

  readonly constraints = this._constraints.asReadonly();

  constructor() {
    this.http.get<TravelConstraints>('/api/travel-constraints').subscribe({
      next: (constraints) => this._constraints.set(constraints),
      error: (err) => {
        // 204 No Content is not an error; the signal stays null
        if (err?.status !== 204) {
          console.error('Failed to load travel constraints:', err);
        }
      },
    });
  }

  update(request: UpdateTravelConstraintsRequest): Observable<TravelConstraints> {
    return this.http.put<TravelConstraints>('/api/travel-constraints', request).pipe(
      tap((constraints) => this._constraints.set(constraints)),
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { TravelConstraints, UpdateTravelConstraintsRequest } from './constraints.model';

@Injectable({
  providedIn: 'root',
})
export class ConstraintsService {
  private readonly http = inject(HttpClient);

  get(): Observable<TravelConstraints | null> {
    return this.http.get<TravelConstraints | null>('/api/travel-constraints').pipe(
      map((constraints) => constraints ?? null),
      catchError((error: unknown) => {
        // 204 No Content — no constraints configured yet
        if ((error as { status?: number })?.status === 204) return of(null);
        throw error;
      }),
    );
  }

  update(request: UpdateTravelConstraintsRequest): Observable<TravelConstraints> {
    return this.http.put<TravelConstraints>('/api/travel-constraints', request);
  }
}


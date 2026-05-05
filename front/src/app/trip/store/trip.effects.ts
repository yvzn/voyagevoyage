import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Trip } from '../trip.model';
import { TripActions } from './trip.actions';

export const loadTripsEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(TripActions.loadTrips),
      mergeMap(() =>
        http.get<Trip[]>('/api/trips').pipe(
          map((trips) => TripActions.loadTripsSuccess({ trips })),
          catchError((error: unknown) =>
            of(TripActions.loadTripsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const createTripEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(TripActions.createTrip),
      mergeMap(({ request }) =>
        http.post<Trip>('/api/trips', request).pipe(
          map((trip) => TripActions.createTripSuccess({ trip })),
          catchError((error: unknown) =>
            of(TripActions.createTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const updateTripEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(TripActions.updateTrip),
      mergeMap(({ id, request }) =>
        http.put<Trip>(`/api/trips/${id}`, request).pipe(
          map((trip) => TripActions.updateTripSuccess({ trip })),
          catchError((error: unknown) =>
            of(TripActions.updateTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteTripEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(TripActions.deleteTrip),
      mergeMap(({ id }) =>
        http.delete<void>(`/api/trips/${id}`).pipe(
          map(() => TripActions.deleteTripSuccess({ id })),
          catchError((error: unknown) =>
            of(TripActions.deleteTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

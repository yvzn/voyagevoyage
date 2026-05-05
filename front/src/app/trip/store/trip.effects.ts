import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { TripActions } from './trip.actions';
import { TripService } from '../trip.service';

export const loadTripsEffect = createEffect(
  (actions$ = inject(Actions), tripService = inject(TripService)) =>
    actions$.pipe(
      ofType(TripActions.loadTrips),
      mergeMap(() =>
        tripService.getAll().pipe(
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
  (actions$ = inject(Actions), tripService = inject(TripService)) =>
    actions$.pipe(
      ofType(TripActions.createTrip),
      mergeMap(({ request }) =>
        tripService.create(request).pipe(
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
  (actions$ = inject(Actions), tripService = inject(TripService)) =>
    actions$.pipe(
      ofType(TripActions.updateTrip),
      mergeMap(({ id, request }) =>
        tripService.update(id, request).pipe(
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
  (actions$ = inject(Actions), tripService = inject(TripService)) =>
    actions$.pipe(
      ofType(TripActions.deleteTrip),
      mergeMap(({ id }) =>
        tripService.delete(id).pipe(
          map(() => TripActions.deleteTripSuccess({ id })),
          catchError((error: unknown) =>
            of(TripActions.deleteTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

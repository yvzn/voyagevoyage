import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { BookingConfirmationActions } from './booking-confirmation.actions';
import { BookingConfirmationService } from '../booking-confirmation.service';
import { TripActions } from '../../trip/store/trip.actions';
import { TripService } from '../../trip/trip.service';

export const parseConfirmationEffect = createEffect(
  (actions$ = inject(Actions), service = inject(BookingConfirmationService)) =>
    actions$.pipe(
      ofType(BookingConfirmationActions.parseConfirmation),
      mergeMap(({ file }) =>
        service.parse(file).pipe(
          map((parsed) => BookingConfirmationActions.parseConfirmationSuccess({ parsed, file })),
          catchError((error: unknown) =>
            of(BookingConfirmationActions.parseConfirmationFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const uploadConfirmationForTripEffect = createEffect(
  (actions$ = inject(Actions), service = inject(BookingConfirmationService)) =>
    actions$.pipe(
      ofType(BookingConfirmationActions.uploadConfirmationForTrip),
      mergeMap(({ tripId, file }) =>
        service.uploadForTrip(tripId, file).pipe(
          map((confirmation) =>
            BookingConfirmationActions.uploadConfirmationForTripSuccess({ tripId, confirmation }),
          ),
          catchError((error: unknown) =>
            of(BookingConfirmationActions.uploadConfirmationForTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadConfirmationsForTripEffect = createEffect(
  (actions$ = inject(Actions), service = inject(BookingConfirmationService)) =>
    actions$.pipe(
      ofType(BookingConfirmationActions.loadConfirmationsForTrip),
      mergeMap(({ tripId }) =>
        service.getAllByTrip(tripId).pipe(
          map((confirmations) =>
            BookingConfirmationActions.loadConfirmationsForTripSuccess({ tripId, confirmations }),
          ),
          catchError((error: unknown) =>
            of(BookingConfirmationActions.loadConfirmationsForTripFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteConfirmationEffect = createEffect(
  (actions$ = inject(Actions), service = inject(BookingConfirmationService)) =>
    actions$.pipe(
      ofType(BookingConfirmationActions.deleteConfirmation),
      mergeMap(({ id, tripId }) =>
        service.delete(id).pipe(
          map(() => BookingConfirmationActions.deleteConfirmationSuccess({ id, tripId })),
          catchError((error: unknown) =>
            of(BookingConfirmationActions.deleteConfirmationFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const applyBookingConfirmationEffect = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(BookingConfirmationService),
    tripService = inject(TripService),
  ) =>
    actions$.pipe(
      ofType(BookingConfirmationActions.applyBookingConfirmation),
      switchMap(({ file, tripId, tripDestination, tripStartDate, tripEndDate, tripStatus, trainBooking, hotelBooking }) => {
        const tripData = { destination: tripDestination, startDate: tripStartDate, endDate: tripEndDate, status: tripStatus };

        const resolveTripId$ = tripId
          ? of(tripId)
          : tripService.create({ ...tripData, trainBooking: null, hotelBooking: null }).pipe(map((t) => t.id));

        return resolveTripId$.pipe(
          switchMap((resolvedTripId) =>
            service.uploadForTrip(resolvedTripId, file).pipe(
              switchMap(() =>
                tripService.update(resolvedTripId, { ...tripData, trainBooking, hotelBooking }).pipe(
                  mergeMap((trip) => [
                    TripActions.updateTripSuccess({ trip }),
                    BookingConfirmationActions.applyBookingConfirmationSuccess({ tripId: resolvedTripId }),
                  ]),
                ),
              ),
            ),
          ),
          catchError((error: unknown) =>
            of(BookingConfirmationActions.applyBookingConfirmationFailure({ error: String(error) })),
          ),
        );
      }),
    ),
  { functional: true },
);

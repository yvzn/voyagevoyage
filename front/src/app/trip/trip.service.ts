import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, first, mergeMap, of, throwError } from 'rxjs';
import { Trip, CreateTripRequest, UpdateTripRequest } from './trip.model';
import { TripActions } from './store/trip.actions';
import { selectAllTrips } from './store/trip.selectors';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  readonly trips = toSignal(this.store.select(selectAllTrips), { initialValue: [] as Trip[] });

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
  }

  create(request: CreateTripRequest): Observable<Trip> {
    this.store.dispatch(TripActions.createTrip({ request }));
    return this.actions$.pipe(
      ofType(TripActions.createTripSuccess, TripActions.createTripFailure),
      first(),
      mergeMap((action) =>
        action.type === TripActions.createTripSuccess.type
          ? of((action as ReturnType<typeof TripActions.createTripSuccess>).trip)
          : throwError(() => new Error('Create trip failed')),
      ),
    );
  }

  update(id: string, request: UpdateTripRequest): Observable<Trip> {
    this.store.dispatch(TripActions.updateTrip({ id, request }));
    return this.actions$.pipe(
      ofType(TripActions.updateTripSuccess, TripActions.updateTripFailure),
      first(),
      mergeMap((action) =>
        action.type === TripActions.updateTripSuccess.type
          ? of((action as ReturnType<typeof TripActions.updateTripSuccess>).trip)
          : throwError(() => new Error('Update trip failed')),
      ),
    );
  }

  delete(id: string): Observable<void> {
    this.store.dispatch(TripActions.deleteTrip({ id }));
    return this.actions$.pipe(
      ofType(TripActions.deleteTripSuccess, TripActions.deleteTripFailure),
      first(),
      mergeMap((action) =>
        action.type === TripActions.deleteTripSuccess.type
          ? of(undefined)
          : throwError(() => new Error('Delete trip failed')),
      ),
    );
  }
}


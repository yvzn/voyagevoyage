import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject } from 'rxjs';
import { Action } from '@ngrx/store';
import { Trip, TripStatus, CreateTripRequest, UpdateTripRequest } from '../trip.model';
import { TripActions } from './trip.actions';
import * as TripEffects from './trip.effects';

const MOCK_TRIPS: Trip[] = [
  { id: '1', startDate: '2026-04-06', endDate: '2026-04-08', destination: 'Lyon', status: TripStatus.Confirmed },
  { id: '2', startDate: '2026-04-14', endDate: '2026-04-16', destination: 'Bordeaux', status: TripStatus.Planned },
];

describe('Trip Effects', () => {
  let actions$: Subject<Action>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockActions(() => actions$),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadTripsEffect', () => {
    it('should dispatch loadTripsSuccess with trips on HTTP success', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.loadTripsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.loadTrips());
      httpMock.expectOne('/api/trips').flush(MOCK_TRIPS);

      expect(result).toEqual(TripActions.loadTripsSuccess({ trips: MOCK_TRIPS }));
    });

    it('should dispatch loadTripsFailure on HTTP error', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.loadTripsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.loadTrips());
      httpMock.expectOne('/api/trips').error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.loadTripsFailure>).type).toBe(
        TripActions.loadTripsFailure.type,
      );
    });
  });

  describe('createTripEffect', () => {
    it('should dispatch createTripSuccess on HTTP success', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };
      const created: Trip = { id: 'new-1', ...request };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.createTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.createTrip({ request }));
      httpMock.expectOne({ method: 'POST', url: '/api/trips' }).flush(created);

      expect(result).toEqual(TripActions.createTripSuccess({ trip: created }));
    });

    it('should dispatch createTripFailure on HTTP error', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.createTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.createTrip({ request }));
      httpMock.expectOne({ method: 'POST', url: '/api/trips' }).error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.createTripFailure>).type).toBe(
        TripActions.createTripFailure.type,
      );
    });
  });

  describe('updateTripEffect', () => {
    it('should dispatch updateTripSuccess on HTTP success', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };
      const updated: Trip = { id: '1', ...request };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.updateTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.updateTrip({ id: '1', request }));
      httpMock.expectOne({ method: 'PUT', url: '/api/trips/1' }).flush(updated);

      expect(result).toEqual(TripActions.updateTripSuccess({ trip: updated }));
    });

    it('should dispatch updateTripFailure on HTTP error', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.updateTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.updateTrip({ id: '1', request }));
      httpMock
        .expectOne({ method: 'PUT', url: '/api/trips/1' })
        .error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.updateTripFailure>).type).toBe(
        TripActions.updateTripFailure.type,
      );
    });
  });

  describe('deleteTripEffect', () => {
    it('should dispatch deleteTripSuccess on HTTP success', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.deleteTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.deleteTrip({ id: '2' }));
      httpMock.expectOne({ method: 'DELETE', url: '/api/trips/2' }).flush(null);

      expect(result).toEqual(TripActions.deleteTripSuccess({ id: '2' }));
    });

    it('should dispatch deleteTripFailure on HTTP error', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.deleteTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.deleteTrip({ id: '2' }));
      httpMock
        .expectOne({ method: 'DELETE', url: '/api/trips/2' })
        .error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.deleteTripFailure>).type).toBe(
        TripActions.deleteTripFailure.type,
      );
    });
  });
});

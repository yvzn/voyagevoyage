import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { vi } from 'vitest';
import { Trip, TripStatus, CreateTripRequest, UpdateTripRequest } from '../trip.model';
import { TripActions } from './trip.actions';
import { TripService } from '../trip.service';
import * as TripEffects from './trip.effects';

const MOCK_TRIPS: Trip[] = [
  { id: '1', startDate: '2026-04-06', endDate: '2026-04-08', destination: 'Lyon', status: TripStatus.Confirmed },
  { id: '2', startDate: '2026-04-14', endDate: '2026-04-16', destination: 'Bordeaux', status: TripStatus.Planned },
];

function makeMockTripService() {
  return {
    getAll: vi.fn().mockReturnValue(of([])),
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
}

describe('Trip Effects', () => {
  let actions$: Subject<Action>;
  let mockTripService: ReturnType<typeof makeMockTripService>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    mockTripService = makeMockTripService();
    TestBed.configureTestingModule({
      providers: [
        { provide: TripService, useValue: mockTripService },
        provideMockActions(() => actions$),
      ],
    });
  });

  describe('loadTripsEffect', () => {
    it('should dispatch loadTripsSuccess when service returns trips', () => {
      mockTripService.getAll.mockReturnValue(of(MOCK_TRIPS));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.loadTripsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.loadTrips());

      expect(result).toEqual(TripActions.loadTripsSuccess({ trips: MOCK_TRIPS }));
    });

    it('should dispatch loadTripsFailure when service throws', () => {
      mockTripService.getAll.mockReturnValue(throwError(() => new Error('Network error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.loadTripsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.loadTrips());

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.loadTripsFailure>).type).toBe(
        TripActions.loadTripsFailure.type,
      );
    });
  });

  describe('createTripEffect', () => {
    it('should dispatch createTripSuccess when service creates trip', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };
      const created: Trip = { id: 'new-1', ...request };
      mockTripService.create.mockReturnValue(of(created));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.createTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.createTrip({ request }));

      expect(result).toEqual(TripActions.createTripSuccess({ trip: created }));
    });

    it('should dispatch createTripFailure when service throws', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };
      mockTripService.create.mockReturnValue(throwError(() => new Error('Server error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.createTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.createTrip({ request }));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.createTripFailure>).type).toBe(
        TripActions.createTripFailure.type,
      );
    });
  });

  describe('updateTripEffect', () => {
    it('should dispatch updateTripSuccess when service updates trip', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };
      const updated: Trip = { id: '1', ...request };
      mockTripService.update.mockReturnValue(of(updated));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.updateTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.updateTrip({ id: '1', request }));

      expect(result).toEqual(TripActions.updateTripSuccess({ trip: updated }));
    });

    it('should dispatch updateTripFailure when service throws', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };
      mockTripService.update.mockReturnValue(throwError(() => new Error('Server error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.updateTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.updateTrip({ id: '1', request }));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.updateTripFailure>).type).toBe(
        TripActions.updateTripFailure.type,
      );
    });
  });

  describe('deleteTripEffect', () => {
    it('should dispatch deleteTripSuccess when service deletes trip', () => {
      mockTripService.delete.mockReturnValue(of(undefined));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.deleteTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.deleteTrip({ id: '2' }));

      expect(result).toEqual(TripActions.deleteTripSuccess({ id: '2' }));
    });

    it('should dispatch deleteTripFailure when service throws', () => {
      mockTripService.delete.mockReturnValue(throwError(() => new Error('Server error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        TripEffects.deleteTripEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(TripActions.deleteTrip({ id: '2' }));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof TripActions.deleteTripFailure>).type).toBe(
        TripActions.deleteTripFailure.type,
      );
    });
  });
});

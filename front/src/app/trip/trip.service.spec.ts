import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { TripService } from './trip.service';
import { Trip, TripStatus, CreateTripRequest, UpdateTripRequest } from './trip.model';
import { TripActions } from './store/trip.actions';
import { selectAllTrips } from './store/trip.selectors';
import { Action } from '@ngrx/store';

const MOCK_TRIPS: Trip[] = [
  { id: '1', startDate: '2026-04-06', endDate: '2026-04-08', destination: 'Lyon', status: TripStatus.Confirmed },
  { id: '2', startDate: '2026-04-14', endDate: '2026-04-16', destination: 'Bordeaux', status: TripStatus.Planned },
  { id: '3', startDate: '2026-04-22', endDate: '2026-04-23', destination: 'Lille', status: TripStatus.Cancelled },
];

describe('TripService (NgRx facade)', () => {
  let service: TripService;
  let store: MockStore;
  let actions$: Subject<Action>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [{ selector: selectAllTrips, value: [] }],
        }),
        provideMockActions(() => actions$),
      ],
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(TripService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch loadTrips on construction', () => {
    const dispatchedActions: Action[] = [];
    store.scannedActions$.subscribe((action) => dispatchedActions.push(action));

    // Re-create service to verify constructor dispatch
    TestBed.resetTestingModule();
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({ selectors: [{ selector: selectAllTrips, value: [] }] }),
        provideMockActions(() => actions$),
      ],
    });
    store = TestBed.inject(MockStore);
    const capturedActions: Action[] = [];
    store.scannedActions$.subscribe((a) => capturedActions.push(a));
    TestBed.inject(TripService);

    expect(capturedActions.some((a) => a.type === TripActions.loadTrips.type)).toBe(true);
  });

  it('should expose trips from the store selector', () => {
    store.overrideSelector(selectAllTrips, MOCK_TRIPS);
    store.refreshState();

    expect(service.trips()).toEqual(MOCK_TRIPS);
  });

  it('should return an empty array when the store has no trips', () => {
    store.overrideSelector(selectAllTrips, []);
    store.refreshState();
    expect(service.trips()).toEqual([]);
  });

  describe('create', () => {
    it('should dispatch createTrip action and resolve on success', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };
      const created: Trip = { id: 'new-1', ...request };
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      let result: Trip | undefined;
      service.create(request).subscribe((t) => (result = t));

      expect(dispatchSpy).toHaveBeenCalledWith(TripActions.createTrip({ request }));

      actions$.next(TripActions.createTripSuccess({ trip: created }));

      expect(result).toEqual(created);
    });

    it('should reject on createTripFailure', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };

      let error: unknown;
      service.create(request).subscribe({ error: (e) => (error = e) });

      actions$.next(TripActions.createTripFailure({ error: 'Server error' }));

      expect(error).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should dispatch updateTrip action and resolve on success', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };
      const updated: Trip = { id: '1', ...request };
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      let result: Trip | undefined;
      service.update('1', request).subscribe((t) => (result = t));

      expect(dispatchSpy).toHaveBeenCalledWith(TripActions.updateTrip({ id: '1', request }));

      actions$.next(TripActions.updateTripSuccess({ trip: updated }));

      expect(result).toEqual(updated);
    });

    it('should reject on updateTripFailure', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };

      let error: unknown;
      service.update('1', request).subscribe({ error: (e) => (error = e) });

      actions$.next(TripActions.updateTripFailure({ error: 'Server error' }));

      expect(error).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should dispatch deleteTrip action and resolve on success', () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      let completed = false;
      service.delete('2').subscribe({ complete: () => (completed = true) });

      expect(dispatchSpy).toHaveBeenCalledWith(TripActions.deleteTrip({ id: '2' }));

      actions$.next(TripActions.deleteTripSuccess({ id: '2' }));

      expect(completed).toBe(true);
    });

    it('should reject on deleteTripFailure', () => {
      let error: unknown;
      service.delete('2').subscribe({ error: (e) => (error = e) });

      actions$.next(TripActions.deleteTripFailure({ error: 'Server error' }));

      expect(error).toBeTruthy();
    });
  });
});



import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject } from 'rxjs';
import { Action } from '@ngrx/store';
import { TravelConstraints, UpdateTravelConstraintsRequest } from '../constraints.model';
import { SettingsActions } from './settings.actions';
import * as SettingsEffects from './settings.effects';

const MOCK_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [1, 2, 3, 4, 5],
  maxDaysPerMonth: 10,
  considerPublicHolidays: true,
  considerVacationDays: false,
  isStrict: false,
};

describe('Settings Effects', () => {
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

  describe('loadSettingsEffect', () => {
    it('should dispatch loadSettingsSuccess with constraints on HTTP success', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());
      httpMock.expectOne('/api/travel-constraints').flush(MOCK_CONSTRAINTS);

      expect(result).toEqual(SettingsActions.loadSettingsSuccess({ constraints: MOCK_CONSTRAINTS }));
    });

    it('should dispatch loadSettingsEmpty on 204 No Content', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());
      httpMock
        .expectOne('/api/travel-constraints')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(result).toEqual(SettingsActions.loadSettingsEmpty());
    });

    it('should dispatch loadSettingsFailure on HTTP error', () => {
      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());
      httpMock
        .expectOne('/api/travel-constraints')
        .error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof SettingsActions.loadSettingsFailure>).type).toBe(
        SettingsActions.loadSettingsFailure.type,
      );
    });
  });

  describe('updateSettingsEffect', () => {
    it('should dispatch updateSettingsSuccess on HTTP success', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
      };
      const updated: TravelConstraints = { ...request };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.updateSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.updateSettings({ request }));
      httpMock
        .expectOne({ method: 'PUT', url: '/api/travel-constraints' })
        .flush(updated);

      expect(result).toEqual(SettingsActions.updateSettingsSuccess({ constraints: updated }));
    });

    it('should dispatch updateSettingsFailure on HTTP error', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
      };

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.updateSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.updateSettings({ request }));
      httpMock
        .expectOne({ method: 'PUT', url: '/api/travel-constraints' })
        .error(new ProgressEvent('error'));

      expect(result).toBeDefined();
      expect(
        (result as ReturnType<typeof SettingsActions.updateSettingsFailure>).type,
      ).toBe(SettingsActions.updateSettingsFailure.type);
    });
  });
});

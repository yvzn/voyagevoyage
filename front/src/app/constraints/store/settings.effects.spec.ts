import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { vi } from 'vitest';
import { TravelConstraints, UpdateTravelConstraintsRequest } from '../constraints.model';
import { SettingsActions } from './settings.actions';
import { ConstraintsService } from '../constraints.service';
import * as SettingsEffects from './settings.effects';

const MOCK_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [1, 2, 3, 4, 5],
  maxDaysPerMonth: 10,
  considerPublicHolidays: true,
  considerVacationDays: false,
  isStrict: false,
  planningHorizonDays: 90,
  publicHolidayRegions: [],
};

function makeMockConstraintsService() {
  return {
    get: vi.fn().mockReturnValue(of(null)),
    update: vi.fn().mockReturnValue(of({})),
  };
}

describe('Settings Effects', () => {
  let actions$: Subject<Action>;
  let mockConstraintsService: ReturnType<typeof makeMockConstraintsService>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    mockConstraintsService = makeMockConstraintsService();
    TestBed.configureTestingModule({
      providers: [
        { provide: ConstraintsService, useValue: mockConstraintsService },
        provideMockActions(() => actions$),
      ],
    });
  });

  describe('loadSettingsEffect', () => {
    it('should dispatch loadSettingsSuccess when service returns constraints', () => {
      mockConstraintsService.get.mockReturnValue(of(MOCK_CONSTRAINTS));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());

      expect(result).toEqual(SettingsActions.loadSettingsSuccess({ constraints: MOCK_CONSTRAINTS }));
    });

    it('should dispatch loadSettingsEmpty when service returns null', () => {
      mockConstraintsService.get.mockReturnValue(of(null));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());

      expect(result).toEqual(SettingsActions.loadSettingsEmpty());
    });

    it('should dispatch loadSettingsFailure when service throws', () => {
      mockConstraintsService.get.mockReturnValue(throwError(() => new Error('Network error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.loadSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.loadSettings());

      expect(result).toBeDefined();
      expect((result as ReturnType<typeof SettingsActions.loadSettingsFailure>).type).toBe(
        SettingsActions.loadSettingsFailure.type,
      );
    });
  });

  describe('updateSettingsEffect', () => {
    it('should dispatch updateSettingsSuccess when service updates constraints', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
        planningHorizonDays: 60,
        publicHolidayRegions: [],
      };
      const updated: TravelConstraints = { ...request };
      mockConstraintsService.update.mockReturnValue(of(updated));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.updateSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.updateSettings({ request }));

      expect(result).toEqual(SettingsActions.updateSettingsSuccess({ constraints: updated }));
    });

    it('should dispatch updateSettingsFailure when service throws', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
        planningHorizonDays: 60,
        publicHolidayRegions: [],
      };
      mockConstraintsService.update.mockReturnValue(throwError(() => new Error('Server error')));

      const effect$: Observable<Action> = TestBed.runInInjectionContext(() =>
        SettingsEffects.updateSettingsEffect(),
      );

      let result: Action | undefined;
      effect$.subscribe((action) => (result = action));

      actions$.next(SettingsActions.updateSettings({ request }));

      expect(result).toBeDefined();
      expect(
        (result as ReturnType<typeof SettingsActions.updateSettingsFailure>).type,
      ).toBe(SettingsActions.updateSettingsFailure.type);
    });
  });
});

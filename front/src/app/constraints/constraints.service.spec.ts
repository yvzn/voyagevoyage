import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { Action } from '@ngrx/store';
import { vi } from 'vitest';
import { ConstraintsService } from './constraints.service';
import { TravelConstraints, UpdateTravelConstraintsRequest } from './constraints.model';
import { SettingsActions } from './store/settings.actions';
import { selectConstraints } from './store/settings.selectors';

const MOCK_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [1, 2, 3, 4, 5],
  maxDaysPerMonth: 10,
  considerPublicHolidays: true,
  considerVacationDays: false,
  isStrict: false,
};

describe('ConstraintsService (NgRx facade)', () => {
  let service: ConstraintsService;
  let store: MockStore;
  let actions$: Subject<Action>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [{ selector: selectConstraints, value: null }],
        }),
        provideMockActions(() => actions$),
      ],
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(ConstraintsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose constraints from the store selector', () => {
    store.overrideSelector(selectConstraints, MOCK_CONSTRAINTS);
    store.refreshState();

    expect(service.constraints()).toEqual(MOCK_CONSTRAINTS);
  });

  it('should return null when the store has no constraints', () => {
    store.overrideSelector(selectConstraints, null);
    store.refreshState();
    expect(service.constraints()).toBeNull();
  });

  describe('update', () => {
    it('should dispatch updateSettings action and resolve on success', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
      };
      const updated: TravelConstraints = { ...request };
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      let result: TravelConstraints | undefined;
      service.update(request).subscribe((c) => (result = c));

      expect(dispatchSpy).toHaveBeenCalledWith(SettingsActions.updateSettings({ request }));

      actions$.next(SettingsActions.updateSettingsSuccess({ constraints: updated }));

      expect(result).toEqual(updated);
    });

    it('should reject on updateSettingsFailure', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
      };

      let error: unknown;
      service.update(request).subscribe({ error: (e) => (error = e) });

      actions$.next(SettingsActions.updateSettingsFailure({ error: 'Server error' }));

      expect(error).toBeTruthy();
    });
  });
});


import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';
import { ConstraintsSettingsComponent } from './constraints-settings';
import { TravelConstraints } from '../constraints.model';
import { selectConstraints, selectSettingsLoadStatus, selectSettingsUpdateStatus } from '../store/settings.selectors';
import { ApiStatus } from '../store/settings.reducer';
import { SettingsActions } from '../store/settings.actions';

const EN_TRANSLATIONS = {
  constraints: {
    heading: 'Travel constraints',
    allowedDaysLabel: 'Allowed days of the week',
    allowedDaysHint: 'Leave all unchecked to allow any day of the week.',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    maxDaysPerMonth: 'Maximum travel days per month',
    maxDaysPerMonthHint: 'Leave empty for no limit.',
    maxDaysPerMonthError: 'Must be between 1 and 31.',
    planningHorizonDays: 'Planning horizon (days)',
    planningHorizonDaysHint: 'Suggestions are generated only within this horizon (1 to 365 days).',
    planningHorizonDaysError: 'Must be between 1 and 365.',
    considerPublicHolidays: 'Exclude public holidays',
    considerPublicHolidaysHint: 'Public holidays will not count as allowed travel days.',
    considerVacationDays: 'Exclude vacation days',
    considerVacationDaysHint: 'Personal leave days will not count as allowed travel days.',
    constraintModeLabel: 'Constraint mode',
    flexible: 'Flexible',
    flexibleHint: 'Constraints are guidelines; derogations are allowed.',
    strict: 'Strict',
    strictHint: 'Constraints are mandatory; trips outside the allowed slots cannot be created.',
    save: 'Save',
    saving: 'Saving…',
    saveSuccess: 'Your travel constraints have been saved.',
    saveError: 'An error occurred while saving the constraints. Please try again.',
    loadError: 'Failed to load travel constraints. Please try again.',
    loading: 'Loading…',
    retry: 'Retry',
  },
};

async function setupModule(
  constraints: TravelConstraints | null = null,
  loadStatus: ApiStatus = 'idle',
): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [ConstraintsSettingsComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectConstraints, value: constraints },
          { selector: selectSettingsLoadStatus, value: loadStatus },
          { selector: selectSettingsUpdateStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('ConstraintsSettingsComponent — display', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the heading', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Travel constraints');
  });

  it('should render a save button', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button[type="submit"]'));
    expect(buttons.length).toBe(1);
  });

  it('should render day-of-week checkboxes', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    // monday through sunday = 7 checkboxes, plus considerPublicHolidays + considerVacationDays = 9
    expect(checkboxes.length).toBeGreaterThanOrEqual(7);
  });
});

describe('ConstraintsSettingsComponent — pre-fill', () => {
  let store: MockStore;
  const existingConstraints: TravelConstraints = {
    allowedDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    maxDaysPerMonth: 8,
    considerPublicHolidays: true,
    considerVacationDays: false,
    isStrict: true,
    planningHorizonDays: 60,
  };
  beforeEach(async () => {
    // loadStatus 'success' matches the real state when constraints are already in the store
    store = await setupModule(existingConstraints, 'success');
  });

  it('should pre-fill form from existing constraints', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('monday')?.value).toBe(true);
    expect(component['form'].get('friday')?.value).toBe(true);
    expect(component['form'].get('saturday')?.value).toBe(false);
    expect(component['form'].get('maxDaysPerMonth')?.value).toBe(8);
    expect(component['form'].get('planningHorizonDays')?.value).toBe(60);
    expect(component['form'].get('considerPublicHolidays')?.value).toBe(true);
    expect(component['form'].get('isStrict')?.value).toBe(true);
  });

  it('should include planning horizon in update request', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    component['form'].patchValue({
      planningHorizonDays: 90,
      isStrict: false,
      considerPublicHolidays: false,
      considerVacationDays: false,
    });

    component['onSubmit']();

    expect(dispatchSpy).toHaveBeenCalledWith(
      SettingsActions.updateSettings({
        request: expect.objectContaining({ planningHorizonDays: 90 }),
      }),
    );
  });
});

describe('ConstraintsSettingsComponent — save success', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should show success message after saving', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['onSubmit']();

    store.overrideSelector(selectSettingsUpdateStatus, 'success');
    store.refreshState();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isSaved']()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const successMsg = compiled.querySelector('[role="status"]');
    expect(successMsg?.textContent?.trim()).toBe('Your travel constraints have been saved.');
  });
});

describe('ConstraintsSettingsComponent — save error', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should show error message when save fails', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['onSubmit']();

    store.overrideSelector(selectSettingsUpdateStatus, 'failure');
    store.refreshState();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isSaved']()).toBe(false);
    expect(component['errorKey']()).toBe('constraints.saveError');
  });
});

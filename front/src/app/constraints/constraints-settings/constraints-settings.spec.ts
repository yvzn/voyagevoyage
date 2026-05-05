import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ConstraintsSettingsComponent } from './constraints-settings';
import { TravelConstraints } from '../constraints.model';
import { SettingsActions } from '../store/settings.actions';
import { selectConstraints } from '../store/settings.selectors';

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
  },
};

async function setupModule(
  actions$: Subject<Action>,
  constraints: TravelConstraints | null = null,
): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [ConstraintsSettingsComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({ selectors: [{ selector: selectConstraints, value: constraints }] }),
      provideMockActions(() => actions$),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('ConstraintsSettingsComponent — display', () => {
  let actions$: Subject<Action>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    await setupModule(actions$);
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
  const existingConstraints: TravelConstraints = {
    allowedDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    maxDaysPerMonth: 8,
    considerPublicHolidays: true,
    considerVacationDays: false,
    isStrict: true,
  };
  let actions$: Subject<Action>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    await setupModule(actions$, existingConstraints);
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
    expect(component['form'].get('considerPublicHolidays')?.value).toBe(true);
    expect(component['form'].get('isStrict')?.value).toBe(true);
  });
});

describe('ConstraintsSettingsComponent — save success', () => {
  let actions$: Subject<Action>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    await setupModule(actions$);
  });

  it('should show success message after saving', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['onSubmit']();
    actions$.next(SettingsActions.updateSettingsSuccess({ constraints: {} as TravelConstraints }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isSaved']()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const successMsg = compiled.querySelector('[role="status"]');
    expect(successMsg?.textContent?.trim()).toBe('Your travel constraints have been saved.');
  });
});

describe('ConstraintsSettingsComponent — save error', () => {
  let actions$: Subject<Action>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    await setupModule(actions$);
  });

  it('should show error message when save fails', async () => {
    const fixture = TestBed.createComponent(ConstraintsSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['onSubmit']();
    actions$.next(SettingsActions.updateSettingsFailure({ error: 'Server error' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isSaved']()).toBe(false);
    expect(component['errorKey']()).toBe('constraints.saveError');
  });
});


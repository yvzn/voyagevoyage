import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TripFormComponent } from './trip-form';
import { Trip, TripStatus } from '../trip.model';
import { ApiStatus } from '../store/trip.reducer';
import { selectTripsCreateStatus, selectTripsUpdateStatus, selectAllTrips } from '../store/trip.selectors';
import { selectConstraints, selectPublicHolidays } from '../../constraints/store/settings.selectors';
import { selectAllPersonalLeaves } from '../../personal-leave/store/personal-leave.selectors';
import { TravelConstraints, DayOfWeek } from '../../constraints/constraints.model';

const EN_TRANSLATIONS = {
  tripForm: {
    createTitle: 'New trip',
    editTitle: 'Edit trip',
    destination: 'Destination',
    destinationRequired: 'Destination is required.',
    startDate: 'Start date',
    endDate: 'End date',
    endBeforeStart: 'End date must be on or after the start date.',
    status: 'Status',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the trip. Please try again.',
    constraintAllowedDaysWarning: 'One or more selected days are outside your allowed travel days.',
    constraintAllowedDaysError: 'One or more selected days are outside your allowed travel days. Please adjust your dates.',
    constraintPublicHolidayWarning: 'The selected period includes a public holiday.',
    constraintPublicHolidayError: 'The selected period includes a public holiday. Please adjust your dates.',
    constraintPersonalLeaveWarning: 'The selected period overlaps with a personal leave period.',
    constraintPersonalLeaveError: 'The selected period overlaps with a personal leave period. Please adjust your dates.',
    constraintMaxDaysWarning: 'The selected period would exceed your maximum travel days per month.',
    constraintMaxDaysError: 'The selected period would exceed your maximum travel days per month. Please adjust your dates.',
  },
  tripStatus: {
    planned: 'Planned',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  },
};

// JSDOM does not implement HTMLDialogElement.showModal(); stub it globally
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () => {};
});

async function setupModule(
  constraints: TravelConstraints | null = null,
): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [TripFormComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectConstraints, value: constraints },
          { selector: selectPublicHolidays, value: [] },
          { selector: selectAllPersonalLeaves, value: [] },
          { selector: selectAllTrips, value: [] },
          { selector: selectTripsCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsUpdateStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('TripFormComponent — display', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show create title when no trip is set', async () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h3');
    expect(title?.textContent?.trim()).toBe('New trip');
  });

  it('should show edit title when a trip is set', async () => {
    const trip: Trip = {
      id: 'e1',
      destination: 'Lyon',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      status: TripStatus.Planned,
    };

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h3');
    expect(title?.textContent?.trim()).toBe('Edit trip');
  });

  it('should not show delete button in create mode', async () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const deleteBtn = buttons.find((b) => b.textContent?.trim() === 'Delete');
    expect(deleteBtn).toBeUndefined();
  });

  it('should not show delete button in edit mode', async () => {
    const trip: Trip = {
      id: 'e1',
      destination: 'Lyon',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      status: TripStatus.Planned,
    };

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const deleteBtn = buttons.find((b) => b.textContent?.trim() === 'Delete');
    expect(deleteBtn).toBeUndefined();
  });

  it('should pre-fill fields with trip values in edit mode', async () => {
    const trip: Trip = {
      id: 'e1',
      destination: 'Bordeaux',
      startDate: '2026-07-10',
      endDate: '2026-07-12',
      status: TripStatus.Confirmed,
    };

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('destination')?.value).toBe('Bordeaux');
    expect(component['form'].get('startDate')?.value).toBe('2026-07-10');
    expect(component['form'].get('endDate')?.value).toBe('2026-07-12');
    expect(component['form'].get('status')?.value).toBe(TripStatus.Confirmed);
  });

  it('should pre-fill start and end date from defaultDate in create mode', async () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.componentRef.setInput('defaultDate', '2026-10-15');
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('startDate')?.value).toBe('2026-10-15');
    expect(component['form'].get('endDate')?.value).toBe('2026-10-15');
  });

  it('should emit cancelled when cancel button is clicked', async () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();
    await fixture.whenStable();

    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelBtn = Array.from(compiled.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Cancel',
    );
    (cancelBtn as HTMLButtonElement).click();

    expect(cancelled).toBe(true);
  });
});

describe('TripFormComponent — validation', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should be invalid when destination is empty', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: '',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });

    expect(component['form'].invalid).toBe(true);
    expect(component['form'].get('destination')?.hasError('required')).toBe(true);
  });

  it('should be invalid when end date is before start date', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-05',
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });

    expect(component['form'].hasError('endBeforeStart')).toBe(true);
  });
});

describe('TripFormComponent — create operation', () => {
  const createdTrip: Trip = {
    id: 'new-1',
    destination: 'Paris',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    status: TripStatus.Planned,
  };
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should dispatch createTrip and emit saved on success action', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });
    component['onSubmit']();

    store.overrideSelector(selectTripsCreateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(saved).toBe(true);
  });
});

describe('TripFormComponent — update operation', () => {
  const trip: Trip = {
    id: 'e1',
    destination: 'Lyon',
    startDate: '2026-06-01',
    endDate: '2026-06-03',
    status: TripStatus.Planned,
  };
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should dispatch updateTrip and emit saved on success action', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    fixture.componentInstance['onSubmit']();

    store.overrideSelector(selectTripsUpdateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(saved).toBe(true);
  });
});

describe('TripFormComponent — error handling', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should show error message on save failure action', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });
    component['onSubmit']();

    store.overrideSelector(selectTripsCreateStatus, 'failure');
    store.refreshState();

    expect(component['errorKey']()).toBe('tripForm.saveError');
  });
});

describe('TripFormComponent — constraint violation', () => {
  const flexibleConstraints: TravelConstraints = {
    allowedDaysOfWeek: [DayOfWeek.Tuesday], // 2026-08-03 is a Monday → violation
    maxDaysPerMonth: null,
    considerPublicHolidays: false,
    considerVacationDays: false,
    isStrict: false,
    planningHorizonDays: 365,
    publicHolidayRegions: [],
      schoolHolidayZones: [],
  };

  const strictConstraints: TravelConstraints = { ...flexibleConstraints, isStrict: true };

  it('should set constraintWarning error for flexible constraint violation', async () => {
    await setupModule(flexibleConstraints);

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-03', // Monday — not in allowedDaysOfWeek
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });

    expect(component['form'].hasError('constraintWarning')).toBe(true);
    expect(component['form'].hasError('constraintError')).toBe(false);
  });

  it('should allow submission when only constraintWarning is present', async () => {
    const store = await setupModule(flexibleConstraints);

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-03', // Monday — flexible violation
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });
    component['onSubmit']();

    store.overrideSelector(selectTripsCreateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(saved).toBe(true);
  });

  it('should set constraintError for strict constraint violation', async () => {
    await setupModule(strictConstraints);

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-03', // Monday — not in allowedDaysOfWeek, strict mode
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });

    expect(component['form'].hasError('constraintError')).toBe(true);
    expect(component['form'].hasError('constraintWarning')).toBe(false);
  });

  it('should block submission when constraintError is present', async () => {
    await setupModule(strictConstraints);

    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', null);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    const component = fixture.componentInstance;
    component['form'].setValue({
      destination: 'Paris',
      startDate: '2026-08-03', // Monday — strict violation
      endDate: '2026-08-03',
      status: TripStatus.Planned,
    });
    component['onSubmit']();

    expect(saved).toBe(false);
  });
});

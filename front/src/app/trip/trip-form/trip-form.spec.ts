import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { TripFormComponent } from './trip-form';
import { TripService } from '../trip.service';
import { Trip, TripStatus } from '../trip.model';

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
    delete: 'Delete',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the trip. Please try again.',
    deleteError: 'An error occurred while deleting the trip. Please try again.',
  },
  tripStatus: {
    planned: 'Planned',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  },
};

function makeMockTripService(overrides: Partial<TripService> = {}): TripService {
  return {
    trips: signal<Trip[]>([]).asReadonly(),
    create: () => of({} as Trip),
    update: () => of({} as Trip),
    delete: () => of(undefined),
    ...overrides,
  } as unknown as TripService;
}

// JSDOM does not implement HTMLDialogElement.showModal(); stub it globally
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () => {};
});

async function setupModule(mockService: TripService): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [TripFormComponent, TranslateModule.forRoot()],
    providers: [{ provide: TripService, useValue: mockService }],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');
}

describe('TripFormComponent — display', () => {
  beforeEach(async () => {
    await setupModule(makeMockTripService());
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

  it('should show delete button in edit mode', async () => {
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
    expect(deleteBtn).toBeTruthy();
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
    await setupModule(makeMockTripService());
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

  beforeEach(async () => {
    await setupModule(makeMockTripService({ create: () => of(createdTrip) }));
  });

  it('should call create and emit saved on submit', () => {
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

  beforeEach(async () => {
    await setupModule(makeMockTripService({ update: () => of({ ...trip }) }));
  });

  it('should call update and emit saved on submit in edit mode', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    fixture.componentInstance['onSubmit']();

    expect(saved).toBe(true);
  });
});

describe('TripFormComponent — delete operation', () => {
  const trip: Trip = {
    id: 'del-1',
    destination: 'Lille',
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    status: TripStatus.Cancelled,
  };

  beforeEach(async () => {
    await setupModule(makeMockTripService({ delete: () => of(undefined) }));
  });

  it('should call delete and emit deleted', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();

    let deleted = false;
    fixture.componentInstance.deleted.subscribe(() => (deleted = true));

    fixture.componentInstance['onDelete']();

    expect(deleted).toBe(true);
  });
});

describe('TripFormComponent — error handling', () => {
  beforeEach(async () => {
    await setupModule(
      makeMockTripService({ create: () => throwError(() => new Error('server error')) }),
    );
  });

  it('should show error message on save failure', () => {
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
    fixture.detectChanges();

    expect(component['errorKey']()).toBe('tripForm.saveError');
  });
});

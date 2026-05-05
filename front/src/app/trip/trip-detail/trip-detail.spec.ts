import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TripDetailComponent } from './trip-detail';
import { Trip, TripStatus } from '../trip.model';
import { ApiStatus } from '../store/trip.reducer';
import { selectAllTrips, selectTripsDeleteStatus } from '../store/trip.selectors';
import { selectTripsCreateStatus, selectTripsUpdateStatus } from '../store/trip.selectors';
import { selectConstraints } from '../../constraints/store/settings.selectors';

const EN_TRANSLATIONS = {
  tripDetail: {
    backToCalendar: 'Back to calendar',
    startDate: 'Start date',
    endDate: 'End date',
    editButton: 'Edit',
    deleteButton: 'Delete',
    deleting: 'Deleting…',
    deleteError: 'An error occurred while deleting the trip. Please try again.',
    expensesHeading: 'Expenses',
    noExpenses: 'No expenses recorded for this trip.',
    notFound: 'Trip not found.',
  },
  tripStatus: {
    planned: 'Planned',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  },
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
    constraintWarning: 'The selected dates do not comply with your travel constraints.',
    constraintError: 'The selected dates violate your mandatory travel constraints.',
  },
};

const MOCK_TRIP: Trip = {
  id: 'trip-1',
  destination: 'Lyon',
  startDate: '2026-06-10',
  endDate: '2026-06-12',
  status: TripStatus.Planned,
};

// JSDOM does not implement HTMLDialogElement.showModal(); stub it globally
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () => {};
});

async function setupModule(trips: Trip[] = [MOCK_TRIP], tripId = 'trip-1'): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [TripDetailComponent, TranslateModule.forRoot()],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ id: tripId })),
        },
      },
      provideMockStore({
        selectors: [
          { selector: selectAllTrips, value: trips },
          { selector: selectTripsDeleteStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsUpdateStatus, value: 'idle' as ApiStatus },
          { selector: selectConstraints, value: null },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('TripDetailComponent — trip found', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display trip destination as heading', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Lyon');
  });

  it('should display trip start and end dates', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('2026-06-10');
    expect(text).toContain('2026-06-12');
  });

  it('should display the trip status badge', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Planned');
  });

  it('should have a back to calendar link', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));
    const backLink = links.find((a) => a.textContent?.includes('Back to calendar'));
    expect(backLink).toBeTruthy();
  });

  it('should display an edit button', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const editBtn = buttons.find((b) => b.textContent?.includes('Edit'));
    expect(editBtn).toBeTruthy();
  });

  it('should display a delete button', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const deleteBtn = buttons.find((b) => b.textContent?.includes('Delete'));
    expect(deleteBtn).toBeTruthy();
  });

  it('should display the expenses section', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('#expenses-heading');
    expect(heading?.textContent?.trim()).toBe('Expenses');
  });

  it('should display the no expenses message', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('No expenses recorded for this trip.');
  });

  it('should open the edit form modal when edit button is clicked', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isFormOpen']()).toBe(false);

    component['openEditForm']();
    fixture.detectChanges();

    expect(component['isFormOpen']()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should close the edit form modal when closeForm is called', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component['openEditForm']();
    fixture.detectChanges();

    component['closeForm']();
    fixture.detectChanges();

    expect(component['isFormOpen']()).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dialog')).toBeNull();
  });
});

describe('TripDetailComponent — trip not found', () => {
  beforeEach(async () => {
    await setupModule([], 'non-existent-id');
  });

  it('should display not found message when trip is missing', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Trip not found.');
  });
});

describe('TripDetailComponent — delete operation', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule();
  });

  it('should dispatch deleteTrip and navigate to calendar on success', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectTripsDeleteStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(navigateSpy).toHaveBeenCalledWith(['/calendar']);
  });

  it('should show delete error message on failure', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectTripsDeleteStatus, 'failure');
    store.refreshState();
    TestBed.flushEffects();

    expect(fixture.componentInstance['deleteError']()).toBe('tripDetail.deleteError');
  });
});

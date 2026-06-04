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
import { TripActions } from '../store/trip.actions';
import { selectConstraints } from '../../constraints/store/settings.selectors';
import { selectAllExpenses, selectExpensesCreateStatus, selectExpensesLoadStatus, selectExpensesUpdateStatus } from '../../expense/store/expense.selectors';
import {
  selectReceiptsByExpenseId,
  selectUploadStatus,
  selectDeleteStatus,
} from '../../receipt/store/receipt.reducer';

const EN_TRANSLATIONS = {
  tripDetail: {
    backToCalendar: 'Back to calendar',
    startDate: 'Start date',
    endDate: 'End date',
    editButton: 'Edit',
    deleteButton: 'Delete',
    deleting: 'Deleting…',
    deleteConfirmMessage: 'Are you sure you want to delete this trip? This action cannot be undone.',
    deleteConfirmButton: 'Confirm deletion',
    deleteCancelButton: 'Cancel',
    deleteError: 'An error occurred while deleting the trip. Please try again.',
    expensesHeading: 'Expenses',
    addExpenseButton: 'Add expense',
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
  expenseForm: {
    createTitle: 'New expense',
    editTitle: 'Edit expense',
    date: 'Date',
    dateRequired: 'Date is required.',
    category: 'Category',
    amount: 'Amount',
    amountRequired: 'Amount must be greater than 0.',
    description: 'Description',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the expense. Please try again.',
  },
  expenseCategory: {
    train: 'Train',
    hotel: 'Hotel',
    meal: 'Meal',
    metroBus: 'Metro / Bus',
    other: 'Other',
  },
  receipt: {
    heading: 'Receipts',
    uploadButton: 'Add a receipt',
    uploading: 'Uploading…',
    uploadHint: 'PDF, JPEG, PNG, etc. — 10 MB max.',
    downloadButton: 'Download',
    deleteButton: 'Delete',
    empty: 'No receipts attached.',
    listLabel: 'Attached receipts',
    uploadError: 'An error occurred while uploading the receipt. Please try again.',
    deleteError: 'An error occurred while deleting the receipt. Please try again.',
  },
};

const MOCK_TRIP: Trip = {
  id: 'trip-1',
  destination: 'Lyon',
  startDate: '2026-06-10',
  endDate: '2026-06-12',
  status: TripStatus.Planned,
};

const MOCK_TRIP_WITH_BOOKINGS: Trip = {
  ...MOCK_TRIP,
  trainBooking: {
    departure: 'Paris',
    arrival: 'Lyon',
    departureDateTime: '2026-06-10T08:30:00Z',
  },
  hotelBooking: {
    bookingDate: '2026-05-05',
    hotelName: 'Hotel Lumière',
    hotelAddress: '1 Rue de Lyon, 69000 Lyon',
  },
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
          { selector: selectAllExpenses, value: [] },
          { selector: selectExpensesLoadStatus, value: 'idle' as ApiStatus },
          { selector: selectExpensesCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectExpensesUpdateStatus, value: 'idle' as ApiStatus },
          { selector: selectReceiptsByExpenseId, value: {} },
          { selector: selectUploadStatus, value: 'idle' as ApiStatus },
          { selector: selectDeleteStatus, value: 'idle' as ApiStatus },
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

  it('should display trip start and end dates in locale format', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    // Dates are formatted with Intl.DateTimeFormat — check they contain the year at minimum
    expect(text).toContain('2026');
    // Raw ISO strings should not appear
    expect(text).not.toContain('2026-06-10');
    expect(text).not.toContain('2026-06-12');
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

  it('should show delete confirmation when delete button is clicked', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(false);

    fixture.componentInstance['requestDelete']();
    fixture.detectChanges();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmDialog = compiled.querySelector('[role="alertdialog"]');
    expect(confirmDialog).toBeTruthy();
  });

  it('should hide confirmation when cancel is clicked', async () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance['requestDelete']();
    fixture.detectChanges();

    fixture.componentInstance['cancelDelete']();
    fixture.detectChanges();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(false);
  });

  it('should dispatch deleteTrip and navigate to calendar on success', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance['requestDelete']();
    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectTripsDeleteStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(navigateSpy).toHaveBeenCalledWith(['/calendar']);
  });

  it('should show delete error message on failure', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance['requestDelete']();
    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectTripsDeleteStatus, 'failure');
    store.refreshState();
    TestBed.flushEffects();

    expect(fixture.componentInstance['deleteError']()).toBe('tripDetail.deleteError');
  });
});

describe('TripDetailComponent — clear booking operation', () => {
  let store: MockStore;

  beforeEach(async () => {
    store = await setupModule([MOCK_TRIP_WITH_BOOKINGS]);
  });

  it('should dispatch updateTrip with hotel booking cleared', () => {
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();

    const dispatchSpy = vi.spyOn(store, 'dispatch');

    fixture.componentInstance['requestClearBooking']('hotel');
    fixture.componentInstance['onClearBooking']();

    expect(dispatchSpy).toHaveBeenCalledWith(TripActions.updateTrip({
      id: MOCK_TRIP_WITH_BOOKINGS.id,
      request: {
        destination: MOCK_TRIP_WITH_BOOKINGS.destination,
        startDate: MOCK_TRIP_WITH_BOOKINGS.startDate,
        endDate: MOCK_TRIP_WITH_BOOKINGS.endDate,
        status: MOCK_TRIP_WITH_BOOKINGS.status,
        trainBooking: MOCK_TRIP_WITH_BOOKINGS.trainBooking ?? null,
        hotelBooking: null,
      },
    }));
  });
});

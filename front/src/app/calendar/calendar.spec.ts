import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { CalendarComponent } from './calendar';
import { Trip, TripStatus } from '../trip/trip.model';
import { selectAllTrips, selectTripsCreateStatus, selectTripsDeleteStatus, selectTripsLoadStatus, selectTripsUpdateStatus } from '../trip/store/trip.selectors';
import { selectTripsError } from '../trip/store/trip.selectors';
import { selectConstraints } from '../constraints/store/settings.selectors';
import { ApiStatus } from '../trip/store/trip.reducer';

const EN_TRANSLATIONS = {
  calendarHeading: 'Trip calendar',
  calendarNavLabel: 'Calendar navigation',
  previousMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
  monthSelectLabel: 'Month',
  yearInputLabel: 'Year',
  todayButton: 'Today',
  newTripButton: 'New trip',
  calendarLoading: 'Loading trips…',
  calendarLoadError: 'Failed to load trips. Please try again.',
  calendarRetryButton: 'Retry',
  addTripForDay: 'Add a trip on {{month}} {{date}}, {{year}}',
  tripEventsForDay: 'Trip events for {{month}} {{date}}, {{year}}',
  tripStatusLegendLabel: 'Trip status legend',
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
    delete: 'Delete',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the trip. Please try again.',
    deleteError: 'An error occurred while deleting the trip. Please try again.',
  },
};

async function setupWithMockStore(trips: Trip[] = []): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [CalendarComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectAllTrips, value: trips },
          { selector: selectTripsLoadStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsError, value: null },
          { selector: selectConstraints, value: null },
          { selector: selectTripsCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsUpdateStatus, value: 'idle' as ApiStatus },
          { selector: selectTripsDeleteStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');
}

describe('CalendarComponent', () => {
  beforeEach(async () => {
    await setupWithMockStore();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display a calendar grid', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const table = compiled.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('should display day of week headers', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const headers = compiled.querySelectorAll('th');
    expect(headers.length).toBe(7);
  });

  it('should display calendar weeks with days', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.length).toBeLessThanOrEqual(6);

    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells.length).toBe(7);
  });

  it('should have a previous month button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const prevButton = compiled.querySelector('button[aria-label]');
    expect(prevButton).toBeTruthy();
    expect(prevButton?.getAttribute('aria-label')).toBe('Previous month');
  });

  it('should have a next month button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button[aria-label]');
    const nextButton = buttons[1];
    expect(nextButton).toBeTruthy();
    expect(nextButton?.getAttribute('aria-label')).toBe('Next month');
  });

  it('should have a today button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const todayBtn = buttons.find((b) => b.textContent?.trim() === 'Today');
    expect(todayBtn).toBeTruthy();
  });

  it('should have month select and year number input', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const monthSelect = compiled.querySelector('#month-select') as HTMLSelectElement;
    const yearInput = compiled.querySelector('#year-input') as HTMLInputElement;
    expect(monthSelect).toBeTruthy();
    expect(yearInput).toBeTruthy();
    expect(monthSelect.options.length).toBe(12);
    expect(yearInput.type).toBe('number');
    expect(yearInput.min).toBe('2000');
    expect(yearInput.max).toBe('2099');
  });

  it('should navigate to previous month when clicking previous button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const initialMonth = component['currentMonth']();
    const initialYear = component['currentYear']();

    component.goToPreviousMonth();
    fixture.detectChanges();

    if (initialMonth === 0) {
      expect(component['currentMonth']()).toBe(11);
      expect(component['currentYear']()).toBe(initialYear - 1);
    } else {
      expect(component['currentMonth']()).toBe(initialMonth - 1);
      expect(component['currentYear']()).toBe(initialYear);
    }
  });

  it('should navigate to next month when clicking next button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const initialMonth = component['currentMonth']();
    const initialYear = component['currentYear']();

    component.goToNextMonth();
    fixture.detectChanges();

    if (initialMonth === 11) {
      expect(component['currentMonth']()).toBe(0);
      expect(component['currentYear']()).toBe(initialYear + 1);
    } else {
      expect(component['currentMonth']()).toBe(initialMonth + 1);
      expect(component['currentYear']()).toBe(initialYear);
    }
  });

  it('should navigate to today when clicking today button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.goToNextMonth();
    component.goToNextMonth();
    fixture.detectChanges();

    component.goToToday();
    fixture.detectChanges();

    const today = new Date();
    expect(component['currentMonth']()).toBe(today.getMonth());
    expect(component['currentYear']()).toBe(today.getFullYear());
  });

  it('should handle December to January transition correctly', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['currentMonth'].set(11);
    component['currentYear'].set(2025);
    fixture.detectChanges();

    component.goToNextMonth();
    fixture.detectChanges();

    expect(component['currentMonth']()).toBe(0);
    expect(component['currentYear']()).toBe(2026);
  });

  it('should handle January to December transition correctly', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component['currentMonth'].set(0);
    component['currentYear'].set(2026);
    fixture.detectChanges();

    component.goToPreviousMonth();
    fixture.detectChanges();

    expect(component['currentMonth']()).toBe(11);
    expect(component['currentYear']()).toBe(2025);
  });

  it('should have accessible section with heading', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.getAttribute('aria-labelledby')).toBe('calendar-heading');

    const heading = compiled.querySelector('#calendar-heading');
    expect(heading).toBeTruthy();
  });

  it('should have accessible navigation with aria-label', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should have labeled form controls', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const monthLabel = compiled.querySelector('label[for="month-select"]');
    const yearLabel = compiled.querySelector('label[for="year-input"]');
    expect(monthLabel).toBeTruthy();
    expect(yearLabel).toBeTruthy();
  });
});

describe('CalendarComponent — trip events', () => {
  const MOCK_TRIPS: Trip[] = [
    {
      id: 't1',
      startDate: '2026-04-06',
      endDate: '2026-04-08',
      destination: 'Lyon',
      status: TripStatus.Confirmed,
    },
    {
      id: 't2',
      startDate: '2026-04-14',
      endDate: '2026-04-14',
      destination: 'Bordeaux',
      status: TripStatus.Planned,
    },
    {
      id: 't3',
      startDate: '2026-04-22',
      endDate: '2026-04-22',
      destination: 'Lille',
      status: TripStatus.Cancelled,
    },
  ];

  beforeEach(async () => {
    await setupWithMockStore(MOCK_TRIPS);
  });

  function createFixtureForApril2026() {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    component['currentMonth'].set(3); // April (0-indexed)
    component['currentYear'].set(2026);
    fixture.detectChanges();
    return fixture;
  }

  it('should display trip event badges in day cells', async () => {
    const fixture = createFixtureForApril2026();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tripBadges = compiled.querySelectorAll('button[aria-label]');
    // filter out the "add trip" buttons which have a different aria-label format
    const tripEventBadges = Array.from(tripBadges).filter(
      (b) => !b.getAttribute('aria-label')?.startsWith('Add a trip'),
    );
    expect(tripEventBadges.length).toBeGreaterThan(0);
  });

  it('should show trip destination text in badge', async () => {
    const fixture = createFixtureForApril2026();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = Array.from(compiled.querySelectorAll('li'));
    const lyonBadge = badges.find((b) => b.textContent?.includes('Lyon'));
    expect(lyonBadge).toBeTruthy();
  });

  it('should display a status legend', async () => {
    const fixture = createFixtureForApril2026();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const legend = compiled.querySelector('[role="note"]');
    expect(legend).toBeTruthy();
    expect(legend?.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('CalendarComponent — no trips', () => {
  beforeEach(async () => {
    await setupWithMockStore([]);
  });

  it('should show no trip badges when no trips exist', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tripLists = compiled.querySelectorAll('ul[aria-label]');
    expect(tripLists.length).toBe(0);
  });
});

describe('CalendarComponent — trip form', () => {
  beforeEach(async () => {
    // JSDOM does not implement HTMLDialogElement.showModal(); stub it
    HTMLDialogElement.prototype.showModal = () => {};
    await setupWithMockStore([]);
  });

  it('should have a "New trip" button', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const newTripBtn = buttons.find((b) => b.textContent?.includes('New trip'));
    expect(newTripBtn).toBeTruthy();
  });

  it('should open the form modal when "New trip" button is clicked', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component['isFormOpen']()).toBe(false);

    component.openCreateForm();
    fixture.detectChanges();

    expect(component['isFormOpen']()).toBe(true);
    expect(component['editingTrip']()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const modal = compiled.querySelector('dialog');
    expect(modal).toBeTruthy();
  });

  it('should close the form modal on cancel', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openCreateForm();
    fixture.detectChanges();

    component.closeForm();
    fixture.detectChanges();

    expect(component['isFormOpen']()).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    const modal = compiled.querySelector('dialog');
    expect(modal).toBeNull();
  });

  it('should pre-fill the editing trip when opening in edit mode', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const trip: Trip = {
      id: 'edit-1',
      destination: 'Marseille',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      status: TripStatus.Planned,
    };

    component.openEditForm(trip);
    fixture.detectChanges();

    expect(component['isFormOpen']()).toBe(true);
    expect(component['editingTrip']()).toEqual(trip);
  });
});


import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { PlanningDashboardComponent } from './planning-dashboard';
import { selectAllTrips, selectTripsLoadStatus } from '../trip/store/trip.selectors';
import { selectConstraints, selectPublicHolidays, selectSettingsLoadStatus } from '../constraints/store/settings.selectors';
import { selectAllPersonalLeaves } from '../personal-leave/store/personal-leave.selectors';
import { ApiStatus } from '../trip/store/trip.reducer';
import { Trip, TripStatus } from '../trip/trip.model';
import { TravelConstraints } from '../constraints/constraints.model';

const EN_TRANSLATIONS = {
  planningDashboard: {
    heading: 'Trips to plan',
    loading: 'Loading…',
    loadError: 'Failed to load data. Please try again.',
    retry: 'Retry',
    noItems: 'No trips to plan in the coming period.',
    plannedTripLabel: 'Planned trip',
    availableMonthLabel: 'Month to fill',
    tripDaysUsed: '{{used}} / {{max}} days used',
    viewAllButton: 'View all planning',
    viewFullCalendar: 'View full calendar',
    suggestSlots: 'Suggest slots',
    suggestionsHeading: 'Suggestions for {{month}}',
    noSuggestions: 'No valid slots found for this month.',
    suggestionLabel: '{{days}} day(s): {{startDate}} – {{endDate}}',
    acceptSuggestion: 'Accept',
    dismissSuggestions: 'Close',
  },
  tripStatus: {
    planned: 'Planned',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  },
};

const DEFAULT_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [],
  maxDaysPerMonth: 5,
  considerPublicHolidays: false,
  considerVacationDays: false,
  isStrict: false,
  planningHorizonDays: 90,
  trainBookingThresholdDays: 90,
  publicHolidayRegions: [],
      schoolHolidayZones: [],
};

async function setupWithMockStore(
  trips: Trip[] = [],
  constraints: TravelConstraints | null = DEFAULT_CONSTRAINTS,
): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [PlanningDashboardComponent, TranslateModule.forRoot()],
    providers: [
      provideRouter([]),
      provideMockStore({
        selectors: [
          { selector: selectAllTrips, value: trips },
          { selector: selectTripsLoadStatus, value: 'idle' as ApiStatus },
          { selector: selectConstraints, value: constraints },
          { selector: selectSettingsLoadStatus, value: 'idle' as ApiStatus },
          { selector: selectPublicHolidays, value: [] },
          { selector: selectAllPersonalLeaves, value: [] },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');
}

describe('PlanningDashboardComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    await setupWithMockStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the heading by default', async () => {
    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Trips to plan');
  });

  it('should hide the heading when showHeading is false', async () => {
    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.componentRef.setInput('showHeading', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h2');
    expect(heading).toBeNull();
  });

  it('should display "no items" message when no items exist', async () => {
    await TestBed.resetTestingModule();
    await setupWithMockStore([], { ...DEFAULT_CONSTRAINTS, maxDaysPerMonth: null });

    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No trips to plan in the coming period.');
  });

  it('should display a planned trip within the horizon', async () => {
    const trips: Trip[] = [
      {
        id: 't1',
        startDate: '2026-01-20',
        endDate: '2026-01-22',
        destination: 'Lyon',
        status: TripStatus.Planned,
      },
    ];
    await TestBed.resetTestingModule();
    await setupWithMockStore(trips, { ...DEFAULT_CONSTRAINTS, maxDaysPerMonth: null });

    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lyon');
  });

  it('should limit displayed items when maxItems is set', async () => {
    const trips: Trip[] = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      startDate: `2026-01-${20 + i}`,
      endDate: `2026-01-${20 + i}`,
      destination: `City ${i}`,
      status: TripStatus.Planned,
    }));
    await TestBed.resetTestingModule();
    await setupWithMockStore(trips, { ...DEFAULT_CONSTRAINTS, maxDaysPerMonth: null });

    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.componentRef.setInput('maxItems', 2);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('ul > li');
    expect(items.length).toBe(2);
  });

  it('should show retry button on error', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PlanningDashboardComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectAllTrips, value: [] },
            { selector: selectTripsLoadStatus, value: 'failure' as ApiStatus },
            { selector: selectConstraints, value: null },
            { selector: selectSettingsLoadStatus, value: 'idle' as ApiStatus },
            { selector: selectPublicHolidays, value: [] },
            { selector: selectAllPersonalLeaves, value: [] },
          ],
        }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', EN_TRANSLATIONS);
    translate.use('en');

    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const retryBtn = compiled.querySelector('button');
    expect(retryBtn?.textContent?.trim()).toBe('Retry');
  });

  it('should have an accessible section', async () => {
    const fixture = TestBed.createComponent(PlanningDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('planning-dashboard-heading');
  });
});

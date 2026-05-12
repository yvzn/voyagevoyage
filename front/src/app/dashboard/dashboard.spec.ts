import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard';
import { selectAllTrips, selectTripsLoadStatus } from '../trip/store/trip.selectors';
import { selectConstraints, selectSettingsLoadStatus } from '../constraints/store/settings.selectors';
import { ApiStatus } from '../trip/store/trip.reducer';
import { Trip, TripStatus } from '../trip/trip.model';

const EN_TRANSLATIONS = {
  dashboardNavItem: 'Dashboard',
  dashboard: {
    heading: 'Dashboard',
    calendarSectionHeading: 'Upcoming trips',
    planningSectionHeading: 'Trips to plan',
  },
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
  },
  tripStatus: {
    planned: 'Planned',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  },
};

async function setupWithMockStore(trips: Trip[] = []): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [DashboardComponent, TranslateModule.forRoot()],
    providers: [
      provideRouter([]),
      provideMockStore({
        selectors: [
          { selector: selectAllTrips, value: trips },
          { selector: selectTripsLoadStatus, value: 'idle' as ApiStatus },
          { selector: selectConstraints, value: null },
          { selector: selectSettingsLoadStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');
}

describe('DashboardComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // Thursday 2026-01-15
    await setupWithMockStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the dashboard heading', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dashboard');
  });

  it('should display the calendar section heading', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Upcoming trips');
  });

  it('should display the planning section heading', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Trips to plan');
  });

  it('should display a 2-week calendar grid with 2 rows', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display 7 days per week row', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    const cells = rows[0].querySelectorAll('td');
    expect(cells.length).toBe(7);
  });

  it('should have a link to the full calendar', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/calendar"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('View full calendar');
  });

  it('should have a link to the planning dashboard', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="/planning-dashboard"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('View all planning');
  });

  it('should display trip in mini calendar when trip falls in the 2-week range', async () => {
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));

    const trips: Trip[] = [
      {
        id: 't1',
        startDate: '2026-01-15',
        endDate: '2026-01-15',
        destination: 'Lyon',
        status: TripStatus.Confirmed,
      },
    ];
    await TestBed.resetTestingModule();
    await setupWithMockStore(trips);

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Lyon');
  });

  it('should compute 14 mini calendar days', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const days = component['miniCalendarDays']();
    expect(days.length).toBe(14);
  });

  it('should mark today correctly in the mini calendar', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const days = component['miniCalendarDays']();
    const todayDays = days.filter((d) => d.isToday);
    expect(todayDays.length).toBe(1);
    expect(todayDays[0].date).toBe(15);
  });
});

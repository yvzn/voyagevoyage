import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import {
  CalendarDay,
  CalendarWeek,
  getCalendarWeeks,
  getDayOfWeekNames,
  getMonthNames,
} from './calendar.utils';
import { LocaleService } from '../locale.service';
import { Trip, TripStatus } from '../trip/trip.model';
import { TripFormComponent } from '../trip/trip-form/trip-form';
import { TripActions } from '../trip/store/trip.actions';
import { SettingsActions } from '../constraints/store/settings.actions';
import { selectAllTrips, selectTripsLoadStatus, selectTripsError } from '../trip/store/trip.selectors';
import { getTripStatusDotClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { ExpenseFormComponent } from '../expense/expense-form/expense-form';
import { ExpenseActions } from '../expense/store/expense.actions';
import { selectExpensesCreateStatus, selectExpensesLastCreatedTripId } from '../expense/store/expense.selectors';
import { CalendarGridComponent } from './calendar-grid';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgClass, TranslatePipe, TripFormComponent, ExpenseFormComponent, CalendarGridComponent],
  templateUrl: './calendar.html',
})
export class CalendarComponent {
  protected readonly localeService = inject(LocaleService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());

    // Navigate to trip detail after expense creation from calendar
    effect(() => {
      const status = this.expenseCreateStatus();
      // Track when a submission starts while the expense form is open
      if (this.isExpenseFormOpen() && status === 'loading') {
        this.expenseFormPending = true;
      }
      if (this.expenseFormPending && status === 'success') {
        this.expenseFormPending = false;
        const tripId = this.expenseLastCreatedTripId();
        this.isExpenseFormOpen.set(false);
        if (tripId) {
          this.router.navigate(['/trip', tripId]);
        }
      } else if (this.expenseFormPending && status === 'failure') {
        this.expenseFormPending = false;
      }
    });
  }

  protected readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly tripsLoadStatus = this.store.selectSignal(selectTripsLoadStatus);
  protected readonly tripsError = this.store.selectSignal(selectTripsError);

  protected readonly currentYear = signal(new Date().getFullYear());
  protected readonly currentMonth = signal(new Date().getMonth());

  protected readonly monthNames = computed(() => getMonthNames(this.localeService.currentLocale()));
  protected readonly dayOfWeekNames = computed(() => getDayOfWeekNames(this.localeService.currentLocale()));
  protected readonly weeks = computed<CalendarWeek[]>(() =>
    getCalendarWeeks(this.currentYear(), this.currentMonth())
  );

  protected readonly displayMonth = computed(() => this.monthNames()[this.currentMonth()]);
  protected readonly displayYear = computed(() => this.currentYear().toString());

  protected readonly minYear = 2000;
  protected readonly maxYear = 2099;

  protected readonly TripStatus = TripStatus;

  protected readonly tripStatuses = [TripStatus.Planned, TripStatus.Confirmed, TripStatus.Cancelled];

  /** Whether the trip form modal is open */
  protected readonly isFormOpen = signal(false);

  /** The trip being edited, or null when creating a new trip */
  protected readonly editingTrip = signal<Trip | null>(null);

  /** Pre-filled date for new trip creation (YYYY-MM-DD) */
  protected readonly formDefaultDate = signal<string | null>(null);

  /** Whether the expense form modal is open */
  protected readonly isExpenseFormOpen = signal(false);

  /** Pre-filled date for expense creation (YYYY-MM-DD) */
  protected readonly expenseFormDate = signal<string | null>(null);

  private readonly expenseCreateStatus = this.store.selectSignal(selectExpensesCreateStatus);
  private readonly expenseLastCreatedTripId = this.store.selectSignal(selectExpensesLastCreatedTripId);

  /** True while an expense creation dispatched from this component is in flight. */
  private expenseFormPending = false;

  protected readonly getTripStatusDotClass = getTripStatusDotClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  private formatDayKey(day: CalendarDay): string {
    return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
  }

  openCreateForm(day?: CalendarDay): void {
    this.editingTrip.set(null);
    this.formDefaultDate.set(day ? this.formatDayKey(day) : null);
    this.isFormOpen.set(true);
  }

  openCreateExpenseForm(day: CalendarDay): void {
    this.expenseFormDate.set(this.formatDayKey(day));
    this.isExpenseFormOpen.set(true);
  }

  navigateToTrip(trip: Trip): void {
    this.router.navigate(['/trip', trip.id]);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  closeExpenseForm(): void {
    this.expenseFormPending = false;
    this.isExpenseFormOpen.set(false);
  }

  retryLoadTrips(): void {
    this.store.dispatch(TripActions.loadTrips());
  }

  goToPreviousMonth(): void {
    const month = this.currentMonth();
    const year = this.currentYear();
    if (month === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(year - 1);
    } else {
      this.currentMonth.set(month - 1);
    }
  }

  goToNextMonth(): void {
    const month = this.currentMonth();
    const year = this.currentYear();
    if (month === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(year + 1);
    } else {
      this.currentMonth.set(month + 1);
    }
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
  }

  onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentMonth.set(Number(select.value));
  }

  onYearChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!isNaN(value) && value >= this.minYear && value <= this.maxYear) {
      this.currentYear.set(value);
    }
  }
}

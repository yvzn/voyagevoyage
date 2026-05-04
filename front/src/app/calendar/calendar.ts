import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  CalendarDay,
  CalendarWeek,
  getCalendarWeeks,
  getDayOfWeekNames,
  getMonthNames,
} from './calendar.utils';
import { LocaleService } from '../locale.service';
import { TripService } from '../trip/trip.service';
import { Trip, TripStatus } from '../trip/trip.model';
import { TripFormComponent } from '../trip/trip-form/trip-form';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgClass, TranslatePipe, TripFormComponent],
  templateUrl: './calendar.html',
})
export class CalendarComponent {
  protected readonly localeService = inject(LocaleService);
  private readonly tripService = inject(TripService);
  private readonly translateService = inject(TranslateService);

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

  private readonly tripsPerDay = computed(() => {
    const map = new Map<string, Trip[]>();
    for (const trip of this.tripService.trips()) {
      const [sy, sm, sd] = trip.startDate.split('-').map(Number);
      const [ey, em, ed] = trip.endDate.split('-').map(Number);
      const startTs = Date.UTC(sy, sm - 1, sd);
      const endTs = Date.UTC(ey, em - 1, ed);
      for (let ts = startTs; ts <= endTs; ts += 86400000) {
        const d = new Date(ts);
        const key = this.dayKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        const existing = map.get(key);
        if (existing) {
          existing.push(trip);
        } else {
          map.set(key, [trip]);
        }
      }
    }
    return map;
  });

  protected getTripsForDay(day: CalendarDay): Trip[] {
    return this.tripsPerDay().get(this.dayKey(day.year, day.month, day.date)) ?? [];
  }

  protected getTripStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case TripStatus.Confirmed:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case TripStatus.Cancelled:
        return 'bg-gray-100 text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400';
    }
  }

  protected getTripStatusDotClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'bg-amber-400';
      case TripStatus.Confirmed:
        return 'bg-green-500';
      case TripStatus.Cancelled:
        return 'bg-gray-400';
    }
  }

  protected getTripStatusTranslationKey(status: TripStatus): string {
    switch (status) {
      case TripStatus.Planned:
        return 'tripStatus.planned';
      case TripStatus.Confirmed:
        return 'tripStatus.confirmed';
      case TripStatus.Cancelled:
        return 'tripStatus.cancelled';
    }
  }

  protected getTripAriaLabel(trip: Trip): string {
    const statusLabel = this.translateService.instant(
      this.getTripStatusTranslationKey(trip.status)
    );
    return `${trip.destination} (${statusLabel})`;
  }

  private dayKey(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  }

  private formatDayKey(day: CalendarDay): string {
    return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
  }

  openCreateForm(day?: CalendarDay): void {
    this.editingTrip.set(null);
    this.formDefaultDate.set(day ? this.formatDayKey(day) : null);
    this.isFormOpen.set(true);
  }

  openEditForm(trip: Trip): void {
    this.editingTrip.set(trip);
    this.formDefaultDate.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
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

  trackByWeekIndex(index: number): number {
    return index;
  }

  trackByDay(_index: number, day: CalendarDay): string {
    return `${day.year}-${day.month}-${day.date}`;
  }
}

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../trip/store/trip.actions';
import { SettingsActions } from '../constraints/store/settings.actions';
import { selectAllTrips, selectTripsLoadStatus } from '../trip/store/trip.selectors';
import { getTripStatusDotClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { LocaleService } from '../locale.service';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
import { Trip } from '../trip/trip.model';
import { PlanningDashboardComponent } from '../planning-dashboard/planning-dashboard';

/** A single day in the mini calendar */
interface MiniCalendarDay {
  date: number;
  month: number;
  year: number;
  isToday: boolean;
  isCurrentPeriod: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass, TranslatePipe, PlanningDashboardComponent],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  protected readonly tripsLoadStatus = this.store.selectSignal(selectTripsLoadStatus);

  protected readonly getTripStatusDotClass = getTripStatusDotClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  /** 14 days starting from Monday of the current week */
  protected readonly miniCalendarDays = computed<MiniCalendarDay[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find Monday of the current week (ISO: Mon=1 … Sun=0)
    const dayOfWeek = today.getDay(); // 0=Sunday
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);

    const days: MiniCalendarDay[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isToday: d.getTime() === today.getTime(),
        isCurrentPeriod: true,
      });
    }
    return days;
  });

  /** Weeks split from the 14-day range */
  protected readonly miniCalendarWeeks = computed<MiniCalendarDay[][]>(() => {
    const days = this.miniCalendarDays();
    return [days.slice(0, 7), days.slice(7, 14)];
  });

  protected readonly dayOfWeekNames = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.localeService.currentLocale(), { weekday: 'short' });
    // Start from Monday (2024-01-01 is a Monday)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2024, 0, 1 + i);
      return formatter.format(date);
    });
  });

  private readonly tripsPerDay = computed(() => {
    const map = new Map<string, Trip[]>();
    for (const trip of this.allTrips()) {
      const [sy, sm, sd] = trip.startDate.split('-').map(Number);
      const [ey, em, ed] = trip.endDate.split('-').map(Number);
      const startTs = Date.UTC(sy, sm - 1, sd);
      const endTs = Date.UTC(ey, em - 1, ed);
      for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
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

  protected getTripsForDay(day: MiniCalendarDay): Trip[] {
    return this.tripsPerDay().get(this.dayKey(day.year, day.month, day.date)) ?? [];
  }

  private dayKey(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  }
}

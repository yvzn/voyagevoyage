import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripActions } from '../trip/store/trip.actions';
import { SettingsActions } from '../constraints/store/settings.actions';
import { selectAllTrips } from '../trip/store/trip.selectors';
import { LocaleService } from '../locale.service';
import { CalendarDay, CalendarWeek, getDayOfWeekNames } from '../calendar/calendar.utils';
import { PlanningDashboardComponent } from '../planning-dashboard/planning-dashboard';
import { CalendarGridComponent } from '../calendar/calendar-grid';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PlanningDashboardComponent, CalendarGridComponent],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(SettingsActions.loadSettings());
  }

  protected readonly allTrips = this.store.selectSignal(selectAllTrips);

  protected readonly dayOfWeekNames = computed(() => getDayOfWeekNames(this.localeService.currentLocale()));

  /** 14 days starting from Monday of the current ISO week */
  protected readonly miniCalendarDays = computed<CalendarDay[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find Monday of the current ISO week (Mon=1 … Sun=0)
    const dayOfWeek = today.getDay(); // 0=Sunday
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
      });
    }
    return days;
  });

  /** Two CalendarWeek objects covering the 14-day range */
  protected readonly miniCalendarWeeks = computed<CalendarWeek[]>(() => {
    const days = this.miniCalendarDays();
    return [
      { days: days.slice(0, 7) },
      { days: days.slice(7, 14) },
    ];
  });
}

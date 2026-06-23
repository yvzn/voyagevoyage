import { Component, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Trip } from '../trip/trip.model';
import { Expense } from '../expense/expense.model';
import { CalendarDay, CalendarWeek } from './calendar.utils';
import { getTripStatusClass, getTripStatusDotClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { MILLISECONDS_PER_DAY, parseISODateUTC } from '../planning-dashboard/planning-dashboard.utils';
import { DayConstraints } from './calendar-constraints.utils';

/**
 * Shared calendar grid component used by both CalendarComponent (full monthly view)
 * and DashboardComponent (compact 2-week mini calendar).
 *
 * In compact mode (compact=true): renders a dense 2-week grid with trip dots and RouterLinks.
 * In full mode (compact=false): renders the full monthly grid with add-trip/expense buttons
 *   and emits events for trip navigation and form actions.
 */
@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [NgClass, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './calendar-grid.html'
})
export class CalendarGridComponent {
  /**
   * TranslateService is used only in non-compact mode for `getTripAriaLabel`, which builds
   * accessible labels for trip buttons in the full monthly calendar. In compact mode the
   * grid renders simple RouterLinks and this service is never called.
   */
  private readonly translateService = inject(TranslateService);

  /** Rows of days to render. Each CalendarWeek has exactly 7 CalendarDay entries. */
  readonly weeks = input<CalendarWeek[]>([]);

  /** All trips to display across the grid (used to compute per-day mapping). */
  readonly trips = input<Trip[]>([]);

  /** All expenses (used to check if a trip has saved expenses). */
  readonly expenses = input<Expense[]>([]);

  /**
   * Pre-built map from ISO date string (YYYY-MM-DD) to the constraints applying on that day.
   * Built by the `selectConstraintsPerDay` selector in the parent component.
   */
  readonly constraintsPerDay = input<Map<string, DayConstraints>>(new Map());

  /**
   * Weekday numbers (0=Sun … 6=Sat) that are allowed for travel.
   * Days falling outside this list are highlighted as a restricted-weekday constraint.
   * An empty array means no weekday restriction.
   */
  readonly allowedDaysOfWeek = input<number[]>([]);

  /** Localized short names for days of the week, starting from Monday. */
  readonly dayNames = input<string[]>([]);

  /** When true, renders a compact 2-week grid (dashboard mini calendar). */
  readonly compact = input<boolean>(false);

  /** Localized month name for aria labels on add-trip/expense buttons (non-compact mode). */
  readonly displayMonth = input<string>('');

  /** Year string for aria labels on add-trip/expense buttons (non-compact mode). */
  readonly displayYear = input<string>('');

  /** Emitted when the user clicks a trip badge (non-compact mode). Parent handles navigation. */
  readonly tripClicked = output<Trip>();

  /** Emitted when the user clicks the add-trip button for a day (non-compact mode). */
  readonly addTripClicked = output<CalendarDay>();

  protected readonly getTripStatusClass = getTripStatusClass;
  protected readonly getTripStatusDotClass = getTripStatusDotClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  /** Map from day key (YYYY-MM-DD) to trips occurring on that day. */
  private readonly tripsPerDay = computed(() => {
    const map = new Map<string, Trip[]>();
    for (const trip of this.trips()) {
      const startTs = parseISODateUTC(trip.startDate);
      const endTs = parseISODateUTC(trip.endDate);
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

  protected getTripsForDay(day: CalendarDay): Trip[] {
    return this.tripsPerDay().get(this.dayKey(day.year, day.month, day.date)) ?? [];
  }

  protected getConstraintsForDay(day: CalendarDay): DayConstraints {
    const key = this.dayKey(day.year, day.month, day.date);
    return this.constraintsPerDay().get(key) ?? { publicHolidays: [], schoolHolidays: [], personalLeaves: [] };
  }

  /** Returns true when the day falls outside the allowed weekdays (if any restriction is configured). */
  protected isRestrictedWeekday(day: CalendarDay): boolean {
    const allowed = this.allowedDaysOfWeek();
    if (allowed.length === 0) return false;
    const d = new Date(day.year, day.month, day.date);
    return !allowed.includes(d.getDay());
  }

  /**
   * Returns the CSS classes for a calendar day cell.
   * Blocking constraints (public holidays, personal leaves, restricted weekday) get a gray background.
   * School holidays alone (non-blocking) show only an icon with no background change.
   */
  protected getDayCellClass(day: CalendarDay): string {
    const key = this.dayKey(day.year, day.month, day.date);
    const constraints = this.constraintsPerDay().get(key);
    const hasBlockingConstraint =
      this.isRestrictedWeekday(day) ||
      (constraints?.publicHolidays.length ?? 0) > 0 ||
      (constraints?.personalLeaves.length ?? 0) > 0;
    if (hasBlockingConstraint) {
      return 'hover:bg-gray-50 dark:hover:bg-gray-700/30';
    }
    return 'border-l-4 border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 dark:border-blue-700/50';
  }

  protected getTripAriaLabel(trip: Trip): string {
    const statusLabel = this.translateService.instant(getTripStatusTranslationKey(trip.status));
    return `${trip.destination} (${statusLabel})`;
  }

  protected tripHasExpenses(trip: Trip): boolean {
    return this.expenses().some(e => e.tripId === trip.id);
  }

  private dayKey(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  }

  protected trackByDay(_index: number, day: CalendarDay): string {
    return `${day.year}-${day.month}-${day.date}`;
  }
}

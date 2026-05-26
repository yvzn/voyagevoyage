import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Trip } from '../trip/trip.model';
import { CalendarDay, CalendarWeek } from './calendar.utils';
import { getTripStatusClass, getTripStatusDotClass, getTripStatusTranslationKey } from '../trip/trip-status.utils';
import { MILLISECONDS_PER_DAY, parseISODateUTC } from '../planning-dashboard/planning-dashboard.utils';
import { PublicHoliday, SchoolHoliday } from '../constraints/constraints.model';
import { PersonalLeave } from '../personal-leave/personal-leave.model';

/** Constraints resolved for a single calendar day. */
export interface DayConstraints {
  publicHolidays: PublicHoliday[];
  schoolHolidays: SchoolHoliday[];
  personalLeaves: PersonalLeave[];
}

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
  templateUrl: './calendar-grid.html',
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

  /** Public holidays to display as constraint markers. */
  readonly publicHolidays = input<PublicHoliday[]>([]);

  /** School holidays to display as constraint markers. */
  readonly schoolHolidays = input<SchoolHoliday[]>([]);

  /** Personal leaves to display as constraint markers. */
  readonly personalLeaves = input<PersonalLeave[]>([]);

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

  /** Map from day key (YYYY-MM-DD) to public holidays on that day. */
  private readonly publicHolidaysPerDay = computed(() => {
    const map = new Map<string, PublicHoliday[]>();
    for (const holiday of this.publicHolidays()) {
      const key = holiday.date;
      const existing = map.get(key);
      if (existing) {
        existing.push(holiday);
      } else {
        map.set(key, [holiday]);
      }
    }
    return map;
  });

  /** Map from day key (YYYY-MM-DD) to school holiday periods covering that day. */
  private readonly schoolHolidaysPerDay = computed(() => {
    const map = new Map<string, SchoolHoliday[]>();
    for (const holiday of this.schoolHolidays()) {
      const startTs = parseISODateUTC(holiday.startDate);
      const endTs = parseISODateUTC(holiday.endDate);
      for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
        const d = new Date(ts);
        const key = this.dayKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        const existing = map.get(key);
        if (existing) {
          existing.push(holiday);
        } else {
          map.set(key, [holiday]);
        }
      }
    }
    return map;
  });

  /** Map from day key (YYYY-MM-DD) to personal leave periods covering that day. */
  private readonly personalLeavesPerDay = computed(() => {
    const map = new Map<string, PersonalLeave[]>();
    for (const leave of this.personalLeaves()) {
      const startTs = parseISODateUTC(leave.startDate);
      const endTs = parseISODateUTC(leave.endDate);
      for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
        const d = new Date(ts);
        const key = this.dayKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        const existing = map.get(key);
        if (existing) {
          existing.push(leave);
        } else {
          map.set(key, [leave]);
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
    return {
      publicHolidays: this.publicHolidaysPerDay().get(key) ?? [],
      schoolHolidays: this.schoolHolidaysPerDay().get(key) ?? [],
      personalLeaves: this.personalLeavesPerDay().get(key) ?? [],
    };
  }

  protected hasConstraints(day: CalendarDay): boolean {
    const key = this.dayKey(day.year, day.month, day.date);
    return (
      (this.publicHolidaysPerDay().get(key)?.length ?? 0) > 0 ||
      (this.schoolHolidaysPerDay().get(key)?.length ?? 0) > 0 ||
      (this.personalLeavesPerDay().get(key)?.length ?? 0) > 0
    );
  }

  protected getDayCellClass(day: CalendarDay): string {
    if (this.hasConstraints(day)) {
      return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30';
    }
    return 'hover:bg-gray-50 dark:hover:bg-gray-700/30';
  }

  protected getTripAriaLabel(trip: Trip): string {
    const statusLabel = this.translateService.instant(getTripStatusTranslationKey(trip.status));
    return `${trip.destination} (${statusLabel})`;
  }

  private dayKey(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  }

  protected trackByDay(_index: number, day: CalendarDay): string {
    return `${day.year}-${day.month}-${day.date}`;
  }
}

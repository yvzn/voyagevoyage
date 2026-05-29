import { Trip, TripStatus } from '../trip/trip.model';
import { TravelConstraints, PublicHoliday } from '../constraints/constraints.model';
import { PersonalLeave } from '../personal-leave/personal-leave.model';

export interface PlannedTripItem {
  type: 'planned-trip';
  trip: Trip;
}

export interface AvailableMonthItem {
  type: 'available-month';
  year: number;
  /** 0-indexed month (0 = January) */
  month: number;
  tripDaysUsed: number;
  maxDaysPerMonth: number;
}

export type PlanningItem = PlannedTripItem | AvailableMonthItem;

export interface TripSlotSuggestion {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
}

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses a YYYY-MM-DD date string into a UTC timestamp. */
export function parseISODateUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Computes planning items from the current trips and constraints.
 *
 * Returns:
 * - Trips with status "planned" whose start date falls within the planning horizon
 * - Months between today and the planning horizon where maxDaysPerMonth has not yet been reached
 */
export function getPlanningItems(
  trips: Trip[],
  constraints: TravelConstraints | null | undefined,
): PlanningItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const horizonDays = constraints?.planningHorizonDays ?? 90;
  const horizonDate = new Date(today);
  horizonDate.setDate(horizonDate.getDate() + horizonDays);

  const items: PlanningItem[] = [];

  // 1. Planned trips whose start date falls within the horizon
  for (const trip of trips) {
    if (trip.status !== TripStatus.Planned) continue;
    const startDate = new Date(parseISODateUTC(trip.startDate));
    if (startDate >= today && startDate <= horizonDate) {
      items.push({ type: 'planned-trip', trip });
    }
  }

  // 2. Months with remaining capacity (only when maxDaysPerMonth is set)
  const maxDays = constraints?.maxDaysPerMonth;
  if (maxDays != null && maxDays > 0) {
    // Build a map of trip days per month (excluding cancelled trips)
    const tripDaysPerMonth = new Map<string, number>();
    for (const trip of trips) {
      if (trip.status === TripStatus.Cancelled) continue;
      const startTs = parseISODateUTC(trip.startDate);
      const endTs = parseISODateUTC(trip.endDate);
      for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
        const d = new Date(ts);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        tripDaysPerMonth.set(key, (tripDaysPerMonth.get(key) ?? 0) + 1);
      }
    }

    // Iterate months from today's month to the horizon's month
    const startMonth = today.getFullYear() * 12 + today.getMonth();
    const endMonth = horizonDate.getFullYear() * 12 + horizonDate.getMonth();

    for (let m = startMonth; m <= endMonth; m++) {
      const year = Math.floor(m / 12);
      const month = m % 12;
      const key = `${year}-${month}`;
      const used = tripDaysPerMonth.get(key) ?? 0;
      if (used < maxDays) {
        items.push({ type: 'available-month', year, month, tripDaysUsed: used, maxDaysPerMonth: maxDays });
      }
    }
  }

  return items;
}

/**
 * Suggests travel slots for the given month that comply with the user's constraints.
 *
 * A day is considered "blocked" when it falls outside the allowed days of the week,
 * coincides with a public holiday (if considerPublicHolidays), or overlaps a personal
 * leave period (if considerVacationDays).  School holidays are intentionally NOT
 * treated as blocking (per business rules).
 *
 * Returns up to `maxSuggestions` contiguous windows of valid days, each trimmed to
 * at most `remainingDays` days.
 */
export function suggestTripSlots(
  year: number,
  /** 0-indexed month (0 = January) */
  month: number,
  remainingDays: number,
  constraints: TravelConstraints,
  publicHolidays: PublicHoliday[],
  personalLeaves: PersonalLeave[],
  maxSuggestions: number = 3,
): TripSlotSuggestion[] {
  if (remainingDays <= 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publicHolidaySet = new Set(publicHolidays.map((h) => h.date));

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  // Start from today when the target month is the current or past month
  const startDate = firstDayOfMonth < today ? new Date(today) : new Date(firstDayOfMonth);

  if (startDate > lastDayOfMonth) return [];

  // Collect all valid (non-blocked) dates in the month
  const validDates: string[] = [];
  const current = new Date(startDate);
  while (current <= lastDayOfMonth) {
    const dateStr = formatDateLocal(current);
    if (!isDayBlocked(dateStr, current.getDay(), constraints, publicHolidaySet, personalLeaves)) {
      validDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  if (validDates.length === 0) return [];

  // Split valid dates into consecutive runs
  const runs: Array<{ start: string; end: string; length: number }> = [];
  let runStart = 0;

  for (let i = 0; i < validDates.length; i++) {
    const isLast = i === validDates.length - 1;
    const isGap =
      !isLast &&
      parseISODateUTC(validDates[i + 1]) - parseISODateUTC(validDates[i]) !== MILLISECONDS_PER_DAY;

    if (isLast || isGap) {
      runs.push({ start: validDates[runStart], end: validDates[i], length: i - runStart + 1 });
      runStart = i + 1;
    }
  }

  // Convert runs to suggestions, trimming each to remainingDays
  const suggestions: TripSlotSuggestion[] = [];

  for (const run of runs) {
    if (suggestions.length >= maxSuggestions) break;

    const durationDays = Math.min(run.length, remainingDays);
    let endDate = run.end;

    if (run.length > remainingDays) {
      const d = new Date(run.start + 'T00:00:00');
      d.setDate(d.getDate() + remainingDays - 1);
      endDate = formatDateLocal(d);
    }

    suggestions.push({ startDate: run.start, endDate, durationDays });
  }

  return suggestions;
}

/** Returns true when a day should be excluded from suggested slots. */
function isDayBlocked(
  dateStr: string,
  dayOfWeek: number,
  constraints: TravelConstraints,
  publicHolidaySet: Set<string>,
  personalLeaves: PersonalLeave[],
): boolean {
  if (constraints.allowedDaysOfWeek.length > 0 && !constraints.allowedDaysOfWeek.includes(dayOfWeek)) {
    return true;
  }
  if (constraints.considerPublicHolidays && publicHolidaySet.has(dateStr)) {
    return true;
  }
  if (constraints.considerVacationDays) {
    for (const leave of personalLeaves) {
      if (dateStr >= leave.startDate && dateStr <= leave.endDate) {
        return true;
      }
    }
  }
  return false;
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TravelConstraints, PublicHoliday } from '../../constraints/constraints.model';
import { PersonalLeave } from '../../personal-leave/personal-leave.model';
import { Trip, TripStatus } from '../trip.model';

/**
 * The nature of the travel constraint that was violated.
 * Used by the UI to display differentiated icons and messages.
 */
export type ConstraintViolationReason =
  | 'allowedDaysOfWeek'
  | 'publicHoliday'
  | 'personalLeave'
  | 'maxDaysPerMonth';

/** Detail carried by the constraintWarning / constraintError validation error. */
export interface ConstraintViolationDetail {
  reasons: ConstraintViolationReason[];
}

/**
 * Cross-field validator that checks whether the selected date range violates the
 * user's travel constraints (days of week, public holidays, personal leaves,
 * maximum days per month).
 *
 * - Returns `{ constraintError: ConstraintViolationDetail }` when at least one
 *   constraint is violated and the constraints are **strict** (save must be blocked).
 * - Returns `{ constraintWarning: ConstraintViolationDetail }` when at least one
 *   constraint is violated and the constraints are **flexible** (warning is shown but
 *   the user can still save).
 * - Returns `null` when no constraints are configured or all selected dates comply.
 *
 * @param getConstraints    A function that returns the current TravelConstraints.
 * @param getPublicHolidays A function that returns the list of known public holidays.
 * @param getPersonalLeaves A function that returns the user's personal leave periods.
 * @param getExistingTrips  A function that returns all existing (non-cancelled) trips,
 *                          used for the maxDaysPerMonth check.
 * @param getCurrentTripId  A function that returns the id of the trip being edited
 *                          (so it is excluded from the maxDaysPerMonth count).
 */
export function constraintViolationValidator(
  getConstraints: () => TravelConstraints | null,
  getPublicHolidays: () => PublicHoliday[] = () => [],
  getPersonalLeaves: () => PersonalLeave[] = () => [],
  getExistingTrips: () => Trip[] = () => [],
  getCurrentTripId: () => string | null = () => null,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const constraints = getConstraints();
    if (!constraints) return null;

    const start = group.get('startDate')?.value as string;
    const end = group.get('endDate')?.value as string;
    if (!start || !end) return null;

    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    if (endDate < startDate) return null;

    const reasons: ConstraintViolationReason[] = [];

    // 1. Check allowed days of the week
    if (constraints.allowedDaysOfWeek.length > 0) {
      const current = new Date(startDate);
      while (current <= endDate) {
        // JS getDay(): 0 = Sunday … 6 = Saturday — matches DayOfWeek enum values
        if (!constraints.allowedDaysOfWeek.includes(current.getDay())) {
          reasons.push('allowedDaysOfWeek');
          break;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    // 2. Check public holidays
    if (constraints.considerPublicHolidays) {
      const holidaySet = new Set(getPublicHolidays().map((h) => h.date));
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = formatDate(current);
        if (holidaySet.has(dateStr)) {
          reasons.push('publicHoliday');
          break;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    // 3. Check personal leave periods
    if (constraints.considerVacationDays) {
      const leaves = getPersonalLeaves();
      const current = new Date(startDate);
      outer: while (current <= endDate) {
        const dateStr = formatDate(current);
        for (const leave of leaves) {
          if (dateStr >= leave.startDate && dateStr <= leave.endDate) {
            reasons.push('personalLeave');
            break outer;
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    // 4. Check maximum days per month
    if (constraints.maxDaysPerMonth != null && constraints.maxDaysPerMonth > 0) {
      const maxDays = constraints.maxDaysPerMonth;
      const currentTripId = getCurrentTripId();

      // Count existing trip days per month (skip cancelled trips and the trip being edited)
      const usedPerMonth = new Map<string, number>();
      for (const trip of getExistingTrips()) {
        if (trip.status === TripStatus.Cancelled) continue;
        if (trip.id === currentTripId) continue;
        const d = new Date(trip.startDate + 'T00:00:00');
        const tripEnd = new Date(trip.endDate + 'T00:00:00');
        while (d <= tripEnd) {
          const key = monthKey(d);
          usedPerMonth.set(key, (usedPerMonth.get(key) ?? 0) + 1);
          d.setDate(d.getDate() + 1);
        }
      }

      // Count how many days the new trip contributes per month
      const newDaysPerMonth = new Map<string, number>();
      const current = new Date(startDate);
      while (current <= endDate) {
        const key = monthKey(current);
        newDaysPerMonth.set(key, (newDaysPerMonth.get(key) ?? 0) + 1);
        current.setDate(current.getDate() + 1);
      }

      // Detect any month that would be over the limit
      for (const [key, newDays] of newDaysPerMonth) {
        if ((usedPerMonth.get(key) ?? 0) + newDays > maxDays) {
          reasons.push('maxDaysPerMonth');
          break;
        }
      }
    }

    if (reasons.length === 0) return null;

    const detail: ConstraintViolationDetail = { reasons };
    return constraints.isStrict ? { constraintError: detail } : { constraintWarning: detail };
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

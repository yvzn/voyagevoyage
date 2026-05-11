import { Trip, TripStatus } from '../trip/trip.model';
import { TravelConstraints } from '../constraints/constraints.model';

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

const MILLISECONDS_PER_DAY = 86400000;

/** Parses a YYYY-MM-DD date string into a UTC timestamp. */
function parseISODateUTC(dateStr: string): number {
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

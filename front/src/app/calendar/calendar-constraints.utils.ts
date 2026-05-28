import { PublicHoliday, SchoolHoliday } from '../constraints/constraints.model';
import { PersonalLeave } from '../personal-leave/personal-leave.model';
import { MILLISECONDS_PER_DAY, parseISODateUTC } from '../planning-dashboard/planning-dashboard.utils';

/** Constraints resolved for a single calendar day. */
export interface DayConstraints {
  publicHolidays: PublicHoliday[];
  schoolHolidays: SchoolHoliday[];
  personalLeaves: PersonalLeave[];
}

function isoKey(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

function getOrCreate(map: Map<string, DayConstraints>, key: string): DayConstraints {
  let entry = map.get(key);
  if (!entry) {
    entry = { publicHolidays: [], schoolHolidays: [], personalLeaves: [] };
    map.set(key, entry);
  }
  return entry;
}

/**
 * Builds a map from ISO date string (YYYY-MM-DD) to the constraints applying on that day.
 * This is a pure function suitable for use in NgRx selectors.
 */
export function buildConstraintsPerDay(
  publicHolidays: PublicHoliday[],
  schoolHolidays: SchoolHoliday[],
  personalLeaves: PersonalLeave[],
): Map<string, DayConstraints> {
  const map = new Map<string, DayConstraints>();

  for (const holiday of publicHolidays) {
    getOrCreate(map, holiday.date).publicHolidays.push(holiday);
  }

  for (const holiday of schoolHolidays) {
    const startTs = parseISODateUTC(holiday.startDate);
    const endTs = parseISODateUTC(holiday.endDate);
    for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
      const d = new Date(ts);
      getOrCreate(map, isoKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).schoolHolidays.push(holiday);
    }
  }

  for (const leave of personalLeaves) {
    const startTs = parseISODateUTC(leave.startDate);
    const endTs = parseISODateUTC(leave.endDate);
    for (let ts = startTs; ts <= endTs; ts += MILLISECONDS_PER_DAY) {
      const d = new Date(ts);
      getOrCreate(map, isoKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).personalLeaves.push(leave);
    }
  }

  return map;
}

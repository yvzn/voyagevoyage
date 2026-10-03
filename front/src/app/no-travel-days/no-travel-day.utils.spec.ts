import { describe, expect, it } from 'vitest';
import { isNoTravelDate, getRecurringDate } from './no-travel-day.utils';
import { NoTravelDay } from './no-travel-day.model';

describe('no-travel day date matching', () => {
  const oneTime: NoTravelDay = {
    id: 'once',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    isRecurring: false,
    label: '',
  };
  const recurring: NoTravelDay = {
    id: 'annual',
    startDate: '2024-02-29',
    endDate: '2024-02-29',
    isRecurring: true,
    label: '',
  };

  it('matches one-time periods inclusively without repeating next year', () => {
    expect(isNoTravelDate('2026-06-12', [oneTime])).toBe(true);
    expect(isNoTravelDate('2027-06-10', [oneTime])).toBe(false);
  });

  it('matches recurring periods on the same month and day each year', () => {
    expect(isNoTravelDate('2028-02-29', [recurring])).toBe(true);
    expect(isNoTravelDate('2027-02-28', [recurring])).toBe(false);
  });

  it('only projects leap-day recurrence into leap years', () => {
    expect(getRecurringDate(2028, recurring)).toBe('2028-02-29');
    expect(getRecurringDate(2027, recurring)).toBeNull();
  });
});

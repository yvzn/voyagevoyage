import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getPlanningItems, suggestTripSlots } from './planning-dashboard.utils';
import { Trip, TripStatus } from '../trip/trip.model';
import { TravelConstraints, DayOfWeek, PublicHoliday } from '../constraints/constraints.model';
import { PersonalLeave, LeaveType } from '../personal-leave/personal-leave.model';

const TODAY = new Date(2026, 0, 15); // 2026-01-15

function makeTrip(overrides: Partial<Trip>): Trip {
  return {
    id: 'default',
    startDate: '2026-01-20',
    endDate: '2026-01-20',
    destination: 'Paris',
    status: TripStatus.Planned,
    ...overrides,
  };
}

const DEFAULT_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [],
  maxDaysPerMonth: 5,
  considerPublicHolidays: false,
  considerVacationDays: false,
  isStrict: false,
  planningHorizonDays: 90,
  publicHolidayRegions: [],
      schoolHolidayZones: [],
};

describe('getPlanningItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a planned trip within the horizon', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-01-20', endDate: '2026-01-22', status: TripStatus.Planned });
    const items = getPlanningItems([trip], DEFAULT_CONSTRAINTS);
    const planned = items.filter((i) => i.type === 'planned-trip');
    expect(planned.length).toBe(1);
    expect((planned[0] as { trip: Trip }).trip.id).toBe('t1');
  });

  it('does not return a confirmed trip as a planned item', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-01-20', endDate: '2026-01-22', status: TripStatus.Confirmed });
    const items = getPlanningItems([trip], DEFAULT_CONSTRAINTS);
    const planned = items.filter((i) => i.type === 'planned-trip');
    expect(planned.length).toBe(0);
  });

  it('does not return a planned trip whose start date is beyond the horizon', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-06-01', endDate: '2026-06-01', status: TripStatus.Planned });
    const items = getPlanningItems([trip], { ...DEFAULT_CONSTRAINTS, planningHorizonDays: 30 });
    const planned = items.filter((i) => i.type === 'planned-trip');
    expect(planned.length).toBe(0);
  });

  it('does not return a planned trip in the past', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-01-10', endDate: '2026-01-10', status: TripStatus.Planned });
    const items = getPlanningItems([trip], DEFAULT_CONSTRAINTS);
    const planned = items.filter((i) => i.type === 'planned-trip');
    expect(planned.length).toBe(0);
  });

  it('returns available months when maxDaysPerMonth is set', () => {
    const items = getPlanningItems([], DEFAULT_CONSTRAINTS);
    const months = items.filter((i) => i.type === 'available-month');
    expect(months.length).toBeGreaterThan(0);
  });

  it('does not return available months when maxDaysPerMonth is null', () => {
    const items = getPlanningItems([], { ...DEFAULT_CONSTRAINTS, maxDaysPerMonth: null });
    const months = items.filter((i) => i.type === 'available-month');
    expect(months.length).toBe(0);
  });

  it('excludes months that have reached the maxDaysPerMonth', () => {
    // Fill January 2026 with 5 days of confirmed trips
    const trips = [
      makeTrip({ id: 't1', startDate: '2026-01-15', endDate: '2026-01-19', status: TripStatus.Confirmed }),
    ];
    const items = getPlanningItems(trips, { ...DEFAULT_CONSTRAINTS, planningHorizonDays: 30 });
    const months = items.filter((i) => i.type === 'available-month');
    const jan = months.find((i) => (i as { month: number }).month === 0);
    expect(jan).toBeUndefined();
  });

  it('does not count cancelled trips towards month capacity', () => {
    // January fully "cancelled" — should still show as available
    const trips = [
      makeTrip({ id: 't1', startDate: '2026-01-15', endDate: '2026-01-19', status: TripStatus.Cancelled }),
    ];
    const items = getPlanningItems(trips, { ...DEFAULT_CONSTRAINTS, planningHorizonDays: 30 });
    const months = items.filter((i) => i.type === 'available-month');
    const jan = months.find((i) => (i as { month: number }).month === 0);
    expect(jan).toBeDefined();
  });

  it('returns empty array when no trips and no constraints', () => {
    const items = getPlanningItems([], null);
    expect(items).toEqual([]);
  });

  it('returns correct tripDaysUsed for a partial month', () => {
    const trips = [
      makeTrip({ id: 't1', startDate: '2026-01-20', endDate: '2026-01-21', status: TripStatus.Confirmed }),
    ];
    const items = getPlanningItems(trips, { ...DEFAULT_CONSTRAINTS, planningHorizonDays: 30 });
    const months = items.filter((i) => i.type === 'available-month');
    const jan = months.find((i) => (i as { month: number }).month === 0);
    expect(jan).toBeDefined();
    expect((jan as { tripDaysUsed: number }).tripDaysUsed).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// suggestTripSlots
// ─────────────────────────────────────────────────────────────────────────────

const SUGGEST_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [],
  maxDaysPerMonth: 5,
  considerPublicHolidays: false,
  considerVacationDays: false,
  isStrict: false,
  planningHorizonDays: 90,
  publicHolidayRegions: [],
  schoolHolidayZones: [],
};

describe('suggestTripSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix today to 2026-03-01 so February is a past month we can target the end of
    vi.setSystemTime(new Date(2026, 2, 1)); // 2026-03-01
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array when remainingDays is 0', () => {
    const result = suggestTripSlots(2026, 2, 0, SUGGEST_CONSTRAINTS, [], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when target month is in the past', () => {
    // January 2026 is in the past relative to 2026-03-01
    const result = suggestTripSlots(2026, 0, 5, SUGGEST_CONSTRAINTS, [], []);
    expect(result).toEqual([]);
  });

  it('returns suggestions for the current month (March 2026)', () => {
    const result = suggestTripSlots(2026, 2, 5, SUGGEST_CONSTRAINTS, [], []);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => {
      expect(s.startDate.startsWith('2026-03')).toBe(true);
      expect(s.durationDays).toBeGreaterThan(0);
      expect(s.durationDays).toBeLessThanOrEqual(5);
    });
  });

  it('limits suggestion duration to remainingDays', () => {
    const result = suggestTripSlots(2026, 2, 2, SUGGEST_CONSTRAINTS, [], [], 1);
    expect(result.length).toBe(1);
    expect(result[0].durationDays).toBe(2);
  });

  it('excludes days not in allowedDaysOfWeek', () => {
    // Only allow Monday (1) – March 2026-03-01 is a Sunday, so first Monday is 2026-03-02
    const constraints = { ...SUGGEST_CONSTRAINTS, allowedDaysOfWeek: [DayOfWeek.Monday] };
    const result = suggestTripSlots(2026, 2, 5, constraints, [], [], 1);
    expect(result.length).toBe(1);
    // Each suggestion should only span a single Monday (consecutive Mondays are 7 days apart → not consecutive)
    expect(result[0].durationDays).toBe(1);
    expect(new Date(result[0].startDate + 'T00:00:00').getDay()).toBe(1); // Monday
  });

  it('excludes public holidays when considerPublicHolidays is true', () => {
    const constraints = { ...SUGGEST_CONSTRAINTS, considerPublicHolidays: true };
    const holiday: PublicHoliday = { id: 'h1', date: '2026-03-02', name: 'Test', region: 'test' };
    // With only 2026-03-02 blocked, first valid date from 2026-03-01 is 2026-03-01
    const result = suggestTripSlots(2026, 2, 1, constraints, [holiday], [], 1);
    expect(result[0].startDate).toBe('2026-03-01');
  });

  it('does not block school holidays (school holidays are non-blocking)', () => {
    // School holidays are deliberately ignored by suggestTripSlots
    const result = suggestTripSlots(2026, 2, 5, SUGGEST_CONSTRAINTS, [], []);
    expect(result.length).toBeGreaterThan(0);
  });

  it('excludes personal leave days when considerVacationDays is true', () => {
    const constraints = { ...SUGGEST_CONSTRAINTS, considerVacationDays: true };
    const leave: PersonalLeave = {
      id: 'l1',
      startDate: '2026-03-01',
      endDate: '2026-03-14',
      type: LeaveType.Annual,
      label: 'Vacation',
    };
    const result = suggestTripSlots(2026, 2, 1, constraints, [], [leave], 1);
    // First valid day should be after the leave period
    expect(result[0].startDate >= '2026-03-15').toBe(true);
  });

  it('returns up to maxSuggestions', () => {
    // All days free → consecutive run covers the whole month → at most 1 run = 1 suggestion
    const result = suggestTripSlots(2026, 2, 3, SUGGEST_CONSTRAINTS, [], [], 3);
    // The whole month is one continuous run trimmed to 3 days, so we get exactly 1
    expect(result.length).toBe(1);
  });

  it('returns multiple suggestions when the month has several valid windows', () => {
    // Block 2026-03-03 (Tuesday) with a public holiday to create two windows around it
    const constraints = { ...SUGGEST_CONSTRAINTS, considerPublicHolidays: true };
    const holiday: PublicHoliday = { id: 'h1', date: '2026-03-03', name: 'Test', region: 'test' };
    // Window 1: 2026-03-01 – 2026-03-02 (2 days), Window 2: 2026-03-04 onward
    const result = suggestTripSlots(2026, 2, 2, constraints, [holiday], [], 3);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].endDate).toBe('2026-03-02');
    expect(result[1].startDate).toBe('2026-03-04');
  });
});

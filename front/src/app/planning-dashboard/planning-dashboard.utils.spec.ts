import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getPlanningItems } from './planning-dashboard.utils';
import { Trip, TripStatus } from '../trip/trip.model';
import { TravelConstraints } from '../constraints/constraints.model';

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

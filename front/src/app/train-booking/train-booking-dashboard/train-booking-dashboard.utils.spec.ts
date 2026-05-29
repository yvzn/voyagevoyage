import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTripsNeedingTrainBooking } from '../train-booking.utils';
import { Trip, TripStatus } from '../../trip/trip.model';

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

describe('getTripsNeedingTrainBooking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a confirmed trip within the threshold without train booking', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-02-01', status: TripStatus.Confirmed });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('t1');
  });

  it('excludes a trip that already has a train booking', () => {
    const trip = makeTrip({
      id: 't1',
      startDate: '2026-02-01',
      status: TripStatus.Confirmed,
      trainBooking: { departure: 'Paris', arrival: 'Lyon' },
    });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('excludes a planned (non-confirmed) trip', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-02-01', status: TripStatus.Planned });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('excludes a cancelled trip', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-02-01', status: TripStatus.Cancelled });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('excludes a confirmed trip that starts after the threshold', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-05-01', status: TripStatus.Confirmed });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('excludes a confirmed trip that started in the past', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-01-10', status: TripStatus.Confirmed });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('excludes a confirmed trip that starts exactly today', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-01-15', status: TripStatus.Confirmed });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(0);
  });

  it('includes a confirmed trip exactly on the threshold boundary', () => {
    const trip = makeTrip({ id: 't1', startDate: '2026-04-15', status: TripStatus.Confirmed });
    const result = getTripsNeedingTrainBooking([trip], 90);
    expect(result.length).toBe(1);
  });

  it('returns trips sorted by startDate ascending', () => {
    const trips = [
      makeTrip({ id: 't3', startDate: '2026-03-01', status: TripStatus.Confirmed }),
      makeTrip({ id: 't1', startDate: '2026-01-20', status: TripStatus.Confirmed }),
      makeTrip({ id: 't2', startDate: '2026-02-01', status: TripStatus.Confirmed }),
    ];
    const result = getTripsNeedingTrainBooking(trips, 90);
    expect(result.map((t) => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('returns empty array when no trips provided', () => {
    const result = getTripsNeedingTrainBooking([], 90);
    expect(result.length).toBe(0);
  });

  it('respects a custom threshold (30 days)', () => {
    const within = makeTrip({ id: 'near', startDate: '2026-02-01', status: TripStatus.Confirmed }); // 17 days away
    const beyond = makeTrip({ id: 'far', startDate: '2026-03-15', status: TripStatus.Confirmed }); // 59 days away
    const result = getTripsNeedingTrainBooking([within, beyond], 30);
    expect(result.map((t) => t.id)).toEqual(['near']);
  });
});

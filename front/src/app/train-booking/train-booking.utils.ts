import { Trip, TripStatus } from '../trip/trip.model';
import { MILLISECONDS_PER_DAY, parseISODateUTC } from '../planning-dashboard/planning-dashboard.utils';

/** Returns the list of confirmed trips without train booking that start within the threshold window. */
export function getTripsNeedingTrainBooking(
  trips: Trip[],
  thresholdDays: number,
): Trip[] {
  const todayTs = Date.now();
  const thresholdTs = todayTs + thresholdDays * MILLISECONDS_PER_DAY;

  return trips
    .filter((trip) => {
      if (trip.status !== TripStatus.Confirmed) return false;
      if (trip.trainBooking) return false;
      const startTs = parseISODateUTC(trip.startDate);
      return startTs > todayTs && startTs <= thresholdTs;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

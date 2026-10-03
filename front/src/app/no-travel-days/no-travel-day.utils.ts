import { NoTravelDay } from './no-travel-day.model';

export function isNoTravelDate(date: string, noTravelDays: NoTravelDay[]): boolean {
  return noTravelDays.some((period) => {
    if (!period.isRecurring) {
      return date >= period.startDate && date <= period.endDate;
    }

    return date.slice(5) === period.startDate.slice(5);
  });
}

export function getRecurringDate(year: number, noTravelDay: NoTravelDay): string | null {
  const monthDay = noTravelDay.startDate.slice(5);
  const date = `${year}-${monthDay}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === date ? date : null;
}

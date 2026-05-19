export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export const PUBLIC_HOLIDAY_REGIONS = ['france-metropole'] as const;
export type PublicHolidayRegion = (typeof PUBLIC_HOLIDAY_REGIONS)[number];

export interface TravelConstraints {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
  planningHorizonDays: number;
  publicHolidayRegions: string[];
}

export interface UpdateTravelConstraintsRequest {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
  planningHorizonDays: number;
  publicHolidayRegions: string[];
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
  region: string;
}

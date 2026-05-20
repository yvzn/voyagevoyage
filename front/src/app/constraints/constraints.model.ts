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

export const SCHOOL_HOLIDAY_ZONES = ['Zone A', 'Zone B', 'Zone C'] as const;
export type SchoolHolidayZone = (typeof SCHOOL_HOLIDAY_ZONES)[number];

export interface TravelConstraints {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
  planningHorizonDays: number;
  publicHolidayRegions: string[];
  schoolHolidayZones: string[];
}

export interface UpdateTravelConstraintsRequest {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
  planningHorizonDays: number;
  publicHolidayRegions: string[];
  schoolHolidayZones: string[];
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
  region: string;
}

export interface SchoolHoliday {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
  zone: string;
}

export interface PersonalLeave {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
}

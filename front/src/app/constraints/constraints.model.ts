export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface TravelConstraints {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
}

export interface UpdateTravelConstraintsRequest {
  allowedDaysOfWeek: DayOfWeek[];
  maxDaysPerMonth: number | null;
  considerPublicHolidays: boolean;
  considerVacationDays: boolean;
  isStrict: boolean;
}

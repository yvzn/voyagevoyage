export enum TripStatus {
  Planned = 'planned',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export interface Trip {
  id: string;
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
}

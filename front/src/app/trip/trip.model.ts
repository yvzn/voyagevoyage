export enum TripStatus {
  Planned = 'planned',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export interface TrainBooking {
  departure: string;
  arrival: string;
  departureDateTime: string | null; // ISO 8601 datetime string or null
}

export interface Trip {
  id: string;
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking: TrainBooking | null;
}

export interface CreateTripRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking: TrainBooking | null;
}

export interface UpdateTripRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking: TrainBooking | null;
}

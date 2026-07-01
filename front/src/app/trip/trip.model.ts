export enum TripStatus {
  Planned = 'planned',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export interface TrainBooking {
  departure: string;
  arrival: string;
  departureDateTime?: string | null; // ISO 8601 datetime string or null
  returnDateTime?: string | null; // ISO 8601 datetime string or null
}

export interface HotelBooking {
  bookingDate: string; // ISO 8601 date: YYYY-MM-DD
  hotelName: string;
  hotelAddress: string;
}

export interface Trip {
  id: string;
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking?: TrainBooking | null;
  hotelBooking?: HotelBooking | null;
}

export interface CreateTripRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking?: TrainBooking | null;
  hotelBooking?: HotelBooking | null;
}

export interface UpdateTripRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  destination: string;
  status: TripStatus;
  trainBooking?: TrainBooking | null;
  hotelBooking?: HotelBooking | null;
}

export interface PatchTripRequest {
  trainBooking?: TrainBooking | null;
  hotelBooking?: HotelBooking | null;
}

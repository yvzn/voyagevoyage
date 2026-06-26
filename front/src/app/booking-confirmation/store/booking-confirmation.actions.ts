import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BookingConfirmation, ParsedBookingConfirmation } from '../booking-confirmation.model';
import { HotelBooking, TrainBooking, TripStatus } from '../../trip/trip.model';

export const BookingConfirmationActions = createActionGroup({
  source: 'BookingConfirmations',
  events: {
    'Parse Confirmation': props<{ file: File }>(),
    'Parse Confirmation Success': props<{ parsed: ParsedBookingConfirmation; file: File }>(),
    'Parse Confirmation Failure': props<{ error: string }>(),
    'Clear Parsed Confirmation': emptyProps(),

    'Upload Confirmation For Trip': props<{ tripId: string; file: File }>(),
    'Upload Confirmation For Trip Success': props<{ tripId: string; confirmation: BookingConfirmation }>(),
    'Upload Confirmation For Trip Failure': props<{ error: string }>(),

    'Load Confirmations For Trip': props<{ tripId: string }>(),
    'Load Confirmations For Trip Success': props<{ tripId: string; confirmations: BookingConfirmation[] }>(),
    'Load Confirmations For Trip Failure': props<{ error: string }>(),

    'Delete Confirmation': props<{ id: string; tripId: string }>(),
    'Delete Confirmation Success': props<{ id: string; tripId: string }>(),
    'Delete Confirmation Failure': props<{ error: string }>(),

    // Apply: upload file + update trip booking (creates trip first if tripId is null)
    'Apply Booking Confirmation': props<{
      file: File;
      tripId: string | null;
      tripDestination: string;
      tripStartDate: string;
      tripEndDate: string;
      tripStatus: TripStatus;
      trainBooking: TrainBooking | null;
      hotelBooking: HotelBooking | null;
    }>(),
    'Apply Booking Confirmation Success': props<{ tripId: string }>(),
    'Apply Booking Confirmation Failure': props<{ error: string }>(),
  },
});

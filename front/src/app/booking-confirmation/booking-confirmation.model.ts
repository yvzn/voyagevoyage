export type BookingConfirmationType = 'train' | 'hotel';

export interface ParsedBookingConfirmation {
  detectedType: BookingConfirmationType;
  providerName?: string;
  reference?: string;
  // Train
  departure?: string;
  arrival?: string;
  departureDateTime?: string;
  returnDateTime?: string;
  // Hotel
  hotelName?: string;
  hotelAddress?: string;
  checkInDate?: string;
  checkOutDate?: string;
  // Common
  price?: number;
  startDate?: string;
  endDate?: string;
}

export interface BookingConfirmation {
  id: string;
  tripId: string;
  type: BookingConfirmationType;
  providerName?: string;
  reference?: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
}

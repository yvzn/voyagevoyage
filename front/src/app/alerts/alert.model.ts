export enum AlertStatus {
  New = 'new',
  Handled = 'handled',
  Ignored = 'ignored',
}

export enum AlertType {
  TripStillPlanned = 'tripStillPlanned',
  MissingBooking = 'missingBooking',
  MissingReceipt = 'missingReceipt',
  AtypicalReceipt = 'atypicalReceipt',
  BookingDatesInconsistent = 'bookingDatesInconsistent',
}

export interface Alert {
  id: string;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  expenseId?: string | null;
  receiptId?: string | null;
  type: AlertType;
  description: string;
  status: AlertStatus;
}

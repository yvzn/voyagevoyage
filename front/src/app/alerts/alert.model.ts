export enum AlertStatus {
  New = 'New',
  Handled = 'Handled',
  Ignored = 'Ignored',
}

export enum AlertType {
  TripStillPlanned = 'TripStillPlanned',
  MissingBooking = 'MissingBooking',
  MissingReceipt = 'MissingReceipt',
  AtypicalReceipt = 'AtypicalReceipt',
  BookingDatesInconsistent = 'BookingDatesInconsistent',
}

export interface Alert {
  id: string;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  type: AlertType;
  description: string;
  status: AlertStatus;
}

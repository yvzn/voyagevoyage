export type AlertStatus = 'New' | 'Handled' | 'Ignored';

export type AlertType =
  | 'TripStillPlanned'
  | 'MissingBooking'
  | 'MissingReceipt'
  | 'AtypicalReceipt'
  | 'BookingDatesInconsistent';

export interface Alert {
  id: string;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  type: AlertType;
  description: string;
  createdAt: string;
  status: AlertStatus;
}

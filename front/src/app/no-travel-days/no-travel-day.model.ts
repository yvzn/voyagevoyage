export interface NoTravelDay {
  id: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  label: string;
}

export interface NoTravelDayRequest {
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  label: string;
}

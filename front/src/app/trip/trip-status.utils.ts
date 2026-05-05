import { TripStatus } from './trip.model';

export function getTripStatusClass(status: TripStatus): string {
  switch (status) {
    case TripStatus.Planned:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case TripStatus.Confirmed:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case TripStatus.Cancelled:
      return 'bg-gray-100 text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400';
  }
}

export function getTripStatusDotClass(status: TripStatus): string {
  switch (status) {
    case TripStatus.Planned:
      return 'bg-amber-400';
    case TripStatus.Confirmed:
      return 'bg-green-500';
    case TripStatus.Cancelled:
      return 'bg-gray-400';
  }
}

export function getTripStatusTranslationKey(status: TripStatus): string {
  switch (status) {
    case TripStatus.Planned:
      return 'tripStatus.planned';
    case TripStatus.Confirmed:
      return 'tripStatus.confirmed';
    case TripStatus.Cancelled:
      return 'tripStatus.cancelled';
  }
}

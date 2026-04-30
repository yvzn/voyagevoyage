import { Injectable, signal } from '@angular/core';
import { Trip, TripStatus } from './trip.model';

const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    startDate: '2026-04-06',
    endDate: '2026-04-08',
    destination: 'Lyon',
    status: TripStatus.Confirmed,
  },
  {
    id: '2',
    startDate: '2026-04-14',
    endDate: '2026-04-16',
    destination: 'Bordeaux',
    status: TripStatus.Planned,
  },
  {
    id: '3',
    startDate: '2026-04-22',
    endDate: '2026-04-23',
    destination: 'Lille',
    status: TripStatus.Cancelled,
  },
  {
    id: '4',
    startDate: '2026-05-04',
    endDate: '2026-05-06',
    destination: 'Nantes',
    status: TripStatus.Planned,
  },
  {
    id: '5',
    startDate: '2026-05-18',
    endDate: '2026-05-20',
    destination: 'Marseille',
    status: TripStatus.Confirmed,
  },
];

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly _trips = signal<Trip[]>(MOCK_TRIPS);

  readonly trips = this._trips.asReadonly();
}

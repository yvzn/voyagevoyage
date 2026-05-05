import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Trip, CreateTripRequest, UpdateTripRequest } from '../trip.model';

export const TripActions = createActionGroup({
  source: 'Trips',
  events: {
    // Load
    'Load Trips': emptyProps(),
    'Load Trips Success': props<{ trips: Trip[] }>(),
    'Load Trips Failure': props<{ error: string }>(),

    // Create
    'Create Trip': props<{ request: CreateTripRequest }>(),
    'Create Trip Success': props<{ trip: Trip }>(),
    'Create Trip Failure': props<{ error: string }>(),

    // Update
    'Update Trip': props<{ id: string; request: UpdateTripRequest }>(),
    'Update Trip Success': props<{ trip: Trip }>(),
    'Update Trip Failure': props<{ error: string }>(),

    // Delete
    'Delete Trip': props<{ id: string }>(),
    'Delete Trip Success': props<{ id: string }>(),
    'Delete Trip Failure': props<{ error: string }>(),
  },
});

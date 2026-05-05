import { createFeature, createReducer, on } from '@ngrx/store';
import { Trip } from '../trip.model';
import { TripActions } from './trip.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface TripsState {
  trips: Trip[];
  loadStatus: ApiStatus;
  createStatus: ApiStatus;
  updateStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
}

const initialState: TripsState = {
  trips: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};

export const tripsFeature = createFeature({
  name: 'trips',
  reducer: createReducer(
    initialState,

    // Load
    on(TripActions.loadTrips, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(TripActions.loadTripsSuccess, (state, { trips }) => ({
      ...state,
      trips,
      loadStatus: 'success' as ApiStatus,
    })),
    on(TripActions.loadTripsFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error,
    })),

    // Create
    on(TripActions.createTrip, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(TripActions.createTripSuccess, (state, { trip }) => ({
      ...state,
      trips: [...state.trips, trip],
      createStatus: 'success' as ApiStatus,
    })),
    on(TripActions.createTripFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error,
    })),

    // Update
    on(TripActions.updateTrip, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(TripActions.updateTripSuccess, (state, { trip }) => ({
      ...state,
      trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
      updateStatus: 'success' as ApiStatus,
    })),
    on(TripActions.updateTripFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error,
    })),

    // Delete
    on(TripActions.deleteTrip, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(TripActions.deleteTripSuccess, (state, { id }) => ({
      ...state,
      trips: state.trips.filter((t) => t.id !== id),
      deleteStatus: 'success' as ApiStatus,
    })),
    on(TripActions.deleteTripFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: tripsFeatureName,
  reducer: tripsReducer,
  selectTripsState,
  selectTrips,
  selectLoadStatus,
  selectCreateStatus,
  selectUpdateStatus,
  selectDeleteStatus,
  selectError,
} = tripsFeature;

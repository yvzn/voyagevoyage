import { createSelector } from '@ngrx/store';
import { selectTripsState } from './trip.reducer';

export const selectAllTrips = createSelector(selectTripsState, (state) => state.trips);
export const selectTripsLoadStatus = createSelector(selectTripsState, (state) => state.loadStatus);
export const selectTripsCreateStatus = createSelector(
  selectTripsState,
  (state) => state.createStatus,
);
export const selectTripsUpdateStatus = createSelector(
  selectTripsState,
  (state) => state.updateStatus,
);
export const selectTripsDeleteStatus = createSelector(
  selectTripsState,
  (state) => state.deleteStatus,
);
export const selectTripsError = createSelector(selectTripsState, (state) => state.error);

export const selectTripById = (id: string) =>
  createSelector(selectAllTrips, (trips) => trips.find((t) => t.id === id) ?? null);

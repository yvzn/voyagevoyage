import { createFeature, createReducer, on } from '@ngrx/store';
import { BookingConfirmation, ParsedBookingConfirmation } from '../booking-confirmation.model';
import { BookingConfirmationActions } from './booking-confirmation.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface BookingConfirmationState {
  parsedConfirmation: ParsedBookingConfirmation | null;
  parsedFile: File | null;
  parseStatus: ApiStatus;
  confirmationsByTripId: Record<string, BookingConfirmation[]>;
  uploadStatus: ApiStatus;
  loadStatus: ApiStatus;
  deleteStatus: ApiStatus;
  applyStatus: ApiStatus;
  error: string | null;
}

const initialState: BookingConfirmationState = {
  parsedConfirmation: null,
  parsedFile: null,
  parseStatus: 'idle',
  confirmationsByTripId: {},
  uploadStatus: 'idle',
  loadStatus: 'idle',
  deleteStatus: 'idle',
  applyStatus: 'idle',
  error: null,
};

export const bookingConfirmationsFeature = createFeature({
  name: 'bookingConfirmations',
  reducer: createReducer(
    initialState,

    on(BookingConfirmationActions.parseConfirmation, (state) => ({
      ...state,
      parseStatus: 'loading' as ApiStatus,
      parsedConfirmation: null,
      parsedFile: null,
      error: null,
    })),
    on(BookingConfirmationActions.parseConfirmationSuccess, (state, { parsed, file }) => ({
      ...state,
      parsedConfirmation: parsed,
      parsedFile: file,
      parseStatus: 'success' as ApiStatus,
    })),
    on(BookingConfirmationActions.parseConfirmationFailure, (state, { error }) => ({
      ...state,
      parseStatus: 'failure' as ApiStatus,
      error,
    })),
    on(BookingConfirmationActions.clearParsedConfirmation, (state) => ({
      ...state,
      parsedConfirmation: null,
      parsedFile: null,
      parseStatus: 'idle' as ApiStatus,
    })),

    on(BookingConfirmationActions.uploadConfirmationForTrip, (state) => ({
      ...state,
      uploadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(BookingConfirmationActions.uploadConfirmationForTripSuccess, (state, { tripId, confirmation }) => {
      const existing = state.confirmationsByTripId[tripId] ?? [];
      return {
        ...state,
        confirmationsByTripId: {
          ...state.confirmationsByTripId,
          [tripId]: [...existing, confirmation],
        },
        uploadStatus: 'success' as ApiStatus,
      };
    }),
    on(BookingConfirmationActions.uploadConfirmationForTripFailure, (state, { error }) => ({
      ...state,
      uploadStatus: 'failure' as ApiStatus,
      error,
    })),

    on(BookingConfirmationActions.loadConfirmationsForTrip, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(BookingConfirmationActions.loadConfirmationsForTripSuccess, (state, { tripId, confirmations }) => ({
      ...state,
      confirmationsByTripId: { ...state.confirmationsByTripId, [tripId]: confirmations },
      loadStatus: 'success' as ApiStatus,
    })),
    on(BookingConfirmationActions.loadConfirmationsForTripFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error,
    })),

    on(BookingConfirmationActions.deleteConfirmation, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(BookingConfirmationActions.deleteConfirmationSuccess, (state, { id, tripId }) => {
      const updated = (state.confirmationsByTripId[tripId] ?? []).filter((c) => c.id !== id);
      return {
        ...state,
        confirmationsByTripId: { ...state.confirmationsByTripId, [tripId]: updated },
        deleteStatus: 'success' as ApiStatus,
      };
    }),
    on(BookingConfirmationActions.deleteConfirmationFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error,
    })),

    on(BookingConfirmationActions.applyBookingConfirmation, (state) => ({
      ...state,
      applyStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(BookingConfirmationActions.applyBookingConfirmationSuccess, (state) => ({
      ...state,
      applyStatus: 'success' as ApiStatus,
      parsedConfirmation: null,
      parsedFile: null,
      parseStatus: 'idle' as ApiStatus,
    })),
    on(BookingConfirmationActions.applyBookingConfirmationFailure, (state, { error }) => ({
      ...state,
      applyStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: bookingConfirmationsFeatureName,
  reducer: bookingConfirmationsReducer,
  selectBookingConfirmationsState,
  selectParsedConfirmation,
  selectParsedFile,
  selectParseStatus,
  selectConfirmationsByTripId,
  selectUploadStatus,
  selectLoadStatus,
  selectDeleteStatus,
  selectApplyStatus,
  selectError: selectBookingConfirmationsError,
} = bookingConfirmationsFeature;

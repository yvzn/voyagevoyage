import { createFeature, createReducer, on } from '@ngrx/store';
import { NoTravelDay } from '../no-travel-day.model';
import { NoTravelDayActions } from './no-travel-day.actions';

export type NoTravelDayApiStatus = 'idle' | 'loading' | 'success' | 'failure';

interface NoTravelDayState {
  days: NoTravelDay[];
  loadStatus: NoTravelDayApiStatus;
  createStatus: NoTravelDayApiStatus;
  updateStatus: NoTravelDayApiStatus;
  deleteStatus: NoTravelDayApiStatus;
  error: string | null;
}

const initialState: NoTravelDayState = {
  days: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};

export const noTravelDayFeature = createFeature({
  name: 'noTravelDays',
  reducer: createReducer(
    initialState,
    on(NoTravelDayActions.loadNoTravelDays, (state) => ({ ...state, loadStatus: 'loading' as const, error: null })),
    on(NoTravelDayActions.loadNoTravelDaysSuccess, (state, { days }) => ({ ...state, days, loadStatus: 'success' as const })),
    on(NoTravelDayActions.loadNoTravelDaysFailure, (state, { error }) => ({ ...state, loadStatus: 'failure' as const, error })),
    on(NoTravelDayActions.createNoTravelDay, (state) => ({ ...state, createStatus: 'loading' as const, error: null })),
    on(NoTravelDayActions.createNoTravelDaySuccess, (state, { day }) => ({
      ...state, days: [...state.days, day].sort((a, b) => a.startDate.localeCompare(b.startDate)), createStatus: 'success' as const,
    })),
    on(NoTravelDayActions.createNoTravelDayFailure, (state, { error }) => ({ ...state, createStatus: 'failure' as const, error })),
    on(NoTravelDayActions.updateNoTravelDay, (state) => ({ ...state, updateStatus: 'loading' as const, error: null })),
    on(NoTravelDayActions.updateNoTravelDaySuccess, (state, { day }) => ({
      ...state, days: state.days.map((item) => item.id === day.id ? day : item)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)), updateStatus: 'success' as const,
    })),
    on(NoTravelDayActions.updateNoTravelDayFailure, (state, { error }) => ({ ...state, updateStatus: 'failure' as const, error })),
    on(NoTravelDayActions.deleteNoTravelDay, (state) => ({ ...state, deleteStatus: 'loading' as const, error: null })),
    on(NoTravelDayActions.deleteNoTravelDaySuccess, (state, { id }) => ({
      ...state, days: state.days.filter((item) => item.id !== id), deleteStatus: 'success' as const,
    })),
    on(NoTravelDayActions.deleteNoTravelDayFailure, (state, { error }) => ({ ...state, deleteStatus: 'failure' as const, error })),
  ),
});

export const {
  name: noTravelDayFeatureName,
  reducer: noTravelDayReducer,
  selectDays: selectAllNoTravelDays,
  selectLoadStatus: selectNoTravelDaysLoadStatus,
  selectCreateStatus: selectNoTravelDayCreateStatus,
  selectUpdateStatus: selectNoTravelDayUpdateStatus,
  selectDeleteStatus: selectNoTravelDayDeleteStatus,
} = noTravelDayFeature;

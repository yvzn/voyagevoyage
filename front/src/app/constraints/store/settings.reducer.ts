import { createFeature, createReducer, on } from '@ngrx/store';
import { TravelConstraints, PublicHoliday } from '../constraints.model';
import { SettingsActions } from './settings.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface SettingsState {
  constraints: TravelConstraints | null;
  publicHolidays: PublicHoliday[];
  loadStatus: ApiStatus;
  loadPublicHolidaysStatus: ApiStatus;
  updateStatus: ApiStatus;
  importIcsStatus: ApiStatus;
  importSchoolIcsStatus: ApiStatus;
  error: string | null;
}

const initialState: SettingsState = {
  constraints: null,
  publicHolidays: [],
  loadStatus: 'idle',
  loadPublicHolidaysStatus: 'idle',
  updateStatus: 'idle',
  importIcsStatus: 'idle',
  importSchoolIcsStatus: 'idle',
  error: null,
};

export const settingsFeature = createFeature({
  name: 'settings',
  reducer: createReducer(
    initialState,

    // Load
    on(SettingsActions.loadSettings, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(SettingsActions.loadSettingsSuccess, (state, { constraints }) => ({
      ...state,
      constraints,
      loadStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.loadSettingsEmpty, (state) => ({
      ...state,
      constraints: null,
      loadStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.loadSettingsFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error,
    })),

    // Update
    on(SettingsActions.updateSettings, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(SettingsActions.updateSettingsSuccess, (state, { constraints }) => ({
      ...state,
      constraints,
      updateStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.updateSettingsFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error,
    })),

    // Public holidays load
    on(SettingsActions.loadPublicHolidays, (state) => ({
      ...state,
      loadPublicHolidaysStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(SettingsActions.loadPublicHolidaysSuccess, (state, { holidays }) => ({
      ...state,
      publicHolidays: holidays,
      loadPublicHolidaysStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.loadPublicHolidaysFailure, (state, { error }) => ({
      ...state,
      loadPublicHolidaysStatus: 'failure' as ApiStatus,
      error,
    })),

    // Public holiday ICS import
    on(SettingsActions.importIcs, (state) => ({
      ...state,
      importIcsStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(SettingsActions.importIcsSuccess, (state) => ({
      ...state,
      importIcsStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.importIcsFailure, (state, { error }) => ({
      ...state,
      importIcsStatus: 'failure' as ApiStatus,
      error,
    })),

    // School holiday ICS import
    on(SettingsActions.importSchoolIcs, (state) => ({
      ...state,
      importSchoolIcsStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(SettingsActions.importSchoolIcsSuccess, (state) => ({
      ...state,
      importSchoolIcsStatus: 'success' as ApiStatus,
    })),
    on(SettingsActions.importSchoolIcsFailure, (state, { error }) => ({
      ...state,
      importSchoolIcsStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: settingsFeatureName,
  reducer: settingsReducer,
  selectSettingsState,
  selectConstraints,
  selectLoadStatus,
  selectUpdateStatus,
  selectError,
} = settingsFeature;

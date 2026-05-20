import { createSelector } from '@ngrx/store';
import { selectSettingsState } from './settings.reducer';

export const selectConstraints = createSelector(
  selectSettingsState,
  (state) => state.constraints,
);
export const selectSettingsLoadStatus = createSelector(
  selectSettingsState,
  (state) => state.loadStatus,
);
export const selectSettingsUpdateStatus = createSelector(
  selectSettingsState,
  (state) => state.updateStatus,
);
export const selectSettingsImportIcsStatus = createSelector(
  selectSettingsState,
  (state) => state.importIcsStatus,
);
export const selectSettingsImportSchoolIcsStatus = createSelector(
  selectSettingsState,
  (state) => state.importSchoolIcsStatus,
);
export const selectSettingsImportPersonalLeaveIcsStatus = createSelector(
  selectSettingsState,
  (state) => state.importPersonalLeaveIcsStatus,
);
export const selectSettingsError = createSelector(selectSettingsState, (state) => state.error);

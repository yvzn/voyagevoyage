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
export const selectSettingsError = createSelector(selectSettingsState, (state) => state.error);

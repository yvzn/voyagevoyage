import { createSelector } from '@ngrx/store';
import { selectPersonalLeaveState } from './personal-leave.reducer';

export const selectAllPersonalLeaves = createSelector(
  selectPersonalLeaveState,
  (state) => state.leaves,
);

export const selectPersonalLeavesLoadStatus = createSelector(
  selectPersonalLeaveState,
  (state) => state.loadStatus,
);

export const selectPersonalLeavesCreateStatus = createSelector(
  selectPersonalLeaveState,
  (state) => state.createStatus,
);

export const selectPersonalLeavesUpdateStatus = createSelector(
  selectPersonalLeaveState,
  (state) => state.updateStatus,
);

export const selectPersonalLeavesDeleteStatus = createSelector(
  selectPersonalLeaveState,
  (state) => state.deleteStatus,
);

export const selectPersonalLeavesImportIcsStatus = createSelector(
  selectPersonalLeaveState,
  (state) => state.importIcsStatus,
);

export const selectPersonalLeavesError = createSelector(
  selectPersonalLeaveState,
  (state) => state.error,
);

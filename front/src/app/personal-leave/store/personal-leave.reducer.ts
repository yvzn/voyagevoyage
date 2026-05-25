import { createFeature, createReducer, on } from '@ngrx/store';
import { PersonalLeave } from '../personal-leave.model';
import { PersonalLeaveActions } from './personal-leave.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface PersonalLeaveState {
  leaves: PersonalLeave[];
  loadStatus: ApiStatus;
  createStatus: ApiStatus;
  updateStatus: ApiStatus;
  deleteStatus: ApiStatus;
  importIcsStatus: ApiStatus;
  error: string | null;
}

const initialState: PersonalLeaveState = {
  leaves: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  importIcsStatus: 'idle',
  error: null,
};

export const personalLeaveFeature = createFeature({
  name: 'personalLeave',
  reducer: createReducer(
    initialState,

    // Load
    on(PersonalLeaveActions.loadPersonalLeaves, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(PersonalLeaveActions.loadPersonalLeavesSuccess, (state, { leaves }) => ({
      ...state,
      leaves,
      loadStatus: 'success' as ApiStatus,
    })),
    on(PersonalLeaveActions.loadPersonalLeavesFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error,
    })),

    // Create
    on(PersonalLeaveActions.createPersonalLeave, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(PersonalLeaveActions.createPersonalLeaveSuccess, (state, { leave }) => ({
      ...state,
      leaves: [...state.leaves, leave].sort((a, b) => a.startDate.localeCompare(b.startDate)),
      createStatus: 'success' as ApiStatus,
    })),
    on(PersonalLeaveActions.createPersonalLeaveFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error,
    })),

    // Update
    on(PersonalLeaveActions.updatePersonalLeave, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(PersonalLeaveActions.updatePersonalLeaveSuccess, (state, { leave }) => ({
      ...state,
      leaves: state.leaves
        .map((l) => (l.id === leave.id ? leave : l))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
      updateStatus: 'success' as ApiStatus,
    })),
    on(PersonalLeaveActions.updatePersonalLeaveFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error,
    })),

    // Delete
    on(PersonalLeaveActions.deletePersonalLeave, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(PersonalLeaveActions.deletePersonalLeaveSuccess, (state, { id }) => ({
      ...state,
      leaves: state.leaves.filter((l) => l.id !== id),
      deleteStatus: 'success' as ApiStatus,
    })),
    on(PersonalLeaveActions.deletePersonalLeaveFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error,
    })),

    // ICS import
    on(PersonalLeaveActions.importPersonalLeaveIcs, (state) => ({
      ...state,
      importIcsStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(PersonalLeaveActions.importPersonalLeaveIcsSuccess, (state, { leaves }) => ({
      ...state,
      leaves,
      importIcsStatus: 'success' as ApiStatus,
    })),
    on(PersonalLeaveActions.importPersonalLeaveIcsFailure, (state, { error }) => ({
      ...state,
      importIcsStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: personalLeaveFeatureName,
  reducer: personalLeaveReducer,
  selectPersonalLeaveState,
  selectLeaves,
  selectLoadStatus: selectPersonalLeavesLoadStatus,
  selectCreateStatus: selectPersonalLeavesCreateStatus,
  selectUpdateStatus: selectPersonalLeavesUpdateStatus,
  selectDeleteStatus: selectPersonalLeavesDeleteStatus,
  selectImportIcsStatus: selectPersonalLeavesImportIcsStatus,
  selectError: selectPersonalLeavesError,
} = personalLeaveFeature;

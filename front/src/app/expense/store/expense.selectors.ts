import { createSelector } from '@ngrx/store';
import { selectExpensesState } from './expense.reducer';

export const selectAllExpenses = createSelector(selectExpensesState, (state) => state.expenses);
export const selectExpensesLoadStatus = createSelector(selectExpensesState, (state) => state.loadStatus);
export const selectExpensesCreateStatus = createSelector(selectExpensesState, (state) => state.createStatus);
export const selectExpensesError = createSelector(selectExpensesState, (state) => state.error);
export const selectExpensesLastCreatedTripId = createSelector(
  selectExpensesState,
  (state) => state.lastCreatedTripId,
);

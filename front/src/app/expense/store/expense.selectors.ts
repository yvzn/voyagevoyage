import { createSelector } from '@ngrx/store';
import { selectExpensesState } from './expense.reducer';

export const selectAllExpenses = createSelector(selectExpensesState, (state) => state.expenses);
export const selectSelectedExpense = createSelector(selectExpensesState, (state) => state.selectedExpense);
export const selectExpensesLoadStatus = createSelector(selectExpensesState, (state) => state.loadStatus);
export const selectExpenseLoadByIdStatus = createSelector(selectExpensesState, (state) => state.loadByIdStatus);
export const selectExpensesCreateStatus = createSelector(selectExpensesState, (state) => state.createStatus);
export const selectExpensesUpdateStatus = createSelector(selectExpensesState, (state) => state.updateStatus);
export const selectExpensesDeleteStatus = createSelector(selectExpensesState, (state) => state.deleteStatus);
export const selectExpensesError = createSelector(selectExpensesState, (state) => state.error);
export const selectExpensesLastCreatedTripId = createSelector(
  selectExpensesState,
  (state) => state.lastCreatedTripId,
);

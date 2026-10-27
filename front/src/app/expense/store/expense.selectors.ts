import { createSelector } from '@ngrx/store';
import { selectExpensesState } from './expense.reducer';

export const selectAllExpenses = createSelector(selectExpensesState, (state) => state.expenses);
export const selectExpectedExpenses = createSelector(
  selectExpensesState,
  (state) => state.expectedExpenses,
);
export const selectExpectedExpensesTripId = createSelector(
  selectExpensesState,
  (state) => state.expectedExpensesTripId,
);
export const selectExpectedExpensesLoadStatus = createSelector(
  selectExpensesState,
  (state) => state.expectedExpensesLoadStatus,
);
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

export const selectExpensesLastCreatedExpenseId = createSelector(
  selectExpensesState,
  (state) => state.lastCreatedExpenseId,
);

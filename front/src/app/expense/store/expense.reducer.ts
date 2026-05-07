import { createFeature, createReducer, on } from '@ngrx/store';
import { Expense } from '../expense.model';
import { ExpenseActions } from './expense.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface ExpenseState {
  expenses: Expense[];
  loadStatus: ApiStatus;
  createStatus: ApiStatus;
  error: string | null;
  /** TripId where the last expense was created (used for navigation after calendar flow). */
  lastCreatedTripId: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  error: null,
  lastCreatedTripId: null,
};

export const expensesFeature = createFeature({
  name: 'expenses',
  reducer: createReducer(
    initialState,

    // Load
    on(ExpenseActions.loadExpenses, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ExpenseActions.loadExpensesSuccess, (state, { expenses }) => ({
      ...state,
      expenses,
      loadStatus: 'success' as ApiStatus,
    })),
    on(ExpenseActions.loadExpensesFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error,
    })),

    // Create (trip-detail flow)
    on(ExpenseActions.createExpense, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      lastCreatedTripId: null,
      error: null,
    })),
    on(ExpenseActions.createExpenseSuccess, (state, { expense }) => ({
      ...state,
      expenses: [...state.expenses, expense],
      createStatus: 'success' as ApiStatus,
      lastCreatedTripId: expense.tripId,
    })),
    on(ExpenseActions.createExpenseFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error,
    })),

    // Create for date (calendar flow)
    on(ExpenseActions.createExpenseForDate, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      lastCreatedTripId: null,
      error: null,
    })),
    on(ExpenseActions.createExpenseForDateSuccess, (state, { expense, tripId }) => ({
      ...state,
      expenses: [...state.expenses, expense],
      createStatus: 'success' as ApiStatus,
      lastCreatedTripId: tripId,
    })),
    on(ExpenseActions.createExpenseForDateFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: expensesFeatureName,
  reducer: expensesReducer,
  selectExpensesState,
  selectExpenses,
  selectLoadStatus: selectExpensesLoadStatus,
  selectCreateStatus: selectExpensesCreateStatus,
  selectError: selectExpensesError,
  selectLastCreatedTripId,
} = expensesFeature;

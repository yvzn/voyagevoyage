import { createFeature, createReducer, on } from '@ngrx/store';
import { Expense } from '../expense.model';
import { ExpenseActions } from './expense.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface ExpenseState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  loadStatus: ApiStatus;
  loadByIdStatus: ApiStatus;
  createStatus: ApiStatus;
  updateStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
  /** TripId where the last expense was created (used for navigation after calendar flow). */
  lastCreatedTripId: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  selectedExpense: null,
  loadStatus: 'idle',
  loadByIdStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
  lastCreatedTripId: null,
};

export const expensesFeature = createFeature({
  name: 'expenses',
  reducer: createReducer(
    initialState,

    // Load (trip list)
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

    // Load by id (expense detail page)
    on(ExpenseActions.loadExpenseById, (state) => ({
      ...state,
      selectedExpense: null,
      loadByIdStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ExpenseActions.loadExpenseByIdSuccess, (state, { expense }) => ({
      ...state,
      selectedExpense: expense,
      loadByIdStatus: 'success' as ApiStatus,
    })),
    on(ExpenseActions.loadExpenseByIdFailure, (state, { error }) => ({
      ...state,
      loadByIdStatus: 'failure' as ApiStatus,
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

    // Update
    on(ExpenseActions.updateExpense, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ExpenseActions.updateExpenseSuccess, (state, { expense }) => ({
      ...state,
      selectedExpense: expense,
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
      updateStatus: 'success' as ApiStatus,
    })),
    on(ExpenseActions.updateExpenseFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error,
    })),

    // Delete
    on(ExpenseActions.deleteExpense, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ExpenseActions.deleteExpenseSuccess, (state, { id }) => ({
      ...state,
      expenses: state.expenses.filter((e) => e.id !== id),
      selectedExpense: state.selectedExpense?.id === id ? null : state.selectedExpense,
      deleteStatus: 'success' as ApiStatus,
    })),
    on(ExpenseActions.deleteExpenseFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: expensesFeatureName,
  reducer: expensesReducer,
  selectExpensesState,
  selectExpenses,
  selectSelectedExpense,
  selectLoadStatus: selectExpensesLoadStatus,
  selectLoadByIdStatus: selectExpenseLoadByIdStatus,
  selectCreateStatus: selectExpensesCreateStatus,
  selectUpdateStatus: selectExpensesUpdateStatus,
  selectDeleteStatus: selectExpensesDeleteStatus,
  selectError: selectExpensesError,
  selectLastCreatedTripId,
} = expensesFeature;

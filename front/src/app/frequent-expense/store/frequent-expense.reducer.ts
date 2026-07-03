import { createFeature, createReducer, on } from '@ngrx/store';
import { FrequentExpense } from '../frequent-expense.model';
import { FrequentExpenseActions } from './frequent-expense.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface FrequentExpenseState {
  frequentExpenses: FrequentExpense[];
  loadStatus: ApiStatus;
  createStatus: ApiStatus;
  updateStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
}

const initialState: FrequentExpenseState = {
  frequentExpenses: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null
};

export const frequentExpenseFeature = createFeature({
  name: 'frequentExpense',
  reducer: createReducer(
    initialState,

    // Load handlers
    on(FrequentExpenseActions.loadFrequentExpenses, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.loadFrequentExpensesSuccess, (state, { frequentExpenses }) => ({
      ...state,
      frequentExpenses,
      loadStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.loadFrequentExpensesFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error
    })),

    // Create handlers
    on(FrequentExpenseActions.createFrequentExpense, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.createFrequentExpenseSuccess, (state, { frequentExpense }) => ({
      ...state,
      frequentExpenses: [frequentExpense, ...state.frequentExpenses],
      createStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.createFrequentExpenseFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error
    })),

    // Update handlers
    on(FrequentExpenseActions.updateFrequentExpense, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.updateFrequentExpenseSuccess, (state, { frequentExpense }) => ({
      ...state,
      frequentExpenses: state.frequentExpenses.map(e => e.id === frequentExpense.id ? frequentExpense : e),
      updateStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.updateFrequentExpenseFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error
    })),

    // Delete handlers
    on(FrequentExpenseActions.deleteFrequentExpense, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.deleteFrequentExpenseSuccess, (state, { id }) => ({
      ...state,
      frequentExpenses: state.frequentExpenses.filter(e => e.id !== id),
      deleteStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FrequentExpenseActions.deleteFrequentExpenseFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error
    }))
  )
});

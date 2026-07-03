import { createAction, props } from '@ngrx/store';
import { FrequentExpense, CreateFrequentExpenseRequest, UpdateFrequentExpenseRequest } from '../frequent-expense.model';

export const FrequentExpenseActions = {
  // Load actions
  loadFrequentExpenses: createAction(
    '[Frequent Expense] Load Frequent Expenses'
  ),
  loadFrequentExpensesSuccess: createAction(
    '[Frequent Expense] Load Frequent Expenses Success',
    props<{ frequentExpenses: FrequentExpense[] }>()
  ),
  loadFrequentExpensesFailure: createAction(
    '[Frequent Expense] Load Frequent Expenses Failure',
    props<{ error: string }>()
  ),

  // Create actions
  createFrequentExpense: createAction(
    '[Frequent Expense] Create Frequent Expense',
    props<{ request: CreateFrequentExpenseRequest }>()
  ),
  createFrequentExpenseSuccess: createAction(
    '[Frequent Expense] Create Frequent Expense Success',
    props<{ frequentExpense: FrequentExpense }>()
  ),
  createFrequentExpenseFailure: createAction(
    '[Frequent Expense] Create Frequent Expense Failure',
    props<{ error: string }>()
  ),

  // Update actions
  updateFrequentExpense: createAction(
    '[Frequent Expense] Update Frequent Expense',
    props<{ id: string; request: UpdateFrequentExpenseRequest }>()
  ),
  updateFrequentExpenseSuccess: createAction(
    '[Frequent Expense] Update Frequent Expense Success',
    props<{ frequentExpense: FrequentExpense }>()
  ),
  updateFrequentExpenseFailure: createAction(
    '[Frequent Expense] Update Frequent Expense Failure',
    props<{ error: string }>()
  ),

  // Delete actions
  deleteFrequentExpense: createAction(
    '[Frequent Expense] Delete Frequent Expense',
    props<{ id: string }>()
  ),
  deleteFrequentExpenseSuccess: createAction(
    '[Frequent Expense] Delete Frequent Expense Success',
    props<{ id: string }>()
  ),
  deleteFrequentExpenseFailure: createAction(
    '[Frequent Expense] Delete Frequent Expense Failure',
    props<{ error: string }>()
  )
};

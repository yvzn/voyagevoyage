import { createActionGroup, props } from '@ngrx/store';
import { Expense, CreateExpenseRequest } from '../expense.model';

export const ExpenseActions = createActionGroup({
  source: 'Expenses',
  events: {
    // Load expenses for a trip
    'Load Expenses': props<{ tripId: string }>(),
    'Load Expenses Success': props<{ expenses: Expense[] }>(),
    'Load Expenses Failure': props<{ error: string }>(),

    // Create expense for a known trip (trip-detail flow)
    'Create Expense': props<{ tripId: string; request: CreateExpenseRequest }>(),
    'Create Expense Success': props<{ expense: Expense }>(),
    'Create Expense Failure': props<{ error: string }>(),

    // Create expense from calendar: find or create a trip for the date first
    'Create Expense For Date': props<{ date: string; request: CreateExpenseRequest }>(),
    'Create Expense For Date Success': props<{ expense: Expense; tripId: string }>(),
    'Create Expense For Date Failure': props<{ error: string }>(),
  },
});

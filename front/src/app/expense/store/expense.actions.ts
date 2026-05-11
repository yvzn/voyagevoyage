import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../expense.model';

export const ExpenseActions = createActionGroup({
  source: 'Expenses',
  events: {
    // Load expenses for a trip
    'Load Expenses': props<{ tripId: string }>(),
    'Load Expenses Success': props<{ expenses: Expense[] }>(),
    'Load Expenses Failure': props<{ error: string }>(),

    // Load a single expense by id (expense detail page)
    'Load Expense By Id': props<{ id: string }>(),
    'Load Expense By Id Success': props<{ expense: Expense }>(),
    'Load Expense By Id Failure': props<{ error: string }>(),

    // Create expense for a known trip (trip-detail flow)
    'Create Expense': props<{ tripId: string; request: CreateExpenseRequest }>(),
    'Create Expense Success': props<{ expense: Expense }>(),
    'Create Expense Failure': props<{ error: string }>(),

    // Create expense from calendar: find or create a trip for the date first
    'Create Expense For Date': props<{ date: string; request: CreateExpenseRequest }>(),
    'Create Expense For Date Success': props<{ expense: Expense; tripId: string }>(),
    'Create Expense For Date Failure': props<{ error: string }>(),

    // Update expense (expense detail page)
    'Update Expense': props<{ id: string; request: UpdateExpenseRequest }>(),
    'Update Expense Success': props<{ expense: Expense }>(),
    'Update Expense Failure': props<{ error: string }>(),

    // Delete expense (expense detail page)
    'Delete Expense': props<{ id: string }>(),
    'Delete Expense Success': props<{ id: string }>(),
    'Delete Expense Failure': props<{ error: string }>(),
  },
});

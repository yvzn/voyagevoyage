import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Receipt } from '../receipt.model';

export const ReceiptActions = createActionGroup({
  source: 'Receipts',
  events: {
    // Load receipts for an expense
    'Load Receipts For Expense': props<{ expenseId: string }>(),
    'Load Receipts For Expense Success': props<{ expenseId: string; receipts: Receipt[] }>(),
    'Load Receipts For Expense Failure': props<{ error: string }>(),

    // Load receipts for a trip
    'Load Receipts For Trip': props<{ tripId: string }>(),
    'Load Receipts For Trip Success': props<{ tripId: string; receipts: Receipt[] }>(),
    'Load Receipts For Trip Failure': props<{ error: string }>(),

    // Upload a receipt for an expense
    'Upload Receipt For Expense': props<{ expenseId: string; file: File }>(),
    'Upload Receipt For Expense Success': props<{ expenseId: string; receipt: Receipt }>(),
    'Upload Receipt For Expense Failure': props<{ error: string }>(),

    // Upload a receipt for a trip
    'Upload Receipt For Trip': props<{ tripId: string; file: File }>(),
    'Upload Receipt For Trip Success': props<{ tripId: string; receipt: Receipt }>(),
    'Upload Receipt For Trip Failure': props<{ error: string }>(),

    // Delete a receipt
    'Delete Receipt': props<{ id: string; linkedEntityType: 'expense' | 'trip'; linkedEntityId: string }>(),
    'Delete Receipt Success': props<{ id: string; linkedEntityType: 'expense' | 'trip'; linkedEntityId: string }>(),
    'Delete Receipt Failure': props<{ error: string }>(),
  },
});

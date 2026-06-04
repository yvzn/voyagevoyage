import { createFeature, createReducer, on } from '@ngrx/store';
import { Receipt } from '../receipt.model';
import { ReceiptActions } from './receipt.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface ReceiptState {
  /** Receipts keyed by expense id. */
  receiptsByExpenseId: Record<string, Receipt[]>;
  loadByExpenseStatus: ApiStatus;
  uploadStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
}

const initialState: ReceiptState = {
  receiptsByExpenseId: {},
  loadByExpenseStatus: 'idle',
  uploadStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};

export const receiptsFeature = createFeature({
  name: 'receipts',
  reducer: createReducer(
    initialState,

    // Load for expense
    on(ReceiptActions.loadReceiptsForExpense, (state) => ({
      ...state,
      loadByExpenseStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ReceiptActions.loadReceiptsForExpenseSuccess, (state, { expenseId, receipts }) => ({
      ...state,
      receiptsByExpenseId: { ...state.receiptsByExpenseId, [expenseId]: receipts },
      loadByExpenseStatus: 'success' as ApiStatus,
    })),
    on(ReceiptActions.loadReceiptsForExpenseFailure, (state, { error }) => ({
      ...state,
      loadByExpenseStatus: 'failure' as ApiStatus,
      error,
    })),

    // Upload for expense
    on(ReceiptActions.uploadReceiptForExpense, (state) => ({
      ...state,
      uploadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ReceiptActions.uploadReceiptForExpenseSuccess, (state, { expenseId, receipt }) => {
      const existing = state.receiptsByExpenseId[expenseId] ?? [];
      return {
        ...state,
        receiptsByExpenseId: {
          ...state.receiptsByExpenseId,
          [expenseId]: [...existing, receipt],
        },
        uploadStatus: 'success' as ApiStatus,
      };
    }),
    on(ReceiptActions.uploadReceiptForExpenseFailure, (state, { error }) => ({
      ...state,
      uploadStatus: 'failure' as ApiStatus,
      error,
    })),

    // Delete
    on(ReceiptActions.deleteReceipt, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ReceiptActions.deleteReceiptSuccess, (state, { id, linkedEntityId }) => {
      const updated = (state.receiptsByExpenseId[linkedEntityId] ?? []).filter(
        (r) => r.id !== id,
      );
      return {
        ...state,
        receiptsByExpenseId: { ...state.receiptsByExpenseId, [linkedEntityId]: updated },
        deleteStatus: 'success' as ApiStatus,
      };
    }),
    on(ReceiptActions.deleteReceiptFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error,
    })),
  ),
});

export const {
  name: receiptsFeatureName,
  reducer: receiptsReducer,
  selectReceiptsState,
  selectReceiptsByExpenseId,
  selectLoadByExpenseStatus,
  selectUploadStatus,
  selectDeleteStatus,
  selectError: selectReceiptsError,
} = receiptsFeature;

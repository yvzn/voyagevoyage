import { createFeature, createReducer, on } from '@ngrx/store';
import { Receipt } from '../receipt.model';
import { ReceiptActions } from './receipt.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface ReceiptState {
  /** Receipts keyed by expense id. */
  receiptsByExpenseId: Record<string, Receipt[]>;
  /** Receipts keyed by trip id. */
  receiptsByTripId: Record<string, Receipt[]>;
  loadByExpenseStatus: ApiStatus;
  loadByTripStatus: ApiStatus;
  uploadStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
}

const initialState: ReceiptState = {
  receiptsByExpenseId: {},
  receiptsByTripId: {},
  loadByExpenseStatus: 'idle',
  loadByTripStatus: 'idle',
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

    // Load for trip
    on(ReceiptActions.loadReceiptsForTrip, (state) => ({
      ...state,
      loadByTripStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ReceiptActions.loadReceiptsForTripSuccess, (state, { tripId, receipts }) => ({
      ...state,
      receiptsByTripId: { ...state.receiptsByTripId, [tripId]: receipts },
      loadByTripStatus: 'success' as ApiStatus,
    })),
    on(ReceiptActions.loadReceiptsForTripFailure, (state, { error }) => ({
      ...state,
      loadByTripStatus: 'failure' as ApiStatus,
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

    // Upload for trip
    on(ReceiptActions.uploadReceiptForTrip, (state) => ({
      ...state,
      uploadStatus: 'loading' as ApiStatus,
      error: null,
    })),
    on(ReceiptActions.uploadReceiptForTripSuccess, (state, { tripId, receipt }) => {
      const existing = state.receiptsByTripId[tripId] ?? [];
      return {
        ...state,
        receiptsByTripId: {
          ...state.receiptsByTripId,
          [tripId]: [...existing, receipt],
        },
        uploadStatus: 'success' as ApiStatus,
      };
    }),
    on(ReceiptActions.uploadReceiptForTripFailure, (state, { error }) => ({
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
    on(ReceiptActions.deleteReceiptSuccess, (state, { id, linkedEntityType, linkedEntityId }) => {
      if (linkedEntityType === 'expense') {
        const updated = (state.receiptsByExpenseId[linkedEntityId] ?? []).filter(
          (r) => r.id !== id,
        );
        return {
          ...state,
          receiptsByExpenseId: { ...state.receiptsByExpenseId, [linkedEntityId]: updated },
          deleteStatus: 'success' as ApiStatus,
        };
      } else {
        const updated = (state.receiptsByTripId[linkedEntityId] ?? []).filter((r) => r.id !== id);
        return {
          ...state,
          receiptsByTripId: { ...state.receiptsByTripId, [linkedEntityId]: updated },
          deleteStatus: 'success' as ApiStatus,
        };
      }
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
  selectReceiptsByTripId,
  selectLoadByExpenseStatus,
  selectLoadByTripStatus,
  selectUploadStatus,
  selectDeleteStatus,
  selectError: selectReceiptsError,
} = receiptsFeature;

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ReceiptActions } from './receipt.actions';
import { ReceiptService } from '../receipt.service';

export const loadReceiptsForExpenseEffect = createEffect(
  (actions$ = inject(Actions), receiptService = inject(ReceiptService)) =>
    actions$.pipe(
      ofType(ReceiptActions.loadReceiptsForExpense),
      mergeMap(({ expenseId }) =>
        receiptService.getAllByExpense(expenseId).pipe(
          map((receipts) => ReceiptActions.loadReceiptsForExpenseSuccess({ expenseId, receipts })),
          catchError((error: unknown) =>
            of(ReceiptActions.loadReceiptsForExpenseFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const uploadReceiptForExpenseEffect = createEffect(
  (actions$ = inject(Actions), receiptService = inject(ReceiptService)) =>
    actions$.pipe(
      ofType(ReceiptActions.uploadReceiptForExpense),
      mergeMap(({ expenseId, file }) =>
        receiptService.uploadForExpense(expenseId, file).pipe(
          map((receipt) => ReceiptActions.uploadReceiptForExpenseSuccess({ expenseId, receipt })),
          catchError((error: unknown) =>
            of(ReceiptActions.uploadReceiptForExpenseFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteReceiptEffect = createEffect(
  (actions$ = inject(Actions), receiptService = inject(ReceiptService)) =>
    actions$.pipe(
      ofType(ReceiptActions.deleteReceipt),
      mergeMap(({ id, linkedEntityId }) =>
        receiptService.delete(id).pipe(
          map(() => ReceiptActions.deleteReceiptSuccess({ id, linkedEntityId })),
          catchError((error: unknown) =>
            of(ReceiptActions.deleteReceiptFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

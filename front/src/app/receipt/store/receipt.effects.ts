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

export const loadReceiptsForTripEffect = createEffect(
  (actions$ = inject(Actions), receiptService = inject(ReceiptService)) =>
    actions$.pipe(
      ofType(ReceiptActions.loadReceiptsForTrip),
      mergeMap(({ tripId }) =>
        receiptService.getAllByTrip(tripId).pipe(
          map((receipts) => ReceiptActions.loadReceiptsForTripSuccess({ tripId, receipts })),
          catchError((error: unknown) =>
            of(ReceiptActions.loadReceiptsForTripFailure({ error: String(error) })),
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

export const uploadReceiptForTripEffect = createEffect(
  (actions$ = inject(Actions), receiptService = inject(ReceiptService)) =>
    actions$.pipe(
      ofType(ReceiptActions.uploadReceiptForTrip),
      mergeMap(({ tripId, file }) =>
        receiptService.uploadForTrip(tripId, file).pipe(
          map((receipt) => ReceiptActions.uploadReceiptForTripSuccess({ tripId, receipt })),
          catchError((error: unknown) =>
            of(ReceiptActions.uploadReceiptForTripFailure({ error: String(error) })),
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
      mergeMap(({ id, linkedEntityType, linkedEntityId }) =>
        receiptService.delete(id).pipe(
          map(() => ReceiptActions.deleteReceiptSuccess({ id, linkedEntityType, linkedEntityId })),
          catchError((error: unknown) =>
            of(ReceiptActions.deleteReceiptFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

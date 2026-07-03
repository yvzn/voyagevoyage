import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FrequentExpenseService } from '../frequent-expense.service';
import { FrequentExpenseActions } from './frequent-expense.actions';

export const loadFrequentExpensesEffect = createEffect(
  (actions$ = inject(Actions), frequentExpenseService = inject(FrequentExpenseService)) =>
    actions$.pipe(
      ofType(FrequentExpenseActions.loadFrequentExpenses),
      switchMap(() =>
        frequentExpenseService.getFrequentExpenses().pipe(
          map(frequentExpenses =>
            FrequentExpenseActions.loadFrequentExpensesSuccess({ frequentExpenses })
          ),
          catchError(error =>
            of(FrequentExpenseActions.loadFrequentExpensesFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const createFrequentExpenseEffect = createEffect(
  (actions$ = inject(Actions), frequentExpenseService = inject(FrequentExpenseService)) =>
    actions$.pipe(
      ofType(FrequentExpenseActions.createFrequentExpense),
      switchMap(({ request }) =>
        frequentExpenseService.createFrequentExpense(request).pipe(
          map(frequentExpense =>
            FrequentExpenseActions.createFrequentExpenseSuccess({ frequentExpense })
          ),
          catchError(error =>
            of(FrequentExpenseActions.createFrequentExpenseFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const updateFrequentExpenseEffect = createEffect(
  (actions$ = inject(Actions), frequentExpenseService = inject(FrequentExpenseService)) =>
    actions$.pipe(
      ofType(FrequentExpenseActions.updateFrequentExpense),
      switchMap(({ id, request }) =>
        frequentExpenseService.updateFrequentExpense(id, request).pipe(
          map(frequentExpense =>
            FrequentExpenseActions.updateFrequentExpenseSuccess({ frequentExpense })
          ),
          catchError(error =>
            of(FrequentExpenseActions.updateFrequentExpenseFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const deleteFrequentExpenseEffect = createEffect(
  (actions$ = inject(Actions), frequentExpenseService = inject(FrequentExpenseService)) =>
    actions$.pipe(
      ofType(FrequentExpenseActions.deleteFrequentExpense),
      switchMap(({ id }) =>
        frequentExpenseService.deleteFrequentExpense(id).pipe(
          map(() =>
            FrequentExpenseActions.deleteFrequentExpenseSuccess({ id })
          ),
          catchError(error =>
            of(FrequentExpenseActions.deleteFrequentExpenseFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

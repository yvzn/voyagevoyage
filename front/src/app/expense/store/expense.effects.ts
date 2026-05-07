import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { ExpenseActions } from './expense.actions';
import { ExpenseService } from '../expense.service';
import { TripActions } from '../../trip/store/trip.actions';
import { TripService } from '../../trip/trip.service';
import { TripStatus } from '../../trip/trip.model';
import { selectAllTrips } from '../../trip/store/trip.selectors';

export const loadExpensesEffect = createEffect(
  (actions$ = inject(Actions), expenseService = inject(ExpenseService)) =>
    actions$.pipe(
      ofType(ExpenseActions.loadExpenses),
      mergeMap(({ tripId }) =>
        expenseService.getAll(tripId).pipe(
          map((expenses) => ExpenseActions.loadExpensesSuccess({ expenses })),
          catchError((error: unknown) =>
            of(ExpenseActions.loadExpensesFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadExpenseByIdEffect = createEffect(
  (actions$ = inject(Actions), expenseService = inject(ExpenseService)) =>
    actions$.pipe(
      ofType(ExpenseActions.loadExpenseById),
      mergeMap(({ id }) =>
        expenseService.getById(id).pipe(
          map((expense) => ExpenseActions.loadExpenseByIdSuccess({ expense })),
          catchError((error: unknown) =>
            of(ExpenseActions.loadExpenseByIdFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const createExpenseEffect = createEffect(
  (actions$ = inject(Actions), expenseService = inject(ExpenseService)) =>
    actions$.pipe(
      ofType(ExpenseActions.createExpense),
      mergeMap(({ tripId, request }) =>
        expenseService.create(tripId, request).pipe(
          map((expense) => ExpenseActions.createExpenseSuccess({ expense })),
          catchError((error: unknown) =>
            of(ExpenseActions.createExpenseFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

/**
 * Handles expense creation from the calendar view.
 * Looks up an existing trip that covers the given date; if none exists, creates a new
 * "Untitled" confirmed trip for that date before creating the expense.
 */
export const createExpenseForDateEffect = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    tripService = inject(TripService),
    expenseService = inject(ExpenseService),
  ) =>
    actions$.pipe(
      ofType(ExpenseActions.createExpenseForDate),
      withLatestFrom(store.select(selectAllTrips)),
      switchMap(([{ date, request }, trips]) => {
        const existingTrip = trips.find(
          (t) => t.startDate <= date && date <= t.endDate,
        );

        if (existingTrip) {
          return expenseService.create(existingTrip.id, request).pipe(
            map((expense) =>
              ExpenseActions.createExpenseForDateSuccess({
                expense,
                tripId: existingTrip.id,
              }),
            ),
            catchError((error: unknown) =>
              of(ExpenseActions.createExpenseForDateFailure({ error: String(error) })),
            ),
          );
        }

        // No trip found for this date: create a new "Untitled" confirmed trip first
        return tripService
          .create({
            destination: 'Untitled',
            startDate: date,
            endDate: date,
            status: TripStatus.Confirmed,
          })
          .pipe(
            switchMap((trip) =>
              expenseService.create(trip.id, request).pipe(
                mergeMap((expense) =>
                  of(
                    // Update the trips state so the new trip is available in the store
                    TripActions.createTripSuccess({ trip }),
                    ExpenseActions.createExpenseForDateSuccess({
                      expense,
                      tripId: trip.id,
                    }),
                  ),
                ),
                catchError((error: unknown) =>
                  of(ExpenseActions.createExpenseForDateFailure({ error: String(error) })),
                ),
              ),
            ),
            catchError((error: unknown) =>
              of(ExpenseActions.createExpenseForDateFailure({ error: String(error) })),
            ),
          );
      }),
    ),
  { functional: true },
);

export const updateExpenseEffect = createEffect(
  (actions$ = inject(Actions), expenseService = inject(ExpenseService)) =>
    actions$.pipe(
      ofType(ExpenseActions.updateExpense),
      mergeMap(({ id, request }) =>
        expenseService.update(id, request).pipe(
          map((expense) => ExpenseActions.updateExpenseSuccess({ expense })),
          catchError((error: unknown) =>
            of(ExpenseActions.updateExpenseFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteExpenseEffect = createEffect(
  (actions$ = inject(Actions), expenseService = inject(ExpenseService)) =>
    actions$.pipe(
      ofType(ExpenseActions.deleteExpense),
      mergeMap(({ id }) =>
        expenseService.deleteById(id).pipe(
          map(() => ExpenseActions.deleteExpenseSuccess({ id })),
          catchError((error: unknown) =>
            of(ExpenseActions.deleteExpenseFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

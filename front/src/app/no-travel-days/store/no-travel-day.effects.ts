import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { NoTravelDayService } from '../no-travel-day.service';
import { NoTravelDayActions } from './no-travel-day.actions';

export const loadNoTravelDaysEffect = createEffect(
  (actions$ = inject(Actions), service = inject(NoTravelDayService)) =>
    actions$.pipe(
      ofType(NoTravelDayActions.loadNoTravelDays),
      mergeMap(() => service.getAll().pipe(
        map((days) => NoTravelDayActions.loadNoTravelDaysSuccess({ days })),
        catchError((error: unknown) => of(NoTravelDayActions.loadNoTravelDaysFailure({ error: String(error) }))),
      )),
    ),
  { functional: true },
);

export const createNoTravelDayEffect = createEffect(
  (actions$ = inject(Actions), service = inject(NoTravelDayService)) =>
    actions$.pipe(
      ofType(NoTravelDayActions.createNoTravelDay),
      mergeMap(({ request }) => service.create(request).pipe(
        map((day) => NoTravelDayActions.createNoTravelDaySuccess({ day })),
        catchError((error: unknown) => of(NoTravelDayActions.createNoTravelDayFailure({ error: String(error) }))),
      )),
    ),
  { functional: true },
);

export const updateNoTravelDayEffect = createEffect(
  (actions$ = inject(Actions), service = inject(NoTravelDayService)) =>
    actions$.pipe(
      ofType(NoTravelDayActions.updateNoTravelDay),
      mergeMap(({ id, request }) => service.update(id, request).pipe(
        map((day) => NoTravelDayActions.updateNoTravelDaySuccess({ day })),
        catchError((error: unknown) => of(NoTravelDayActions.updateNoTravelDayFailure({ error: String(error) }))),
      )),
    ),
  { functional: true },
);

export const deleteNoTravelDayEffect = createEffect(
  (actions$ = inject(Actions), service = inject(NoTravelDayService)) =>
    actions$.pipe(
      ofType(NoTravelDayActions.deleteNoTravelDay),
      mergeMap(({ id }) => service.deleteById(id).pipe(
        map(() => NoTravelDayActions.deleteNoTravelDaySuccess({ id })),
        catchError((error: unknown) => of(NoTravelDayActions.deleteNoTravelDayFailure({ error: String(error) }))),
      )),
    ),
  { functional: true },
);

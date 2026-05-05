import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { SettingsActions } from './settings.actions';
import { ConstraintsService } from '../constraints.service';

export const loadSettingsEffect = createEffect(
  (actions$ = inject(Actions), constraintsService = inject(ConstraintsService)) =>
    actions$.pipe(
      ofType(SettingsActions.loadSettings),
      mergeMap(() =>
        constraintsService.get().pipe(
          map((constraints) =>
            constraints === null
              ? SettingsActions.loadSettingsEmpty()
              : SettingsActions.loadSettingsSuccess({ constraints }),
          ),
          catchError((error: unknown) =>
            of(SettingsActions.loadSettingsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const updateSettingsEffect = createEffect(
  (actions$ = inject(Actions), constraintsService = inject(ConstraintsService)) =>
    actions$.pipe(
      ofType(SettingsActions.updateSettings),
      mergeMap(({ request }) =>
        constraintsService.update(request).pipe(
          map((constraints) => SettingsActions.updateSettingsSuccess({ constraints })),
          catchError((error: unknown) =>
            of(SettingsActions.updateSettingsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

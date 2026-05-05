import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { TravelConstraints } from '../constraints.model';
import { SettingsActions } from './settings.actions';

export const loadSettingsEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(SettingsActions.loadSettings),
      mergeMap(() =>
        http.get<TravelConstraints | null>('/api/travel-constraints').pipe(
          map((constraints) =>
            constraints === null
              ? SettingsActions.loadSettingsEmpty()
              : SettingsActions.loadSettingsSuccess({ constraints }),
          ),
          catchError((error: unknown) => {
            // 204 No Content may arrive as a JSON parse error with status 204
            const status = (error as { status?: number })?.status;
            if (status === 204) {
              return of(SettingsActions.loadSettingsEmpty());
            }
            return of(SettingsActions.loadSettingsFailure({ error: String(error) }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const updateSettingsEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(SettingsActions.updateSettings),
      mergeMap(({ request }) =>
        http.put<TravelConstraints>('/api/travel-constraints', request).pipe(
          map((constraints) => SettingsActions.updateSettingsSuccess({ constraints })),
          catchError((error: unknown) =>
            of(SettingsActions.updateSettingsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

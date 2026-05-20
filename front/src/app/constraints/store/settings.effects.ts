import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { SettingsActions } from './settings.actions';
import { ConstraintsService } from '../constraints.service';
import { PublicHolidayService } from '../public-holiday.service';
import { SchoolHolidayService } from '../school-holiday.service';
import { PersonalLeaveService } from '../personal-leave.service';

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

export const importIcsEffect = createEffect(
  (actions$ = inject(Actions), publicHolidayService = inject(PublicHolidayService)) =>
    actions$.pipe(
      ofType(SettingsActions.importIcs),
      mergeMap(({ file }) =>
        publicHolidayService.importIcs(file).pipe(
          map(() => SettingsActions.importIcsSuccess()),
          catchError((error: unknown) =>
            of(SettingsActions.importIcsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const importSchoolIcsEffect = createEffect(
  (actions$ = inject(Actions), schoolHolidayService = inject(SchoolHolidayService)) =>
    actions$.pipe(
      ofType(SettingsActions.importSchoolIcs),
      mergeMap(({ file }) =>
        schoolHolidayService.importIcs(file).pipe(
          map(() => SettingsActions.importSchoolIcsSuccess()),
          catchError((error: unknown) =>
            of(SettingsActions.importSchoolIcsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const importPersonalLeaveIcsEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(SettingsActions.importPersonalLeaveIcs),
      mergeMap(({ file }) =>
        personalLeaveService.importIcs(file).pipe(
          map(() => SettingsActions.importPersonalLeaveIcsSuccess()),
          catchError((error: unknown) =>
            of(SettingsActions.importPersonalLeaveIcsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

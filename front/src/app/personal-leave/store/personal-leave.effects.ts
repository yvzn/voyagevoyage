import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { PersonalLeaveActions } from './personal-leave.actions';
import { PersonalLeaveService } from '../personal-leave.service';

export const loadPersonalLeavesEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(PersonalLeaveActions.loadPersonalLeaves),
      mergeMap(() =>
        personalLeaveService.getAll().pipe(
          map((leaves) => PersonalLeaveActions.loadPersonalLeavesSuccess({ leaves })),
          catchError((error: unknown) =>
            of(PersonalLeaveActions.loadPersonalLeavesFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const createPersonalLeaveEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(PersonalLeaveActions.createPersonalLeave),
      mergeMap(({ request }) =>
        personalLeaveService.create(request).pipe(
          map((leave) => PersonalLeaveActions.createPersonalLeaveSuccess({ leave })),
          catchError((error: unknown) =>
            of(PersonalLeaveActions.createPersonalLeaveFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const updatePersonalLeaveEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(PersonalLeaveActions.updatePersonalLeave),
      mergeMap(({ id, request }) =>
        personalLeaveService.update(id, request).pipe(
          map((leave) => PersonalLeaveActions.updatePersonalLeaveSuccess({ leave })),
          catchError((error: unknown) =>
            of(PersonalLeaveActions.updatePersonalLeaveFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deletePersonalLeaveEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(PersonalLeaveActions.deletePersonalLeave),
      mergeMap(({ id }) =>
        personalLeaveService.deleteById(id).pipe(
          map(() => PersonalLeaveActions.deletePersonalLeaveSuccess({ id })),
          catchError((error: unknown) =>
            of(PersonalLeaveActions.deletePersonalLeaveFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const importPersonalLeaveIcsEffect = createEffect(
  (actions$ = inject(Actions), personalLeaveService = inject(PersonalLeaveService)) =>
    actions$.pipe(
      ofType(PersonalLeaveActions.importPersonalLeaveIcs),
      switchMap(({ file }) =>
        personalLeaveService.importIcs(file).pipe(
          switchMap(() =>
            personalLeaveService.getAll().pipe(
              map((leaves) => PersonalLeaveActions.importPersonalLeaveIcsSuccess({ leaves })),
              catchError((error: unknown) =>
                of(PersonalLeaveActions.importPersonalLeaveIcsFailure({ error: String(error) })),
              ),
            ),
          ),
          catchError((error: unknown) =>
            of(PersonalLeaveActions.importPersonalLeaveIcsFailure({ error: String(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

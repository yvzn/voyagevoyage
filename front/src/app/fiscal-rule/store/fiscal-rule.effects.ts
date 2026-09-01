import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FiscalRuleService } from '../fiscal-rule.service';
import { FiscalRuleActions } from './fiscal-rule.actions';

export const loadFiscalRulesEffect = createEffect(
  (actions$ = inject(Actions), fiscalRuleService = inject(FiscalRuleService)) =>
    actions$.pipe(
      ofType(FiscalRuleActions.loadFiscalRules),
      switchMap(() =>
        fiscalRuleService.getFiscalRules().pipe(
          map(fiscalRules =>
            FiscalRuleActions.loadFiscalRulesSuccess({ fiscalRules })
          ),
          catchError(error =>
            of(FiscalRuleActions.loadFiscalRulesFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const createFiscalRuleEffect = createEffect(
  (actions$ = inject(Actions), fiscalRuleService = inject(FiscalRuleService)) =>
    actions$.pipe(
      ofType(FiscalRuleActions.createFiscalRule),
      switchMap(({ request }) =>
        fiscalRuleService.createFiscalRule(request).pipe(
          map(fiscalRule =>
            FiscalRuleActions.createFiscalRuleSuccess({ fiscalRule })
          ),
          catchError(error =>
            of(FiscalRuleActions.createFiscalRuleFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const updateFiscalRuleEffect = createEffect(
  (actions$ = inject(Actions), fiscalRuleService = inject(FiscalRuleService)) =>
    actions$.pipe(
      ofType(FiscalRuleActions.updateFiscalRule),
      switchMap(({ id, request }) =>
        fiscalRuleService.updateFiscalRule(id, request).pipe(
          map(fiscalRule =>
            FiscalRuleActions.updateFiscalRuleSuccess({ fiscalRule })
          ),
          catchError(error =>
            of(FiscalRuleActions.updateFiscalRuleFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

export const deleteFiscalRuleEffect = createEffect(
  (actions$ = inject(Actions), fiscalRuleService = inject(FiscalRuleService)) =>
    actions$.pipe(
      ofType(FiscalRuleActions.deleteFiscalRule),
      switchMap(({ id }) =>
        fiscalRuleService.deleteFiscalRule(id).pipe(
          map(() =>
            FiscalRuleActions.deleteFiscalRuleSuccess({ id })
          ),
          catchError(error =>
            of(FiscalRuleActions.deleteFiscalRuleFailure({ error: error.message }))
          )
        )
      )
    ),
  { functional: true }
);

import { createAction, props } from '@ngrx/store';
import { FiscalRule, CreateFiscalRuleRequest, UpdateFiscalRuleRequest } from '../fiscal-rule.model';

export const FiscalRuleActions = {
  // Load actions
  loadFiscalRules: createAction(
    '[Fiscal Rule] Load Fiscal Rules'
  ),
  loadFiscalRulesSuccess: createAction(
    '[Fiscal Rule] Load Fiscal Rules Success',
    props<{ fiscalRules: FiscalRule[] }>()
  ),
  loadFiscalRulesFailure: createAction(
    '[Fiscal Rule] Load Fiscal Rules Failure',
    props<{ error: string }>()
  ),

  // Create actions
  createFiscalRule: createAction(
    '[Fiscal Rule] Create Fiscal Rule',
    props<{ request: CreateFiscalRuleRequest }>()
  ),
  createFiscalRuleSuccess: createAction(
    '[Fiscal Rule] Create Fiscal Rule Success',
    props<{ fiscalRule: FiscalRule }>()
  ),
  createFiscalRuleFailure: createAction(
    '[Fiscal Rule] Create Fiscal Rule Failure',
    props<{ error: string }>()
  ),

  // Update actions
  updateFiscalRule: createAction(
    '[Fiscal Rule] Update Fiscal Rule',
    props<{ id: string; request: UpdateFiscalRuleRequest }>()
  ),
  updateFiscalRuleSuccess: createAction(
    '[Fiscal Rule] Update Fiscal Rule Success',
    props<{ fiscalRule: FiscalRule }>()
  ),
  updateFiscalRuleFailure: createAction(
    '[Fiscal Rule] Update Fiscal Rule Failure',
    props<{ error: string }>()
  ),

  // Delete actions
  deleteFiscalRule: createAction(
    '[Fiscal Rule] Delete Fiscal Rule',
    props<{ id: string }>()
  ),
  deleteFiscalRuleSuccess: createAction(
    '[Fiscal Rule] Delete Fiscal Rule Success',
    props<{ id: string }>()
  ),
  deleteFiscalRuleFailure: createAction(
    '[Fiscal Rule] Delete Fiscal Rule Failure',
    props<{ error: string }>()
  )
};

import { createFeature, createReducer, on } from '@ngrx/store';
import { FiscalRule } from '../fiscal-rule.model';
import { FiscalRuleActions } from './fiscal-rule.actions';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'failure';

export interface FiscalRuleState {
  fiscalRules: FiscalRule[];
  loadStatus: ApiStatus;
  createStatus: ApiStatus;
  updateStatus: ApiStatus;
  deleteStatus: ApiStatus;
  error: string | null;
}

const initialState: FiscalRuleState = {
  fiscalRules: [],
  loadStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null
};

export const fiscalRuleFeature = createFeature({
  name: 'fiscalRule',
  reducer: createReducer(
    initialState,

    // Load handlers
    on(FiscalRuleActions.loadFiscalRules, (state) => ({
      ...state,
      loadStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.loadFiscalRulesSuccess, (state, { fiscalRules }) => ({
      ...state,
      fiscalRules,
      loadStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.loadFiscalRulesFailure, (state, { error }) => ({
      ...state,
      loadStatus: 'failure' as ApiStatus,
      error
    })),

    // Create handlers
    on(FiscalRuleActions.createFiscalRule, (state) => ({
      ...state,
      createStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.createFiscalRuleSuccess, (state, { fiscalRule }) => ({
      ...state,
      fiscalRules: [fiscalRule, ...state.fiscalRules],
      createStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.createFiscalRuleFailure, (state, { error }) => ({
      ...state,
      createStatus: 'failure' as ApiStatus,
      error
    })),

    // Update handlers
    on(FiscalRuleActions.updateFiscalRule, (state) => ({
      ...state,
      updateStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.updateFiscalRuleSuccess, (state, { fiscalRule }) => ({
      ...state,
      fiscalRules: state.fiscalRules.map(r => r.id === fiscalRule.id ? fiscalRule : r),
      updateStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.updateFiscalRuleFailure, (state, { error }) => ({
      ...state,
      updateStatus: 'failure' as ApiStatus,
      error
    })),

    // Delete handlers
    on(FiscalRuleActions.deleteFiscalRule, (state) => ({
      ...state,
      deleteStatus: 'loading' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.deleteFiscalRuleSuccess, (state, { id }) => ({
      ...state,
      fiscalRules: state.fiscalRules.filter(r => r.id !== id),
      deleteStatus: 'success' as ApiStatus,
      error: null
    })),
    on(FiscalRuleActions.deleteFiscalRuleFailure, (state, { error }) => ({
      ...state,
      deleteStatus: 'failure' as ApiStatus,
      error
    }))
  )
});

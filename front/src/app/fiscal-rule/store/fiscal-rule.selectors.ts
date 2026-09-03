import { fiscalRuleFeature } from './fiscal-rule.reducer';

export const {
  selectFiscalRules: selectAllFiscalRules,
  selectLoadStatus,
  selectCreateStatus,
  selectUpdateStatus,
  selectDeleteStatus,
  selectError
} = fiscalRuleFeature;

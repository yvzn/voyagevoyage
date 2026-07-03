import { frequentExpenseFeature } from './frequent-expense.reducer';

export const {
  selectFrequentExpenses: selectAllFrequentExpenses,
  selectLoadStatus,
  selectCreateStatus,
  selectUpdateStatus,
  selectDeleteStatus,
  selectError
} = frequentExpenseFeature;

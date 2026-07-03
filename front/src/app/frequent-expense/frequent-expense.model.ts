import { ExpenseCategory } from '../expense/expense.model';

export interface FrequentExpense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface CreateFrequentExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface UpdateFrequentExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface FrequentExpenseWithDateOverride extends FrequentExpense {
  dateOverride: string; // ISO 8601 date: YYYY-MM-DD
}

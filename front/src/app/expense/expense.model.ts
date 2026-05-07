export enum ExpenseCategory {
  Train = 'train',
  Hotel = 'hotel',
  Meal = 'meal',
  MetroBus = 'metroBus',
  Other = 'other',
}

export interface Expense {
  id: string;
  tripId: string;
  date: string; // ISO 8601 date: YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface CreateExpenseRequest {
  date: string; // ISO 8601 date: YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description: string;
}

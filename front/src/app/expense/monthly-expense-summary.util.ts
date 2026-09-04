import { Expense, ExpenseCategory } from './expense.model';
import { FiscalRule } from '../fiscal-rule/fiscal-rule.model';

export const MONTHLY_SUMMARY_CATEGORIES = [
  ExpenseCategory.Meal,
  ExpenseCategory.RemoteWork,
  ExpenseCategory.Train,
  ExpenseCategory.MetroBus,
  ExpenseCategory.Hotel,
] as const;

export type MonthlySummaryCategory = (typeof MONTHLY_SUMMARY_CATEGORIES)[number];

export interface MonthlySummaryCell {
  category: MonthlySummaryCategory;
  gross: number;
  abatement: number;
  net: number;
  sourceExpenses: Expense[];
}

export interface MonthlySummaryDay {
  date: string;
  day: number;
  cells: Partial<Record<MonthlySummaryCategory, MonthlySummaryCell>>;
  dayTotal: number;
}

export interface MonthlyExpenseSummary {
  year: number;
  month: number;
  days: MonthlySummaryDay[];
  categoryTotals: Record<MonthlySummaryCategory, number>;
  grandTotal: number;
}

export function getApplicableFiscalRule(
  expenseDate: string,
  fiscalRules: FiscalRule[] = [],
): FiscalRule | undefined {
  return fiscalRules
    .filter((rule) => {
      const start = rule.startDate;
      const end = rule.endDate;
      const date = new Date(`${expenseDate}T00:00:00`);
      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T00:00:00`);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => new Date(`${b.startDate}T00:00:00`).getTime() - new Date(`${a.startDate}T00:00:00`).getTime())[0];
}

function getExpenseNetAmount(expense: Expense, fiscalRule?: FiscalRule): number {
  if (expense.category === ExpenseCategory.Meal && fiscalRule) {
    const subsidy = (fiscalRule.mealVoucherFaceValue * fiscalRule.mealVoucherEmployerContributionPercentage) / 100;
    return Math.max(0, expense.amount - fiscalRule.mealAllowance - subsidy);
  }

  if (expense.category === ExpenseCategory.RemoteWork && fiscalRule) {
    return Math.max(0, expense.amount);
  }

  return expense.amount;
}

function calculateTotals(
  expenses: Expense[],
  fiscalRule?: FiscalRule,
): { gross: number; abatement: number; net: number; sourceExpenses: Expense[] } {
  const gross = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  if (expenses.length === 0) {
    return { gross: 0, abatement: 0, net: 0, sourceExpenses: [] };
  }

  const net = expenses.reduce((sum, expense) => {
    const value = getExpenseNetAmount(expense, fiscalRule);
    return sum + value;
  }, 0);

  const abatement = gross - net;
  return { gross, abatement, net, sourceExpenses: expenses };
}

export function buildMonthlyExpenseSummary(
  expenses: Expense[],
  year: number,
  monthIndex: number,
  fiscalRules: FiscalRule[] = [],
): MonthlyExpenseSummary {
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const categoryTotals: Record<MonthlySummaryCategory, number> = {
    [ExpenseCategory.Meal]: 0,
    [ExpenseCategory.RemoteWork]: 0,
    [ExpenseCategory.Train]: 0,
    [ExpenseCategory.MetroBus]: 0,
    [ExpenseCategory.Hotel]: 0,
  };

  const days: MonthlySummaryDay[] = [];

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExpenses = expenses.filter((expense) => expense.date === isoDate);
    const cells: Partial<Record<MonthlySummaryCategory, MonthlySummaryCell>> = {};
    let dayTotal = 0;

    for (const category of MONTHLY_SUMMARY_CATEGORIES) {
      const categoryExpenses = dayExpenses.filter((expense) => expense.category === category);
      if (categoryExpenses.length === 0) {
        continue;
      }

      const fiscalRule = getApplicableFiscalRule(isoDate, fiscalRules);
      const { gross, abatement, net, sourceExpenses } = calculateTotals(categoryExpenses, fiscalRule);
      cells[category] = { category, gross, abatement, net, sourceExpenses };
      categoryTotals[category] += net;
      dayTotal += net;
    }

    days.push({
      date: isoDate,
      day,
      cells,
      dayTotal,
    });
  }

  const grandTotal = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

  return { year, month: monthIndex, days, categoryTotals, grandTotal };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

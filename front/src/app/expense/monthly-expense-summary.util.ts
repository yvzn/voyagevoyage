import { Expense, ExpenseCategory } from './expense.model';
import { FiscalRule } from '../fiscal-rule/fiscal-rule.model';
import { Trip } from '../trip/trip.model';

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

function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTripDaySet(trips: Trip[] = []): Set<string> {
  const tripDays = new Set<string>();

  for (const trip of trips) {
    const startDate = new Date(`${trip.startDate}T00:00:00`);
    const endDate = new Date(`${trip.endDate}T00:00:00`);
    const current = new Date(startDate);

    while (current <= endDate) {
      tripDays.add(dateToIso(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return tripDays;
}

function getRemoteWorkAllowanceCell(
  isoDate: string,
  fiscalRule?: FiscalRule,
  tripDays: Set<string> = new Set(),
): MonthlySummaryCell | undefined {
  if (!fiscalRule || fiscalRule.remoteWorkAllowance <= 0) {
    return undefined;
  }

  const date = new Date(`${isoDate}T00:00:00`);
  const isWorkingDay = date.getDay() >= 1 && date.getDay() <= 5;
  if (!isWorkingDay || tripDays.has(isoDate)) {
    return undefined;
  }

  return {
    category: ExpenseCategory.RemoteWork,
    gross: fiscalRule.remoteWorkAllowance,
    abatement: 0,
    net: fiscalRule.remoteWorkAllowance,
    sourceExpenses: [],
  };
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
  trips: Trip[] = [],
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
  const tripDays = getTripDaySet(trips);

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const isoDate = dateToIso(date);
    const dayExpenses = expenses.filter((expense) => expense.date === isoDate);
    const cells: Partial<Record<MonthlySummaryCategory, MonthlySummaryCell>> = {};
    let dayTotal = 0;

    for (const category of MONTHLY_SUMMARY_CATEGORIES) {
      const categoryExpenses = dayExpenses.filter((expense) => expense.category === category);

      if (category === ExpenseCategory.RemoteWork && categoryExpenses.length === 0) {
        const fiscalRule = getApplicableFiscalRule(isoDate, fiscalRules);
        const remoteWorkCell = getRemoteWorkAllowanceCell(isoDate, fiscalRule, tripDays);
        if (remoteWorkCell) {
          cells[category] = remoteWorkCell;
          categoryTotals[category] += remoteWorkCell.net;
          dayTotal += remoteWorkCell.net;
        }
        continue;
      }

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

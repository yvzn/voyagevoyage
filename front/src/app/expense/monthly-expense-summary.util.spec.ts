import { describe, expect, it } from 'vitest';
import { Expense, ExpenseCategory } from './expense.model';
import { FiscalRule } from '../fiscal-rule/fiscal-rule.model';
import { Trip, TripStatus } from '../trip/trip.model';
import { buildMonthlyExpenseSummary } from './monthly-expense-summary.util';

function makeExpense(
  date: string,
  category: ExpenseCategory,
  amount: number,
  tripId = 'trip-1',
  description = 'Expense',
): Expense {
  return {
    id: `${date}-${category}-${amount}`,
    tripId,
    date,
    category,
    amount,
    description,
  };
}

describe('buildMonthlyExpenseSummary', () => {
  const rule: FiscalRule = {
    id: 'rule-1',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    mealAllowance: 20,
    mealVoucherFaceValue: 10,
    mealVoucherEmployerContributionPercentage: 60,
    remoteWorkAllowance: 12,
  };

  it('aggregates same-day same-category expenses and keeps every day of the month in the grid', () => {
    const expenses = [
      makeExpense('2026-02-03', ExpenseCategory.Meal, 30),
      makeExpense('2026-02-03', ExpenseCategory.Meal, 50),
      makeExpense('2026-02-03', ExpenseCategory.Train, 42),
      makeExpense('2026-02-10', ExpenseCategory.Hotel, 120),
    ];

    const summary = buildMonthlyExpenseSummary(expenses, 2026, 1, [rule]);

    expect(summary.days.length).toBe(28);
    expect(summary.days[2].cells[ExpenseCategory.Meal]).toBeDefined();
    expect(summary.days[2].cells[ExpenseCategory.Meal]?.gross).toBe(80);
    expect(summary.days[2].cells[ExpenseCategory.Meal]?.net).toBe(28);
    expect(summary.days[2].cells[ExpenseCategory.Train]?.gross).toBe(42);
    expect(summary.days[9].cells[ExpenseCategory.Hotel]?.gross).toBe(120);
    expect(summary.categoryTotals[ExpenseCategory.Meal]).toBe(28);
    expect(summary.categoryTotals[ExpenseCategory.Train]).toBe(42);
    expect(summary.categoryTotals[ExpenseCategory.Hotel]).toBe(120);
  });

  it('uses the fiscal rule for meal expenses and leaves empty cells blank when no amount exists', () => {
    const expenses = [
      makeExpense('2026-02-05', ExpenseCategory.Meal, 100),
      makeExpense('2026-02-07', ExpenseCategory.MetroBus, 12),
    ];

    const summary = buildMonthlyExpenseSummary(expenses, 2026, 1, [rule]);

    expect(summary.days[4].cells[ExpenseCategory.Meal]?.gross).toBe(100);
    expect(summary.days[4].cells[ExpenseCategory.Meal]?.abatement).toBe(26);
    expect(summary.days[4].cells[ExpenseCategory.Meal]?.net).toBe(74);
    expect(summary.days[6].cells[ExpenseCategory.MetroBus]?.gross).toBe(12);
    expect(summary.days[4].cells[ExpenseCategory.Train]).toBeUndefined();
    expect(summary.days[6].cells[ExpenseCategory.Meal]).toBeUndefined();
  });

  it('adds the remote work allowance for eligible workdays outside trips', () => {
    const trip: Trip = {
      id: 'trip-remote-work',
      startDate: '2026-02-03',
      endDate: '2026-02-03',
      destination: 'Paris',
      status: TripStatus.Planned,
    };

    const summary = buildMonthlyExpenseSummary([], 2026, 1, [rule], [trip]);

    expect(summary.days[1].cells[ExpenseCategory.RemoteWork]?.net).toBe(12);
    expect(summary.days[2].cells[ExpenseCategory.RemoteWork]).toBeUndefined();
    expect(summary.categoryTotals[ExpenseCategory.RemoteWork]).toBe(228);
  });

  it('sums the grand total across all categories', () => {
    const expenses = [
      makeExpense('2026-02-01', ExpenseCategory.Meal, 50),
      makeExpense('2026-02-01', ExpenseCategory.Train, 20),
      makeExpense('2026-02-02', ExpenseCategory.Hotel, 90),
    ];

    const summary = buildMonthlyExpenseSummary(expenses, 2026, 1, [rule]);

    expect(summary.grandTotal).toBe(50 - 20 - 6 + 20 + 90 + 12 * 20);
  });
});

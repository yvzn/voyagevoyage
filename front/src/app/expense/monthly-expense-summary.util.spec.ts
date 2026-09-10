import { TranslateService } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';
import { Expense, ExpenseCategory } from './expense.model';
import { FiscalRule } from '../fiscal-rule/fiscal-rule.model';
import { Trip, TripStatus } from '../trip/trip.model';
import {
  ANNUAL_SUMMARY_CATEGORIES,
  buildAnnualExpenseExportCsv,
  buildAnnualExpenseSummary,
  buildMonthlyExpenseExportCsv,
  buildMonthlyExpenseSummary,
  serializeCsvForExcel,
  utf16leEncode,
} from './monthly-expense-summary.util';

const fakeTranslateService = {
  instant: (key: string) => ({
    'exportCsv.report': 'Report',
    'exportCsv.monthlyReport': 'Monthly expense summary',
    'exportCsv.annualReport': 'Annual expense summary',
    'exportCsv.period': 'Period',
    'exportCsv.year': 'Year',
    'exportCsv.month': 'Month',
    'exportCsv.grandTotal': 'Grand total',
    'exportCsv.date': 'Date',
    'exportCsv.trip': 'Trip',
    'exportCsv.category': 'Category',
    'exportCsv.description': 'Description',
    'exportCsv.gross': 'Gross',
    'exportCsv.reduction': 'Reduction',
    'exportCsv.net': 'Net',
    'exportCsv.total': 'Total',
    'exportCsv.fiscalRuleScope': 'Fiscal rule scope',
    'exportCsv.startDate': 'Start date',
    'exportCsv.endDate': 'End date',
    'exportCsv.mealAllowance': 'Meal allowance',
    'exportCsv.mealVoucherFaceValue': 'Meal voucher face value',
    'exportCsv.employerContribution': 'Employer contribution %',
    'exportCsv.remoteWorkAllowance': 'Remote work allowance',
  })[key] ?? key,
} as Pick<TranslateService, 'instant'>;

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

  it('builds an annual summary with 12 months and aggregated travel totals', () => {
    const annualRule: FiscalRule = {
      ...rule,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    const expenses = [
      makeExpense('2026-01-04', ExpenseCategory.Meal, 60),
      makeExpense('2026-01-07', ExpenseCategory.Train, 30),
      makeExpense('2026-01-11', ExpenseCategory.MetroBus, 15),
      makeExpense('2026-02-05', ExpenseCategory.Meal, 100),
      makeExpense('2026-02-12', ExpenseCategory.Hotel, 180),
      makeExpense('2026-06-15', ExpenseCategory.RemoteWork, 50),
    ];

    const summary = buildAnnualExpenseSummary(expenses, 2026, [annualRule]);
    const juneMonthlySummary = buildMonthlyExpenseSummary(expenses, 2026, 5, [annualRule]);

    expect(summary.months).toHaveLength(12);
    expect(summary.months[0].cells[ExpenseCategory.Meal]).toBe(60 - 20 - 6);
    expect(summary.months[0].cells.travel).toBe(45);
    expect(summary.months[0].cells[ExpenseCategory.Hotel]).toBeUndefined();
    expect(summary.months[1].cells[ExpenseCategory.Meal]).toBe(100 - 20 - 6);
    expect(summary.months[1].cells[ExpenseCategory.Hotel]).toBe(180);
    expect(summary.months[5].cells[ExpenseCategory.RemoteWork]).toBe(
      juneMonthlySummary.categoryTotals[ExpenseCategory.RemoteWork],
    );
    expect(summary.categoryTotals[ExpenseCategory.Meal]).toBe((60 - 20 - 6) + (100 - 20 - 6));
    expect(summary.categoryTotals.travel).toBe(45);
    expect(summary.categoryTotals[ExpenseCategory.Hotel]).toBe(180);
    expect(ANNUAL_SUMMARY_CATEGORIES).toEqual([
      ExpenseCategory.Meal,
      ExpenseCategory.RemoteWork,
      'travel',
      ExpenseCategory.Hotel,
    ]);
  });

  it('exports monthly summaries in an Excel-compatible CSV format', () => {
    const expenses = [
      makeExpense('2026-02-03', ExpenseCategory.Meal, 100, 'trip-1', '=SUM(A1:A2)'),
      makeExpense('2026-02-05', ExpenseCategory.Train, 90),
    ];

    const csv = buildMonthlyExpenseExportCsv(expenses, [rule], [], 2026, 1, 'en-US', fakeTranslateService as TranslateService);

    expect(csv.startsWith('sep=,\r\n')).toBe(true);
    expect(csv).toContain('"Date","Trip","Category","Description","Gross","Reduction","Net"');
    expect(csv).toContain("'=SUM(A1:A2)");
    expect(csv).toContain('"02/05/2026","","train","Expense","90.00","0.00","90.00"');
    expect(csv.indexOf('"03/02/2026"')).toBeLessThan(csv.indexOf('"02/05/2026"'));
  });

  it('exports annual summaries and keeps CSV BOM/encoding requirements', () => {
    const expenses = [
      makeExpense('2026-01-04', ExpenseCategory.Meal, 60),
      makeExpense('2026-06-15', ExpenseCategory.RemoteWork, 50),
    ];

    const csv = buildAnnualExpenseExportCsv(expenses, [rule], [], 2026, 'en-US', fakeTranslateService as TranslateService);
    const encoded = utf16leEncode(csv);

    expect(csv).toContain('"Report","Annual expense summary"');
    expect(csv).toContain('"Fiscal rule scope","Start date","End date","Meal allowance"');
    expect(Array.from(encoded.slice(0, 2))).toEqual([0xff, 0xfe]);
  });

  it('sanitizes formula-like values before CSV serialization', () => {
    const csv = serializeCsvForExcel([['Description'], ['=CMD|whoami']]);

    expect(csv).toContain("'=CMD|whoami");
    expect(csv).toContain('\r\n');
  });
});

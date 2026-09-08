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

export const ANNUAL_SUMMARY_CATEGORIES = [
  ExpenseCategory.Meal,
  ExpenseCategory.RemoteWork,
  'travel',
  ExpenseCategory.Hotel,
] as const;

export type MonthlySummaryCategory = (typeof MONTHLY_SUMMARY_CATEGORIES)[number];
export type AnnualSummaryCategory = (typeof ANNUAL_SUMMARY_CATEGORIES)[number];

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

export interface AnnualSummaryMonth {
  index: number;
  cells: Partial<Record<AnnualSummaryCategory, number>>;
  total: number;
}

export interface AnnualExpenseSummary {
  year: number;
  months: AnnualSummaryMonth[];
  categoryTotals: Record<AnnualSummaryCategory, number>;
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

export function buildAnnualExpenseSummary(
  expenses: Expense[],
  year: number,
  fiscalRules: FiscalRule[] = [],
  trips: Trip[] = [],
): AnnualExpenseSummary {
  const categoryTotals: Record<AnnualSummaryCategory, number> = {
    [ExpenseCategory.Meal]: 0,
    [ExpenseCategory.RemoteWork]: 0,
    travel: 0,
    [ExpenseCategory.Hotel]: 0,
  };

  const months = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthlySummary = buildMonthlyExpenseSummary(expenses, year, monthIndex, fiscalRules, trips);
    const cells: Partial<Record<AnnualSummaryCategory, number>> = {};

    for (const category of ANNUAL_SUMMARY_CATEGORIES) {
      if (category === 'travel') {
        const travelAmount =
          monthlySummary.categoryTotals[ExpenseCategory.Train] + monthlySummary.categoryTotals[ExpenseCategory.MetroBus];
        if (travelAmount > 0) {
          cells[category] = travelAmount;
        }
        categoryTotals[category] += travelAmount;
        continue;
      }

      const categoryAmount = monthlySummary.categoryTotals[category];
      if (categoryAmount > 0) {
        cells[category] = categoryAmount;
      }
      categoryTotals[category] += categoryAmount;
    }

    return {
      index: monthIndex,
      cells,
      total: monthlySummary.grandTotal,
    };
  });

  const grandTotal = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

  return {
    year,
    months,
    categoryTotals,
    grandTotal,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeCsvFormulaValue(value: string): string {
  const trimmed = value.trimStart();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${value}`;
  }

  return value;
}

function formatCsvCell(value: string | number | null | undefined): string {
  const normalized = value == null ? '' : String(value);
  const sanitized = escapeCsvFormulaValue(normalized).replace(/"/g, '""');
  return `"${sanitized}"`;
}

export function serializeCsvForExcel(rows: Array<Array<string | number | null | undefined>>): string {
  const csvRows = rows.map((row) => row.map(formatCsvCell).join(','));
  return `sep=,\r\n${csvRows.join('\r\n')}\r\n`;
}

export function utf16leEncode(text: string): Uint8Array {
  const bytes = new Uint8Array((text.length + 1) * 2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0xfeff, true);

  for (let index = 0; index < text.length; index += 1) {
    view.setUint16(2 + index * 2, text.charCodeAt(index), true);
  }

  return bytes;
}

function toMoney(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function getApplicableFiscalRulesForMonth(
  year: number,
  monthIndex: number,
  fiscalRules: FiscalRule[] = [],
): FiscalRule[] {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  return fiscalRules
    .filter((rule) => {
      const start = new Date(`${rule.startDate}T00:00:00`);
      const end = new Date(`${rule.endDate}T23:59:59`);
      return end >= monthStart && start <= monthEnd;
    })
    .sort((a, b) => new Date(`${b.startDate}T00:00:00`).getTime() - new Date(`${a.startDate}T00:00:00`).getTime());
}

function getApplicableFiscalRulesForYear(year: number, fiscalRules: FiscalRule[] = []): FiscalRule[] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  return fiscalRules
    .filter((rule) => {
      const start = new Date(`${rule.startDate}T00:00:00`);
      const end = new Date(`${rule.endDate}T23:59:59`);
      return end >= yearStart && start <= yearEnd;
    })
    .sort((a, b) => new Date(`${b.startDate}T00:00:00`).getTime() - new Date(`${a.startDate}T00:00:00`).getTime());
}

function createExpenseExportRows(
  expenses: Expense[],
  fiscalRules: FiscalRule[] = [],
  trips: Trip[] = [],
  year?: number,
  monthIndex?: number,
): Array<Array<string | number>> {
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
  const rows: Array<Array<string | number>> = [];

  const relevantExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    const matchesYear = year === undefined || date.getFullYear() === year;
    const matchesMonth = monthIndex === undefined || date.getMonth() === monthIndex;
    return matchesYear && matchesMonth;
  });

  for (const expense of relevantExpenses.sort((a, b) => a.date.localeCompare(b.date))) {
    const fiscalRule = getApplicableFiscalRule(expense.date, fiscalRules);
    const gross = expense.amount;
    const net = getExpenseNetAmount(expense, fiscalRule);
    const abatement = gross - net;
    const trip = tripMap.get(expense.tripId);

    rows.push([
      expense.date,
      trip?.destination ?? '',
      expense.category,
      expense.description,
      toMoney(gross),
      toMoney(abatement),
      toMoney(net),
    ]);
  }

  return rows;
}

function createRemoteWorkAllowanceRows(
  summary: MonthlyExpenseSummary,
  _year: number,
  _monthIndex: number,
): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [];

  for (const day of summary.days) {
    const remoteWorkCell = day.cells[ExpenseCategory.RemoteWork];
    if (!remoteWorkCell || remoteWorkCell.sourceExpenses.length > 0) {
      continue;
    }

    rows.push([
      day.date,
      '',
      ExpenseCategory.RemoteWork,
      'Remote work allowance',
      toMoney(remoteWorkCell.gross),
      toMoney(remoteWorkCell.abatement),
      toMoney(remoteWorkCell.net),
    ]);
  }

  return rows;
}

export function buildMonthlyExpenseExportCsv(
  expenses: Expense[],
  fiscalRules: FiscalRule[] = [],
  trips: Trip[] = [],
  year: number,
  monthIndex: number,
): string {
  const summary = buildMonthlyExpenseSummary(expenses, year, monthIndex, fiscalRules, trips);
  const fiscalRuleRows = getApplicableFiscalRulesForMonth(year, monthIndex, fiscalRules);
  const detailRows = createExpenseExportRows(expenses, fiscalRules, trips, year, monthIndex);
  const remoteWorkRows = createRemoteWorkAllowanceRows(summary, year, monthIndex);

  const rows: Array<Array<string | number | null | undefined>> = [
    ['Report', 'Monthly expense summary'],
    ['Period', `${year}-${String(monthIndex + 1).padStart(2, '0')}`],
    ['Grand total', toMoney(summary.grandTotal)],
    [],
    ['Date', 'Trip', 'Category', 'Description', 'Gross', 'Reduction', 'Net'],
    ...detailRows,
    ...remoteWorkRows,
    [],
    ['Category', 'Total'],
    ...MONTHLY_SUMMARY_CATEGORIES.map((category) => [category, toMoney(summary.categoryTotals[category])]),
    [],
    ['Fiscal rule scope', 'Start date', 'End date', 'Meal allowance', 'Meal voucher face value', 'Employer contribution %', 'Remote work allowance'],
    ...fiscalRuleRows.map((rule) => [
      rule.id,
      rule.startDate,
      rule.endDate,
      toMoney(rule.mealAllowance),
      toMoney(rule.mealVoucherFaceValue),
      toMoney(rule.mealVoucherEmployerContributionPercentage),
      toMoney(rule.remoteWorkAllowance),
    ]),
  ];

  return serializeCsvForExcel(rows);
}

export function buildAnnualExpenseExportCsv(
  expenses: Expense[],
  fiscalRules: FiscalRule[] = [],
  trips: Trip[] = [],
  year: number,
): string {
  const summary = buildAnnualExpenseSummary(expenses, year, fiscalRules, trips);
  const fiscalRuleRows = getApplicableFiscalRulesForYear(year, fiscalRules);
  const detailRows = createExpenseExportRows(expenses, fiscalRules, trips, year);

  const rows: Array<Array<string | number | null | undefined>> = [
    ['Report', 'Annual expense summary'],
    ['Year', year],
    ['Grand total', toMoney(summary.grandTotal)],
    [],
    ['Date', 'Trip', 'Category', 'Description', 'Gross', 'Reduction', 'Net'],
    ...detailRows,
    [],
    ['Month', 'Total'],
    ...summary.months.map((month) => [
      new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(year, month.index, 1)),
      toMoney(month.total),
    ]),
    [],
    ['Category', 'Total'],
    ...ANNUAL_SUMMARY_CATEGORIES.map((category) => [
      category === 'travel' ? 'travel' : category,
      toMoney(summary.categoryTotals[category]),
    ]),
    [],
    ['Fiscal rule scope', 'Start date', 'End date', 'Meal allowance', 'Meal voucher face value', 'Employer contribution %', 'Remote work allowance'],
    ...fiscalRuleRows.map((rule) => [
      rule.id,
      rule.startDate,
      rule.endDate,
      toMoney(rule.mealAllowance),
      toMoney(rule.mealVoucherFaceValue),
      toMoney(rule.mealVoucherEmployerContributionPercentage),
      toMoney(rule.remoteWorkAllowance),
    ]),
  ];

  return serializeCsvForExcel(rows);
}

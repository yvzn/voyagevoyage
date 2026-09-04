import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Expense, ExpenseCategory } from '../expense/expense.model';
import { ExpenseActions } from '../expense/store/expense.actions';
import { selectAllExpenses } from '../expense/store/expense.selectors';
import {
  MONTHLY_SUMMARY_CATEGORIES,
  MonthlySummaryCell,
  buildMonthlyExpenseSummary,
  formatCurrency,
} from '../expense/monthly-expense-summary.util';
import { FiscalRuleActions } from '../fiscal-rule/store/fiscal-rule.actions';
import { selectAllFiscalRules } from '../fiscal-rule/store/fiscal-rule.selectors';
import { LocaleService } from '../locale.service';
import { TripActions } from '../trip/store/trip.actions';
import { selectAllTrips } from '../trip/store/trip.selectors';

@Component({
  selector: 'app-monthly-expense-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './monthly-expense-summary.html',
})
export class MonthlyExpenseSummaryComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  protected readonly selectedMonth = signal(new Date());
  protected readonly selectedCell = signal<MonthlySummaryCell | null>(null);
  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly summaryCategories = MONTHLY_SUMMARY_CATEGORIES;

  protected readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly expenses = this.store.selectSignal(selectAllExpenses);
  protected readonly fiscalRules = this.store.selectSignal(selectAllFiscalRules);

  constructor() {
    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(FiscalRuleActions.loadFiscalRules());

    effect(() => {
      const trips = this.trips();
      if (trips.length > 0) {
        this.store.dispatch(ExpenseActions.loadExpensesForTrips({ tripIds: trips.map((trip) => trip.id) }));
      }
    });
  }

  protected readonly summary = computed(() =>
    buildMonthlyExpenseSummary(
      this.expenses(),
      this.selectedMonth().getFullYear(),
      this.selectedMonth().getMonth(),
      this.fiscalRules(),
    ),
  );

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      month: 'long',
      year: 'numeric',
    }).format(this.selectedMonth()),
  );

  protected readonly categoryTotals = computed(() => this.summary().categoryTotals);

  protected readonly grandTotal = computed(() => this.summary().grandTotal);

  protected formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  protected openCellDetails(cell: MonthlySummaryCell | undefined): void {
    this.selectedCell.set(cell ?? null);
  }

  protected closeCellDetails(): void {
    this.selectedCell.set(null);
  }

  protected previousMonth(): void {
    const date = new Date(this.selectedMonth());
    date.setMonth(date.getMonth() - 1);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
  }

  protected nextMonth(): void {
    const date = new Date(this.selectedMonth());
    date.setMonth(date.getMonth() + 1);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
  }

  protected getCellValue(cell: MonthlySummaryCell | undefined): string {
    return cell ? this.formatCurrency(cell.net) : '';
  }

  protected getCategoryTranslationKey(category: ExpenseCategory): string {
    return `expenseCategory.${category}`;
  }

  protected getSourceExpenseLabel(expense: Expense): string {
    const amount = this.formatCurrency(expense.amount);
    return `${expense.description || '—'} · ${amount}`;
  }
}

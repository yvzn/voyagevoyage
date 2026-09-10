import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import {
  ANNUAL_SUMMARY_CATEGORIES,
  AnnualSummaryCategory,
  buildAnnualExpenseExportCsv,
  buildAnnualExpenseSummary,
  formatCurrency,
  utf16leEncode,
} from '../expense/monthly-expense-summary.util';
import { ExpenseActions } from '../expense/store/expense.actions';
import { selectAllExpenses } from '../expense/store/expense.selectors';
import { FiscalRuleActions } from '../fiscal-rule/store/fiscal-rule.actions';
import { selectAllFiscalRules } from '../fiscal-rule/store/fiscal-rule.selectors';
import { LocaleService } from '../locale.service';
import { TripActions } from '../trip/store/trip.actions';
import { selectAllTrips } from '../trip/store/trip.selectors';

@Component({
  selector: 'app-annual-expense-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './annual-expense-summary.html',
})
export class AnnualExpenseSummaryComponent {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  protected readonly selectedYear = signal(new Date().getFullYear());
  protected readonly summaryCategories = ANNUAL_SUMMARY_CATEGORIES;
  protected readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly expenses = this.store.selectSignal(selectAllExpenses);
  protected readonly fiscalRules = this.store.selectSignal(selectAllFiscalRules);
  protected readonly monthNames = Array.from({ length: 12 }, (_, monthIndex) =>
    new Intl.DateTimeFormat(this.localeService.currentLocale(), { month: 'long' }).format(
      new Date(2024, monthIndex, 1),
    ),
  );

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
    buildAnnualExpenseSummary(
      this.expenses(),
      this.selectedYear(),
      this.fiscalRules(),
      this.trips(),
    ),
  );

  protected readonly categoryTotals = computed(() => this.summary().categoryTotals);
  protected readonly grandTotal = computed(() => this.summary().grandTotal);

  protected previousYear(): void {
    this.selectedYear.update((year) => year - 1);
  }

  protected nextYear(): void {
    this.selectedYear.update((year) => year + 1);
  }

  protected onYearChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value || this.selectedYear());
    if (Number.isFinite(value)) {
      this.selectedYear.set(value);
    }
  }

  protected formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  protected exportCurrentSummary(): void {
    const csv = buildAnnualExpenseExportCsv(
      this.expenses(),
      this.fiscalRules(),
      this.trips(),
      this.selectedYear(),
      this.localeService.currentLocale(),
    );
    const bytes = utf16leEncode(csv);
    const array = new Uint8Array(bytes.length);
    array.set(bytes);
    const blob = new Blob([array.buffer], { type: 'text/csv;charset=utf-16le' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annual-summary-${this.selectedYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected getCategoryTranslationKey(category: AnnualSummaryCategory): string {
    return category === 'travel' ? 'expenseCategory.travel' : `expenseCategory.${category}`;
  }
}

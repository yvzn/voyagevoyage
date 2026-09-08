import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly selectedMonth = signal(new Date());
  protected readonly selectedCell = signal<MonthlySummaryCell | null>(null);
  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly summaryCategories = MONTHLY_SUMMARY_CATEGORIES;
  protected readonly monthNames = Array.from({ length: 12 }, (_, monthIndex) =>
    new Intl.DateTimeFormat(this.localeService.currentLocale(), { month: 'long' }).format(
      new Date(2024, monthIndex, 1),
    ),
  );

  protected readonly trips = this.store.selectSignal(selectAllTrips);
  protected readonly expenses = this.store.selectSignal(selectAllExpenses);
  protected readonly fiscalRules = this.store.selectSignal(selectAllFiscalRules);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const yearFromQuery = Number(params.get('year') ?? new Date().getFullYear());
    const monthFromQuery = Number(params.get('month') ?? new Date().getMonth());
    const monthDate = new Date(yearFromQuery, monthFromQuery, 1);
    if (Number.isFinite(yearFromQuery) && Number.isFinite(monthFromQuery)) {
      this.selectedMonth.set(monthDate);
    }

    this.store.dispatch(TripActions.loadTrips());
    this.store.dispatch(FiscalRuleActions.loadFiscalRules());

    effect(() => {
      const trips = this.trips();
      if (trips.length > 0) {
        this.store.dispatch(ExpenseActions.loadExpensesForTrips({ tripIds: trips.map((trip) => trip.id) }));
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const year = Number(params.get('year') ?? this.selectedMonth().getFullYear());
      const month = Number(params.get('month') ?? this.selectedMonth().getMonth());
      if (!Number.isFinite(year) || !Number.isFinite(month)) {
        return;
      }

      const nextMonth = new Date(year, month, 1);
      const current = this.selectedMonth();
      if (nextMonth.getFullYear() !== current.getFullYear() || nextMonth.getMonth() !== current.getMonth()) {
        this.selectedMonth.set(nextMonth);
      }
    });

    effect(() => {
      const dialog = this.dialogEl();
      const cell = this.selectedCell();

      if (!dialog) return;
      if (cell) {
        if (!dialog.nativeElement.open) {
          dialog.nativeElement.showModal();
        }
        return;
      }

      if (dialog.nativeElement.open) {
        dialog.nativeElement.close();
      }
    });
  }

  protected readonly summary = computed(() =>
    buildMonthlyExpenseSummary(
      this.expenses(),
      this.selectedMonth().getFullYear(),
      this.selectedMonth().getMonth(),
      this.fiscalRules(),
      this.trips(),
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

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeCellDetails();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) {
      this.closeCellDetails();
    }
  }

  protected previousMonth(): void {
    const date = new Date(this.selectedMonth());
    date.setMonth(date.getMonth() - 1);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: date.getFullYear(), month: date.getMonth() },
      queryParamsHandling: 'merge',
    });
  }

  protected nextMonth(): void {
    const date = new Date(this.selectedMonth());
    date.setMonth(date.getMonth() + 1);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: date.getFullYear(), month: date.getMonth() },
      queryParamsHandling: 'merge',
    });
  }

  protected goToToday(): void {
    const date = new Date();
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: date.getFullYear(), month: date.getMonth() },
      queryParamsHandling: 'merge',
    });
  }

  protected onMonthChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    const date = new Date(this.selectedMonth());
    date.setMonth(value);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: date.getFullYear(), month: date.getMonth() },
      queryParamsHandling: 'merge',
    });
  }

  protected onYearChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value || this.selectedMonth().getFullYear());
    const date = new Date(this.selectedMonth());
    date.setFullYear(value);
    this.selectedMonth.set(date);
    this.selectedCell.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year: date.getFullYear(), month: date.getMonth() },
      queryParamsHandling: 'merge',
    });
  }

  protected getCellValue(cell: MonthlySummaryCell | undefined): string {
    return cell ? this.formatCurrency(cell.net) : '';
  }

  protected getCellButtonClasses(cell: MonthlySummaryCell | undefined): string {
    const isExpenseCell = !!cell && cell.sourceExpenses.length > 0;

    return [
      'w-full cursor-pointer rounded-md px-2 py-1 text-right transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:text-blue-400 dark:hover:bg-blue-950/30',
      isExpenseCell ? 'text-base font-semibold text-blue-700' : 'text-sm font-medium text-blue-700/80',
    ].join(' ');
  }

  protected getDayOfWeekShort(date: string): string {
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      weekday: 'short',
    }).format(new Date(`${date}T00:00:00`));
  }

  protected getCategoryTranslationKey(category: ExpenseCategory): string {
    return `expenseCategory.${category}`;
  }

  protected getSourceExpenseLabel(expense: Expense): string {
    const amount = this.formatCurrency(expense.amount);
    return `${expense.description || '—'} · ${amount}`;
  }
}

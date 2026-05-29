import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ExpenseActions } from '../store/expense.actions';
import {
  selectSelectedExpense,
  selectExpenseLoadByIdStatus,
  selectExpensesDeleteStatus,
} from '../store/expense.selectors';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { LocaleService } from '../../locale.service';
import { ReceiptUploadComponent } from '../../receipt/receipt-upload/receipt-upload';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DecimalPipe, ExpenseFormComponent, ReceiptUploadComponent],
  templateUrl: './expense-detail.html',
})
export class ExpenseDetailComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );
  protected readonly expenseId = this.routeParamId;

  protected readonly expense = this.store.selectSignal(selectSelectedExpense);
  protected readonly loadByIdStatus = this.store.selectSignal(selectExpenseLoadByIdStatus);

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);

  /** Whether the inline delete confirmation prompt is shown */
  protected readonly showDeleteConfirm = signal(false);

  private readonly deleteStatus = this.store.selectSignal(selectExpensesDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'expenseDetail.deleteError' : null
  );

  /** True while a delete dispatched by this instance is in flight. */
  private deletePending = false;

  /** TripId to navigate to after successful deletion; saved before dispatching to avoid reading cleared store state. */
  private deleteTripId: string | null = null;

  constructor() {
    // Load expense when the id is known
    effect(() => {
      const id = this.expenseId();
      if (id) {
        this.store.dispatch(ExpenseActions.loadExpenseById({ id }));
      }
    });

    // Navigate back to trip after successful deletion
    effect(() => {
      const ds = this.deleteStatus();
      if (this.deletePending) {
        if (ds === 'success') {
          this.deletePending = false;
          const tripId = this.deleteTripId;
          this.deleteTripId = null;
          if (tripId) {
            this.router.navigate(['/trip', tripId]);
          } else {
            this.router.navigate(['/calendar']);
          }
        } else if (ds === 'failure') {
          this.deletePending = false;
        }
      }
    });
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  protected openEditForm(): void {
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected onDelete(): void {
    const expense = this.expense();
    if (!expense || this.isDeleting()) return;

    this.showDeleteConfirm.set(false);
    this.deletePending = true;
    this.deleteTripId = expense.tripId;
    this.store.dispatch(ExpenseActions.deleteExpense({ id: expense.id }));
  }
}

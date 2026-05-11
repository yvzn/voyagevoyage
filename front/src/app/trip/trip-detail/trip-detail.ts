import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { TripStatus } from '../trip.model';
import { TripActions } from '../store/trip.actions';
import { selectAllTrips, selectTripsDeleteStatus } from '../store/trip.selectors';
import { TripFormComponent } from '../trip-form/trip-form';
import { getTripStatusClass, getTripStatusTranslationKey } from '../trip-status.utils';
import { LocaleService } from '../../locale.service';
import { ExpenseFormComponent } from '../../expense/expense-form/expense-form';
import { ExpenseActions } from '../../expense/store/expense.actions';
import { selectAllExpenses, selectExpensesLoadStatus } from '../../expense/store/expense.selectors';
import { ExpenseCategory } from '../../expense/expense.model';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [NgClass, DecimalPipe, TranslatePipe, TripFormComponent, RouterLink, ExpenseFormComponent],
  templateUrl: './trip-detail.html',
})
export class TripDetailComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );
  protected readonly tripId = this.routeParamId;

  private readonly allTrips = this.store.selectSignal(selectAllTrips);
  protected readonly trip = computed(() =>
    this.allTrips().find((t) => t.id === this.tripId()) ?? null
  );

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);

  /** Whether the expense form modal is open */
  protected readonly isExpenseFormOpen = signal(false);

  /** Whether the inline delete confirmation prompt is shown */
  protected readonly showDeleteConfirm = signal(false);

  private readonly deleteStatus = this.store.selectSignal(selectTripsDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'tripDetail.deleteError' : null
  );

  protected readonly expenses = this.store.selectSignal(selectAllExpenses);
  protected readonly expensesLoadStatus = this.store.selectSignal(selectExpensesLoadStatus);

  protected readonly TripStatus = TripStatus;
  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly getTripStatusClass = getTripStatusClass;
  protected readonly getTripStatusTranslationKey = getTripStatusTranslationKey;

  /** True while a delete dispatched by this instance is in flight. */
  private deletePending = false;

  constructor() {
    effect(() => {
      const ds = this.deleteStatus();
      if (this.deletePending) {
        if (ds === 'success') {
          this.deletePending = false;
          this.router.navigate(['/calendar']);
        } else if (ds === 'failure') {
          this.deletePending = false;
        }
      }
    });

    // Load expenses when the trip id is known
    effect(() => {
      const id = this.tripId();
      if (id) {
        this.store.dispatch(ExpenseActions.loadExpenses({ tripId: id }));
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

  protected openExpenseForm(): void {
    this.isExpenseFormOpen.set(true);
  }

  protected closeExpenseForm(): void {
    this.isExpenseFormOpen.set(false);
  }

  protected navigateToExpense(expenseId: string): void {
    this.router.navigate(['/expense', expenseId]);
  }

  protected requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected onDelete(): void {
    const trip = this.trip();
    if (!trip || this.isDeleting()) return;

    this.showDeleteConfirm.set(false);
    this.deletePending = true;
    this.store.dispatch(TripActions.deleteTrip({ id: trip.id }));
  }
}

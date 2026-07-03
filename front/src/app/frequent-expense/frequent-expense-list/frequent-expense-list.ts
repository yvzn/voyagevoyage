import { Component, effect, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { FrequentExpense, CreateFrequentExpenseRequest, UpdateFrequentExpenseRequest } from '../frequent-expense.model';
import { selectAllFrequentExpenses, selectDeleteStatus } from '../store/frequent-expense.selectors';
import { FrequentExpenseActions } from '../store/frequent-expense.actions';
import { FrequentExpenseFormComponent } from '../frequent-expense-form/frequent-expense-form';

@Component({
  selector: 'app-frequent-expense-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DecimalPipe, FrequentExpenseFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './frequent-expense-list.html',
})
export class FrequentExpenseListComponent {
  private readonly store = inject(Store);

  protected readonly frequentExpenses = this.store.selectSignal(selectAllFrequentExpenses);
  protected readonly deleteStatus = this.store.selectSignal(selectDeleteStatus);

  protected readonly isFormOpen = signal(false);
  protected readonly selectedExpense = signal<FrequentExpense | null>(null);
  protected readonly expenseToDelete = signal<FrequentExpense | null>(null);

  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');

  protected onEdit(expense: FrequentExpense): void {
    this.selectedExpense.set(expense);
    this.isFormOpen.set(true);
  }

  protected onCreate(): void {
    this.selectedExpense.set(null);
    this.isFormOpen.set(true);
  }

  protected onFormSaved(request: CreateFrequentExpenseRequest | UpdateFrequentExpenseRequest): void {
    const selectedExpense = this.selectedExpense();
    if (selectedExpense) {
      this.store.dispatch(FrequentExpenseActions.updateFrequentExpense({ id: selectedExpense.id, request }));
    } else {
      this.store.dispatch(FrequentExpenseActions.createFrequentExpense({ request }));
    }
    this.isFormOpen.set(false);
    this.selectedExpense.set(null);
  }

  protected onFormCancelled(): void {
    this.isFormOpen.set(false);
    this.selectedExpense.set(null);
  }

  protected onDeleteClick(expense: FrequentExpense): void {
    this.expenseToDelete.set(expense);
  }

  protected onConfirmDelete(): void {
    const expense = this.expenseToDelete();
    if (expense) {
      this.store.dispatch(FrequentExpenseActions.deleteFrequentExpense({ id: expense.id }));
      this.expenseToDelete.set(null);
    }
  }

  protected onCancelDelete(): void {
    this.expenseToDelete.set(null);
  }
}

import { Component, input, output, inject, signal, computed, effect, ChangeDetectionStrategy, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { FrequentExpense, FrequentExpenseWithDateOverride } from '../../frequent-expense/frequent-expense.model';
import { selectAllFrequentExpenses, selectLoadStatus } from '../../frequent-expense/store/frequent-expense.selectors';
import { FrequentExpenseActions } from '../../frequent-expense/store/frequent-expense.actions';

@Component({
  selector: 'app-add-frequent-expenses-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './add-frequent-expenses-modal.html',
})
export class AddFrequentExpensesModalComponent implements AfterViewInit {
  readonly tripDate = input.required<string>();
  readonly confirmed = output<FrequentExpenseWithDateOverride[]>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  protected readonly frequentExpenses = this.store.selectSignal(selectAllFrequentExpenses);
  protected readonly loadStatus = this.store.selectSignal(selectLoadStatus);
  protected readonly isLoading = computed(() => this.loadStatus() === 'loading');

  protected readonly form = this.fb.nonNullable.group({
    expenses: this.fb.array([]),
  });

  protected readonly isSubmitting = signal(false);

  constructor() {
    this.store.dispatch(FrequentExpenseActions.loadFrequentExpenses());
    effect(() => this.updateExpensesFormArray());
  }

  private updateExpensesFormArray(): void {
    const formArray = this.form.get('expenses') as FormArray;
    formArray.clear();
    
    this.frequentExpenses().forEach(expense => {
      formArray.push(
        this.fb.group({
          id: [expense.id],
          checked: [true],
          dateOverride: [this.tripDate(), Validators.required],
        })
      );
    });
  }

  protected getExpensesFormArray(): any[] {
    const formArray = this.form.get('expenses') as FormArray;
    return formArray.controls;
  }

  protected getExpense(index: number): FrequentExpense | undefined {
    return this.frequentExpenses()[index];
  }

  protected onConfirm(): void {
    const formArray = this.form.get('expenses') as FormArray;
    const selectedExpenses: FrequentExpenseWithDateOverride[] = [];

    this.frequentExpenses().forEach((expense, index) => {
      const control = formArray.at(index);
      if (control?.get('checked')?.value) {
        selectedExpenses.push({
          ...expense,
          dateOverride: control.get('dateOverride')?.value || this.tripDate(),
        });
      }
    });

    this.confirmed.emit(selectedExpenses);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  ngAfterViewInit(): void {
    this.dialogEl().nativeElement.showModal();
  }

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.onCancel();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) {
      this.onCancel();
    }
  }
}

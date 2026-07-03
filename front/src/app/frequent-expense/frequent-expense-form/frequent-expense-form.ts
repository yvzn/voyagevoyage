import { Component, effect, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FrequentExpense, CreateFrequentExpenseRequest, UpdateFrequentExpenseRequest } from '../frequent-expense.model';
import { ExpenseCategory } from '../../expense/expense.model';

@Component({
  selector: 'app-frequent-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './frequent-expense-form.html',
})
export class FrequentExpenseFormComponent {
  readonly frequentExpense = input<FrequentExpense | null>(null);
  readonly saved = output<CreateFrequentExpenseRequest | UpdateFrequentExpenseRequest>();
  readonly cancelled = output<void>();
  readonly isSubmitting = input(false);

  private readonly fb = inject(FormBuilder);

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly expenseCategories = Object.values(ExpenseCategory);

  protected readonly form = this.fb.nonNullable.group({
    category: [ExpenseCategory.Other, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', Validators.maxLength(500)],
  });

  constructor() {
    effect(() => {
      const expense = this.frequentExpense();
      if (expense) {
        this.form.patchValue({
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
        });
      } else {
        this.form.reset({
          category: ExpenseCategory.Other,
          amount: 0,
          description: '',
        });
      }
    });
  }

  protected readonly isEdit = computed(() => !!this.frequentExpense());

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.form.getRawValue();
    const request: CreateFrequentExpenseRequest | UpdateFrequentExpenseRequest = {
      category: formValue.category,
      amount: formValue.amount,
      description: formValue.description,
    };

    this.saved.emit(request);
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected getCategoryTranslationKey(category: ExpenseCategory): string {
    return `expenseCategory.${category}`;
  }
}

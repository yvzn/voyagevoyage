import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Expense, ExpenseCategory, CreateExpenseRequest, UpdateExpenseRequest } from '../expense.model';
import { ExpenseActions } from '../store/expense.actions';
import { selectExpensesCreateStatus, selectExpensesUpdateStatus } from '../store/expense.selectors';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './expense-form.html',
})
export class ExpenseFormComponent implements AfterViewInit {
  /**
   * When set, the expense is attached to this trip (trip-detail create flow).
   * When null, the effect finds or creates a trip for the expense date (calendar flow).
   */
  readonly tripId = input<string | null>(null);

  /** When set, the form is in edit mode for this expense. */
  readonly expense = input<Expense | null>(null);

  /** Pre-fill the date field when opening from the calendar. */
  readonly defaultDate = input<string | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  protected readonly localeService = inject(LocaleService);

  private readonly createStatus = this.store.selectSignal(selectExpensesCreateStatus);
  private readonly updateStatus = this.store.selectSignal(selectExpensesUpdateStatus);

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly expenseCategories = [
    ExpenseCategory.Train,
    ExpenseCategory.Hotel,
    ExpenseCategory.Meal,
    ExpenseCategory.MetroBus,
    ExpenseCategory.Other,
  ];

  protected readonly isSaving = computed(
    () => this.createStatus() === 'loading' || this.updateStatus() === 'loading',
  );
  protected readonly isLoading = computed(() => this.isSaving());

  protected readonly errorKey = computed<string | null>(() => {
    if (this.createStatus() === 'failure' || this.updateStatus() === 'failure')
      return 'expenseForm.saveError';
    return null;
  });

  get isEditMode(): boolean {
    return this.expense() !== null;
  }

  /** Tracks which save operation (create/update) was last dispatched by this instance. */
  private saveOp: 'create' | 'update' | null = null;

  protected readonly form = this.fb.group({
    date: ['', Validators.required],
    category: [ExpenseCategory.Other as ExpenseCategory, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [''],
  });

  constructor() {
    // Populate form when inputs change
    effect(() => {
      const e = this.expense();
      const d = this.defaultDate();
      if (e) {
        this.form.setValue({
          date: e.date,
          category: e.category,
          amount: e.amount,
          description: e.description,
        });
      } else {
        this.form.reset({
          date: d ?? '',
          category: ExpenseCategory.Other,
          amount: null,
          description: '',
        });
      }
    });

    // React to create completion
    effect(() => {
      const cs = this.createStatus();
      if (this.saveOp === 'create') {
        if (cs === 'success') {
          this.saveOp = null;
          this.saved.emit();
        } else if (cs === 'failure') {
          this.saveOp = null;
        }
      }
    });

    // React to update completion
    effect(() => {
      const us = this.updateStatus();
      if (this.saveOp === 'update') {
        if (us === 'success') {
          this.saveOp = null;
          this.saved.emit();
        } else if (us === 'failure') {
          this.saveOp = null;
        }
      }
    });
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

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const { date, category, amount, description } = this.form.getRawValue();

    const expense = this.expense();
    if (expense) {
      // Edit mode
      const request: UpdateExpenseRequest = {
        date: date!,
        category: category!,
        amount: amount!,
        description: description ?? '',
      };
      this.saveOp = 'update';
      this.store.dispatch(ExpenseActions.updateExpense({ id: expense.id, request }));
    } else {
      // Create mode
      const request: CreateExpenseRequest = {
        date: date!,
        category: category!,
        amount: amount!,
        description: description ?? '',
      };
      const tripId = this.tripId();
      this.saveOp = 'create';
      if (tripId) {
        this.store.dispatch(ExpenseActions.createExpense({ tripId, request }));
      } else {
        this.store.dispatch(ExpenseActions.createExpenseForDate({ date: date!, request }));
      }
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}

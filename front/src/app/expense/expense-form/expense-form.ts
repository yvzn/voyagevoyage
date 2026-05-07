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
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { ExpenseCategory, CreateExpenseRequest } from '../expense.model';
import { ExpenseActions } from '../store/expense.actions';
import { selectExpensesCreateStatus } from '../store/expense.selectors';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, TranslatePipe],
  templateUrl: './expense-form.html',
})
export class ExpenseFormComponent implements AfterViewInit {
  /**
   * When set, the expense is attached to this trip (trip-detail flow).
   * When null, the effect finds or creates a trip for the expense date (calendar flow).
   */
  readonly tripId = input<string | null>(null);

  /** Pre-fill the date field when opening from the calendar. */
  readonly defaultDate = input<string | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  protected readonly localeService = inject(LocaleService);

  private readonly createStatus = this.store.selectSignal(selectExpensesCreateStatus);

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly expenseCategories = [
    ExpenseCategory.Train,
    ExpenseCategory.Hotel,
    ExpenseCategory.Meal,
    ExpenseCategory.MetroBus,
    ExpenseCategory.Other,
  ];

  protected readonly isSaving = computed(() => this.createStatus() === 'loading');
  protected readonly isLoading = computed(() => this.isSaving());

  protected readonly errorKey = computed<string | null>(() =>
    this.createStatus() === 'failure' ? 'expenseForm.saveError' : null,
  );

  /** Whether this instance is waiting for a save to complete. */
  private savePending = false;

  protected readonly form = this.fb.group({
    date: ['', Validators.required],
    category: [ExpenseCategory.Other as ExpenseCategory, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      const d = this.defaultDate();
      this.form.patchValue({ date: d ?? '' });
    });

    effect(() => {
      const cs = this.createStatus();
      if (this.savePending) {
        if (cs === 'success') {
          this.savePending = false;
          this.saved.emit();
        } else if (cs === 'failure') {
          this.savePending = false;
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
    const request: CreateExpenseRequest = {
      date: date!,
      category: category!,
      amount: amount!,
      description: description ?? '',
    };

    const tripId = this.tripId();
    this.savePending = true;

    if (tripId) {
      this.store.dispatch(ExpenseActions.createExpense({ tripId, request }));
    } else {
      this.store.dispatch(ExpenseActions.createExpenseForDate({ date: date!, request }));
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}

import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ExpenseDetailComponent } from './expense-detail';
import { Expense, ExpenseCategory } from '../expense.model';
import {
  selectSelectedExpense,
  selectExpenseLoadByIdStatus,
  selectExpensesDeleteStatus,
  selectExpensesCreateStatus,
  selectExpensesUpdateStatus,
} from '../store/expense.selectors';
import { ApiStatus } from '../store/expense.reducer';
import {
  selectReceiptsByExpenseId,
  selectUploadStatus,
  selectDeleteStatus,
} from '../../receipt/store/receipt.reducer';

const EN_TRANSLATIONS = {
  expenseDetail: {
    backToTrip: 'Back to trip',
    backToCalendar: 'Back to calendar',
    date: 'Date',
    description: 'Description',
    editButton: 'Edit',
    deleteButton: 'Delete',
    deleting: 'Deleting…',
    deleteConfirmMessage: 'Are you sure you want to delete this expense? This action cannot be undone.',
    deleteConfirmButton: 'Confirm deletion',
    deleteCancelButton: 'Cancel',
    deleteError: 'An error occurred while deleting the expense. Please try again.',
    loading: 'Loading…',
    notFound: 'Expense not found.',
  },
  expenseForm: {
    createTitle: 'New expense',
    editTitle: 'Edit expense',
    date: 'Date',
    dateRequired: 'Date is required.',
    category: 'Category',
    amount: 'Amount',
    amountRequired: 'Amount must be greater than 0.',
    description: 'Description',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveError: 'An error occurred while saving the expense. Please try again.',
  },
  expenseCategory: {
    train: 'Train',
    hotel: 'Hotel',
    meal: 'Meal',
    metroBus: 'Metro / Bus',
    other: 'Other',
  },
  receipt: {
    heading: 'Receipts',
    uploadButton: 'Add a receipt',
    uploading: 'Uploading…',
    uploadHint: 'PDF, JPEG, PNG, etc. — 10 MB max.',
    downloadButton: 'Download',
    deleteButton: 'Delete',
    empty: 'No receipts attached.',
    listLabel: 'Attached receipts',
    uploadError: 'An error occurred while uploading the receipt. Please try again.',
    deleteError: 'An error occurred while deleting the receipt. Please try again.',
  },
};

const MOCK_EXPENSE: Expense = {
  id: 'expense-1',
  tripId: 'trip-1',
  date: '2026-06-15',
  category: ExpenseCategory.Train,
  amount: 42.5,
  description: 'TGV Paris-Lyon',
};

// JSDOM does not implement HTMLDialogElement.showModal(); stub it globally
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = () => {};
});

async function setupModule(
  expense: Expense | null = MOCK_EXPENSE,
  expenseId = 'expense-1',
): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [ExpenseDetailComponent, TranslateModule.forRoot()],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ id: expenseId })) },
      },
      provideMockStore({
        selectors: [
          { selector: selectSelectedExpense, value: expense },
          { selector: selectExpenseLoadByIdStatus, value: 'idle' as ApiStatus },
          { selector: selectExpensesDeleteStatus, value: 'idle' as ApiStatus },
          { selector: selectExpensesCreateStatus, value: 'idle' as ApiStatus },
          { selector: selectExpensesUpdateStatus, value: 'idle' as ApiStatus },
          { selector: selectReceiptsByExpenseId, value: {} },
          { selector: selectUploadStatus, value: 'idle' as ApiStatus },
          { selector: selectDeleteStatus, value: 'idle' as ApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('ExpenseDetailComponent — expense found', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the category as heading', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Train');
  });

  it('should display a back to trip link', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));
    const backLink = links.find((a) => a.textContent?.includes('Back to trip'));
    expect(backLink).toBeTruthy();
  });

  it('should display an edit button', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const editBtn = buttons.find((b) => b.textContent?.includes('Edit'));
    expect(editBtn).toBeTruthy();
  });

  it('should display a delete button', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const deleteBtn = buttons.find((b) => b.textContent?.includes('Delete'));
    expect(deleteBtn).toBeTruthy();
  });

  it('should open edit form when edit button is clicked', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['isFormOpen']()).toBe(false);
    fixture.componentInstance['openEditForm']();
    fixture.detectChanges();
    expect(fixture.componentInstance['isFormOpen']()).toBe(true);
  });

  it('should show delete confirmation when delete button is clicked', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(false);
    fixture.componentInstance['requestDelete']();
    fixture.detectChanges();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alertdialog"]')).toBeTruthy();
  });

  it('should hide confirmation when cancel is clicked', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance['requestDelete']();
    fixture.detectChanges();

    fixture.componentInstance['cancelDelete']();
    fixture.detectChanges();

    expect(fixture.componentInstance['showDeleteConfirm']()).toBe(false);
  });

  it('should dispatch deleteExpense and navigate to trip on success', () => {
    const store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance['requestDelete']();
    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectExpensesDeleteStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(navigateSpy).toHaveBeenCalledWith(['/trip', 'trip-1']);
  });

  it('should show delete error message on failure', () => {
    const store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();

    fixture.componentInstance['requestDelete']();
    fixture.componentInstance['onDelete']();

    store.overrideSelector(selectExpensesDeleteStatus, 'failure');
    store.refreshState();
    TestBed.flushEffects();

    expect(fixture.componentInstance['deleteError']()).toBe('expenseDetail.deleteError');
  });
});

describe('ExpenseDetailComponent — expense not found', () => {
  beforeEach(async () => {
    await setupModule(null, 'non-existent');
  });

  it('should display not found message', async () => {
    const fixture = TestBed.createComponent(ExpenseDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Expense not found.');
  });
});

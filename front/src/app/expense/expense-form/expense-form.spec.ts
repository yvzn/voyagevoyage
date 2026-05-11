import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';
import { ApiStatus as ExpenseApiStatus } from '../store/expense.reducer';
import { selectExpensesCreateStatus, selectExpensesUpdateStatus } from '../store/expense.selectors';
import { ExpenseFormComponent } from './expense-form';
import { ExpenseActions } from '../store/expense.actions';
import { Expense, ExpenseCategory } from '../expense.model';

const EN_TRANSLATIONS = {
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

async function setupModule(): Promise<MockStore> {
  await TestBed.configureTestingModule({
    imports: [ExpenseFormComponent, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectExpensesCreateStatus, value: 'idle' as ExpenseApiStatus },
          { selector: selectExpensesUpdateStatus, value: 'idle' as ExpenseApiStatus },
        ],
      }),
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');

  return TestBed.inject(MockStore);
}

describe('ExpenseFormComponent', () => {
  beforeEach(async () => {
    await setupModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the form title', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('New expense');
  });

  it('should render all category options', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Train');
    expect(text).toContain('Hotel');
    expect(text).toContain('Meal');
    expect(text).toContain('Metro / Bus');
    expect(text).toContain('Other');
  });

  it('should pre-fill date when defaultDate input is provided', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('defaultDate', '2026-06-15');
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('date')?.value).toBe('2026-06-15');
  });

  it('should dispatch createExpense when tripId is provided on submit', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('tripId', 'trip-1');
    fixture.componentRef.setInput('defaultDate', '2026-06-15');
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const store = TestBed.inject(MockStore);
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    // Fill in required fields
    component['form'].setValue({
      date: '2026-06-15',
      category: ExpenseCategory.Train,
      amount: 42.5,
      description: 'TGV Paris-Lyon',
    });

    component['onSubmit']();

    expect(dispatchSpy).toHaveBeenCalledWith(
      ExpenseActions.createExpense({
        tripId: 'trip-1',
        request: {
          date: '2026-06-15',
          category: ExpenseCategory.Train,
          amount: 42.5,
          description: 'TGV Paris-Lyon',
        },
      }),
    );
  });

  it('should dispatch createExpenseForDate when no tripId on submit', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('defaultDate', '2026-07-10');
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const store = TestBed.inject(MockStore);
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    component['form'].setValue({
      date: '2026-07-10',
      category: ExpenseCategory.Hotel,
      amount: 120,
      description: '',
    });

    component['onSubmit']();

    expect(dispatchSpy).toHaveBeenCalledWith(
      ExpenseActions.createExpenseForDate({
        date: '2026-07-10',
        request: {
          date: '2026-07-10',
          category: ExpenseCategory.Hotel,
          amount: 120,
          description: '',
        },
      }),
    );
  });

  it('should not submit if form is invalid', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const store = TestBed.inject(MockStore);
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    // Do not fill required fields
    component['onSubmit']();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should emit saved when createStatus becomes success', () => {
    const store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('tripId', 'trip-1');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['saveOp'] = 'create';

    let savedEmitted = false;
    component.saved.subscribe(() => {
      savedEmitted = true;
    });

    store.overrideSelector(selectExpensesCreateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(savedEmitted).toBe(true);
  });

  it('should emit saved when updateStatus becomes success (edit mode)', () => {
    const store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('expense', MOCK_EXPENSE);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['saveOp'] = 'update';

    let savedEmitted = false;
    component.saved.subscribe(() => {
      savedEmitted = true;
    });

    store.overrideSelector(selectExpensesUpdateStatus, 'success');
    store.refreshState();
    TestBed.flushEffects();

    expect(savedEmitted).toBe(true);
  });

  it('should pre-fill form fields when expense input is provided (edit mode)', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('expense', MOCK_EXPENSE);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component['form'].get('date')?.value).toBe('2026-06-15');
    expect(component['form'].get('category')?.value).toBe(ExpenseCategory.Train);
    expect(component['form'].get('amount')?.value).toBe(42.5);
    expect(component['form'].get('description')?.value).toBe('TGV Paris-Lyon');
  });

  it('should dispatch updateExpense in edit mode on submit', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('expense', MOCK_EXPENSE);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const store = TestBed.inject(MockStore);
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    component['onSubmit']();

    expect(dispatchSpy).toHaveBeenCalledWith(
      ExpenseActions.updateExpense({
        id: 'expense-1',
        request: {
          date: '2026-06-15',
          category: ExpenseCategory.Train,
          amount: 42.5,
          description: 'TGV Paris-Lyon',
        },
      }),
    );
  });

  it('should emit cancelled when onCancel is called', () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    let cancelEmitted = false;
    component.cancelled.subscribe(() => {
      cancelEmitted = true;
    });

    component['onCancel']();

    expect(cancelEmitted).toBe(true);
  });
});

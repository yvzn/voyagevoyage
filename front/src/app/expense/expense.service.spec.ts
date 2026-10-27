import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExpenseService } from './expense.service';
import { ExpenseCategory, ExpectedExpensesResponse } from './expense.model';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads expected expenses for a trip from the read-only endpoint', () => {
    const expected: ExpectedExpensesResponse = {
      summary: { total: 1, covered: 0, missing: 1 },
      days: [{
        date: '2026-08-25',
        role: 'last',
        slots: [{
          slotId: 'slot-1',
          category: ExpenseCategory.Meal,
          detail: '',
          state: 'missing',
          expenseId: null,
        }],
      }],
    };

    let result: ExpectedExpensesResponse | undefined;
    service.getExpected('trip-1').subscribe((response) => (result = response));

    httpMock.expectOne({
      method: 'GET',
      url: '/api/trips/trip-1/expected-expenses',
    }).flush(expected);

    expect(result).toEqual(expected);
  });
});

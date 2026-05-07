import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, CreateExpenseRequest } from './expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly http = inject(HttpClient);

  getAll(tripId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`/api/trips/${tripId}/expenses`);
  }

  create(tripId: string, request: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`/api/trips/${tripId}/expenses`, request);
  }

  delete(tripId: string, id: string): Observable<void> {
    return this.http.delete<void>(`/api/trips/${tripId}/expenses/${id}`);
  }
}

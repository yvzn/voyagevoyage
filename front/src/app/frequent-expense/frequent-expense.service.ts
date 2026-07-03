import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FrequentExpense, CreateFrequentExpenseRequest, UpdateFrequentExpenseRequest } from './frequent-expense.model';

@Injectable({
  providedIn: 'root'
})
export class FrequentExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/frequent-expenses';

  getFrequentExpenses(): Observable<FrequentExpense[]> {
    return this.http.get<FrequentExpense[]>(this.apiUrl);
  }

  createFrequentExpense(request: CreateFrequentExpenseRequest): Observable<FrequentExpense> {
    return this.http.post<FrequentExpense>(this.apiUrl, request);
  }

  updateFrequentExpense(id: string, request: UpdateFrequentExpenseRequest): Observable<FrequentExpense> {
    return this.http.put<FrequentExpense>(`${this.apiUrl}/${id}`, request);
  }

  deleteFrequentExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

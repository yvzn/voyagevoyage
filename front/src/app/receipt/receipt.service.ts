import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receipt } from './receipt.model';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private readonly http = inject(HttpClient);

  getAllByExpense(expenseId: string): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`/api/expenses/${expenseId}/receipts`);
  }

  getAllByTrip(tripId: string): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`/api/trips/${tripId}/receipts`);
  }

  uploadForExpense(expenseId: string, file: File): Observable<Receipt> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Receipt>(`/api/expenses/${expenseId}/receipts`, formData);
  }

  uploadForTrip(tripId: string, file: File): Observable<Receipt> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Receipt>(`/api/trips/${tripId}/receipts`, formData);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/receipts/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `/api/receipts/${id}/download`;
  }
}

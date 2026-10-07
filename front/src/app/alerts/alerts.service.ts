import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, AlertStatus } from './alert.model';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/alerts';

  getAll(status?: AlertStatus): Observable<Alert[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Alert[]>(this.apiUrl, { params });
  }

  updateStatus(id: string, status: AlertStatus): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}/${id}`, { status });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, AlertStatus } from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);

  getUnresolved(): Observable<Alert[]> {
    return this.http.get<Alert[]>('/api/alerts', { params: { status: 'New' } });
  }

  updateStatus(id: string, status: AlertStatus): Observable<Alert> {
    return this.http.patch<Alert>(`/api/alerts/${id}`, { status });
  }
}

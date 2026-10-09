import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NoTravelDay, NoTravelDayRequest } from './no-travel-day.model';

@Injectable({ providedIn: 'root' })
export class NoTravelDayService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<NoTravelDay[]> {
    return this.http.get<NoTravelDay[]>('/api/no-travel-days');
  }

  create(request: NoTravelDayRequest): Observable<NoTravelDay> {
    return this.http.post<NoTravelDay>('/api/no-travel-days', request);
  }

  update(id: string, request: NoTravelDayRequest): Observable<NoTravelDay> {
    return this.http.put<NoTravelDay>(`/api/no-travel-days/${id}`, request);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`/api/no-travel-days/${id}`);
  }
}

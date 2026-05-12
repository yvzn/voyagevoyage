import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PublicHoliday } from './constraints.model';

@Injectable({
  providedIn: 'root',
})
export class PublicHolidayService {
  private readonly http = inject(HttpClient);

  getForCurrentUser(): Observable<PublicHoliday[]> {
    return this.http.get<PublicHoliday[]>('/api/public-holidays');
  }

  importIcs(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>('/api/public-holidays/import-ics', formData);
  }
}

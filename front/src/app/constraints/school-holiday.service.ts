import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SchoolHoliday } from './constraints.model';

@Injectable({
  providedIn: 'root',
})
export class SchoolHolidayService {
  private readonly http = inject(HttpClient);

  getForCurrentUser(): Observable<SchoolHoliday[]> {
    return this.http.get<SchoolHoliday[]>('/api/school-holidays');
  }

  importIcs(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>('/api/school-holidays/import-ics', formData);
  }
}

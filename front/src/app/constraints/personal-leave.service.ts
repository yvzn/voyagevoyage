import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonalLeave } from './constraints.model';

@Injectable({
  providedIn: 'root',
})
export class PersonalLeaveService {
  private readonly http = inject(HttpClient);

  getForCurrentUser(): Observable<PersonalLeave[]> {
    return this.http.get<PersonalLeave[]>('/api/personal-leaves');
  }

  importIcs(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>('/api/personal-leaves/import-ics', formData);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonalLeave, CreatePersonalLeaveRequest, UpdatePersonalLeaveRequest } from './personal-leave.model';

@Injectable({
  providedIn: 'root',
})
export class PersonalLeaveService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<PersonalLeave[]> {
    return this.http.get<PersonalLeave[]>('/api/personal-leaves');
  }

  create(request: CreatePersonalLeaveRequest): Observable<PersonalLeave> {
    return this.http.post<PersonalLeave>('/api/personal-leaves', request);
  }

  update(id: string, request: UpdatePersonalLeaveRequest): Observable<PersonalLeave> {
    return this.http.put<PersonalLeave>(`/api/personal-leaves/${id}`, request);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`/api/personal-leaves/${id}`);
  }

  importIcs(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>('/api/personal-leaves/import-ics', formData);
  }
}

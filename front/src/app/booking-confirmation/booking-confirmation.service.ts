import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingConfirmation, ParsedBookingConfirmation } from './booking-confirmation.model';

@Injectable({ providedIn: 'root' })
export class BookingConfirmationService {
  private readonly http = inject(HttpClient);

  parse(file: File): Observable<ParsedBookingConfirmation> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParsedBookingConfirmation>('/api/booking-confirmations/parse', formData);
  }

  uploadForTrip(tripId: string, file: File): Observable<BookingConfirmation> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BookingConfirmation>(`/api/trips/${tripId}/booking-confirmations`, formData);
  }

  getAllByTrip(tripId: string): Observable<BookingConfirmation[]> {
    return this.http.get<BookingConfirmation[]>(`/api/trips/${tripId}/booking-confirmations`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/booking-confirmations/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `/api/booking-confirmations/${id}/download`;
  }
}

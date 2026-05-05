import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, CreateTripRequest, UpdateTripRequest } from './trip.model';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Trip[]> {
    return this.http.get<Trip[]>('/api/trips');
  }

  create(request: CreateTripRequest): Observable<Trip> {
    return this.http.post<Trip>('/api/trips', request);
  }

  update(id: string, request: UpdateTripRequest): Observable<Trip> {
    return this.http.put<Trip>(`/api/trips/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/trips/${id}`);
  }
}


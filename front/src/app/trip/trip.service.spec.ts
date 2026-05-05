import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TripService } from './trip.service';
import { Trip, TripStatus, CreateTripRequest, UpdateTripRequest } from './trip.model';

const MOCK_TRIPS: Trip[] = [
  { id: '1', startDate: '2026-04-06', endDate: '2026-04-08', destination: 'Lyon', status: TripStatus.Confirmed },
  { id: '2', startDate: '2026-04-14', endDate: '2026-04-16', destination: 'Bordeaux', status: TripStatus.Planned },
  { id: '3', startDate: '2026-04-22', endDate: '2026-04-23', destination: 'Lille', status: TripStatus.Cancelled },
];

describe('TripService', () => {
  let service: TripService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET /api/trips and return trips', () => {
      let result: Trip[] | undefined;
      service.getAll().subscribe((t) => (result = t));

      httpMock.expectOne('/api/trips').flush(MOCK_TRIPS);

      expect(result).toEqual(MOCK_TRIPS);
    });

    it('should return an empty array when API returns empty list', () => {
      let result: Trip[] | undefined;
      service.getAll().subscribe((t) => (result = t));

      httpMock.expectOne('/api/trips').flush([]);

      expect(result).toEqual([]);
    });

    it('each trip returned from API should have required fields', () => {
      let result: Trip[] | undefined;
      service.getAll().subscribe((t) => (result = t));

      httpMock.expectOne('/api/trips').flush(MOCK_TRIPS);

      for (const trip of result ?? []) {
        expect(trip.id).toBeTruthy();
        expect(trip.destination).toBeTruthy();
        expect(trip.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(trip.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Object.values(TripStatus)).toContain(trip.status);
      }
    });
  });

  describe('create', () => {
    it('should POST to /api/trips and return the new trip', () => {
      const request: CreateTripRequest = {
        destination: 'Paris',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        status: TripStatus.Planned,
      };
      const created: Trip = { id: 'new-1', ...request };

      let result: Trip | undefined;
      service.create(request).subscribe((t) => (result = t));

      httpMock.expectOne({ method: 'POST', url: '/api/trips' }).flush(created);

      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should PUT to /api/trips/:id and return the updated trip', () => {
      const request: UpdateTripRequest = {
        destination: 'Lyon-Updated',
        startDate: '2026-04-06',
        endDate: '2026-04-09',
        status: TripStatus.Confirmed,
      };
      const updated: Trip = { id: '1', ...request };

      let result: Trip | undefined;
      service.update('1', request).subscribe((t) => (result = t));

      httpMock.expectOne({ method: 'PUT', url: '/api/trips/1' }).flush(updated);

      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should DELETE /api/trips/:id', () => {
      let completed = false;
      service.delete('2').subscribe({ complete: () => (completed = true) });

      httpMock.expectOne({ method: 'DELETE', url: '/api/trips/2' }).flush(null);

      expect(completed).toBe(true);
    });
  });
});



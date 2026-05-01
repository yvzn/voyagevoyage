import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TripService } from './trip.service';
import { Trip, TripStatus } from './trip.model';

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
    httpMock.expectOne('/api/trips').flush([]);
    expect(service).toBeTruthy();
  });

  it('should return trips from the API', () => {
    const req = httpMock.expectOne('/api/trips');
    req.flush(MOCK_TRIPS);

    expect(service.trips()).toEqual(MOCK_TRIPS);
  });

  it('should return an empty array when API returns empty list', () => {
    const req = httpMock.expectOne('/api/trips');
    req.flush([]);

    expect(service.trips()).toEqual([]);
  });

  it('should return an empty array on HTTP error', () => {
    const req = httpMock.expectOne('/api/trips');
    req.error(new ProgressEvent('error'));

    expect(service.trips()).toEqual([]);
  });

  it('each trip returned from API should have required fields', () => {
    const req = httpMock.expectOne('/api/trips');
    req.flush(MOCK_TRIPS);

    for (const trip of service.trips()) {
      expect(trip.id).toBeTruthy();
      expect(trip.destination).toBeTruthy();
      expect(trip.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(trip.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Object.values(TripStatus)).toContain(trip.status);
    }
  });
});

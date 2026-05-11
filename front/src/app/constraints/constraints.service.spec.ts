import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConstraintsService } from './constraints.service';
import { TravelConstraints, UpdateTravelConstraintsRequest } from './constraints.model';

const MOCK_CONSTRAINTS: TravelConstraints = {
  allowedDaysOfWeek: [1, 2, 3, 4, 5],
  maxDaysPerMonth: 10,
  considerPublicHolidays: true,
  considerVacationDays: false,
  isStrict: false,
  planningHorizonDays: 90,
};

describe('ConstraintsService', () => {
  let service: ConstraintsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConstraintsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should GET /api/travel-constraints and return constraints', () => {
      let result: TravelConstraints | null | undefined;
      service.get().subscribe((c) => (result = c));

      httpMock.expectOne('/api/travel-constraints').flush(MOCK_CONSTRAINTS);

      expect(result).toEqual(MOCK_CONSTRAINTS);
    });

    it('should return null when API returns 204 No Content', () => {
      let result: TravelConstraints | null | undefined;
      service.get().subscribe((c) => (result = c));

      httpMock
        .expectOne('/api/travel-constraints')
        .flush(null, { status: 204, statusText: 'No Content' });

      expect(result).toBeNull();
    });

    it('should propagate errors for non-204 failures', () => {
      let error: unknown;
      service.get().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne('/api/travel-constraints').error(new ProgressEvent('error'));

      expect(error).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should PUT to /api/travel-constraints and return the updated constraints', () => {
      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
        planningHorizonDays: 60,
      };
      const updated: TravelConstraints = { ...request };

      let result: TravelConstraints | undefined;
      service.update(request).subscribe((c) => (result = c));

      httpMock.expectOne({ method: 'PUT', url: '/api/travel-constraints' }).flush(updated);

      expect(result).toEqual(updated);
    });
  });
});

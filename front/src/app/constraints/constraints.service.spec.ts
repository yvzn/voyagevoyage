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
    httpMock.expectOne('/api/travel-constraints').flush(null, { status: 204, statusText: 'No Content' });
    expect(service).toBeTruthy();
  });

  it('should set constraints signal when API returns constraints', () => {
    httpMock.expectOne('/api/travel-constraints').flush(MOCK_CONSTRAINTS);

    expect(service.constraints()).toEqual(MOCK_CONSTRAINTS);
  });

  it('should keep constraints signal null when API returns 204', () => {
    httpMock.expectOne('/api/travel-constraints').flush(null, { status: 204, statusText: 'No Content' });

    expect(service.constraints()).toBeNull();
  });

  it('should keep constraints signal null on HTTP error', () => {
    httpMock.expectOne('/api/travel-constraints').error(new ProgressEvent('error'));

    expect(service.constraints()).toBeNull();
  });

  describe('update', () => {
    it('should PUT to /api/travel-constraints and update the signal', () => {
      httpMock.expectOne('/api/travel-constraints').flush(null, { status: 204, statusText: 'No Content' });

      const request: UpdateTravelConstraintsRequest = {
        allowedDaysOfWeek: [1, 2, 3, 4, 5],
        maxDaysPerMonth: 8,
        considerPublicHolidays: false,
        considerVacationDays: true,
        isStrict: true,
      };
      const updated: TravelConstraints = { ...request };

      let result: TravelConstraints | undefined;
      service.update(request).subscribe((c) => (result = c));

      httpMock.expectOne({ method: 'PUT', url: '/api/travel-constraints' }).flush(updated);

      expect(result).toEqual(updated);
      expect(service.constraints()).toEqual(updated);
    });
  });
});

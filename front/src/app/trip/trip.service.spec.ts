import { TestBed } from '@angular/core/testing';
import { TripService } from './trip.service';
import { TripStatus } from './trip.model';

describe('TripService', () => {
  let service: TripService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TripService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a list of trips', () => {
    const trips = service.trips();
    expect(trips).toBeTruthy();
    expect(trips.length).toBeGreaterThan(0);
  });

  it('should include trips with all possible statuses', () => {
    const trips = service.trips();
    const statuses = trips.map((t) => t.status);
    expect(statuses).toContain(TripStatus.Planned);
    expect(statuses).toContain(TripStatus.Confirmed);
    expect(statuses).toContain(TripStatus.Cancelled);
  });

  it('each trip should have required fields', () => {
    const trips = service.trips();
    for (const trip of trips) {
      expect(trip.id).toBeTruthy();
      expect(trip.destination).toBeTruthy();
      expect(trip.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(trip.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Object.values(TripStatus)).toContain(trip.status);
    }
  });

  it('each trip should have endDate >= startDate', () => {
    const trips = service.trips();
    for (const trip of trips) {
      expect(trip.endDate >= trip.startDate).toBe(true);
    }
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Alert, AlertStatus, AlertType } from './alert.model';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlertsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads only unresolved alerts when requested', () => {
    const alerts: Alert[] = [{
      id: 'alert-1',
      tripId: 'trip-1',
      tripStartDate: '2026-04-06',
      tripEndDate: '2026-04-08',
      type: AlertType.MissingBooking,
      description: 'No booking',
      status: AlertStatus.New,
    }];
    let result: Alert[] | undefined;

    service.getAll(AlertStatus.New).subscribe(value => result = value);

    httpMock.expectOne(request => request.url === '/api/alerts' && request.params.get('status') === 'new')
      .flush(alerts);

    expect(result).toEqual(alerts);
  });

  it.each([
    [AlertStatus.Handled, 'handled'],
    [AlertStatus.Ignored, 'ignored'],
  ])('updates an alert to %s', (status, expectedStatus) => {
    const alert: Alert = {
      id: 'alert-1',
      tripId: 'trip-1',
      tripStartDate: '2026-04-06',
      tripEndDate: '2026-04-08',
      type: AlertType.MissingBooking,
      description: 'No booking',
      status,
    };
    let result: Alert | undefined;

    service.updateStatus(alert.id, status).subscribe(value => result = value);

    const request = httpMock.expectOne({ method: 'PATCH', url: '/api/alerts/alert-1' });
    expect(request.request.body).toEqual({ status: expectedStatus });
    request.flush(alert);

    expect(result).toEqual(alert);
  });
});

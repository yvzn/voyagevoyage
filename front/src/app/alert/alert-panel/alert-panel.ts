import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { Alert, AlertStatus } from '../alert.model';
import { AlertService } from '../alert.service';
import { TripService } from '../../trip/trip.service';
import { Trip } from '../../trip/trip.model';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './alert-panel.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AlertPanelComponent {
  private readonly alertService = inject(AlertService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);
  protected readonly localeService = inject(LocaleService);

  protected readonly open = signal(false);
  protected readonly alerts = signal<Alert[]>([]);
  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly updatingId = signal<string | null>(null);
  private readonly currentUrl = signal(this.router.url);

  protected readonly activeTripId = computed(() => {
    const match = this.currentUrl().match(/^\/trip\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  protected readonly unresolvedCount = computed(() => this.alerts().length);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd), map(() => this.router.url))
      .subscribe((url) => this.currentUrl.set(url));
    this.load();
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  tripName(tripId: string): string {
    return this.trips().find((trip) => trip.id === tripId)?.destination
      ?? this.alerts().find((alert) => alert.tripId === tripId)?.tripId
      ?? '';
  }

  updateStatus(alert: Alert, status: AlertStatus): void {
    if (this.updatingId()) return;
    this.updatingId.set(alert.id);
    this.alertService.updateStatus(alert.id, status).subscribe({
      next: () => {
        this.alerts.update((alerts) => alerts.filter((item) => item.id !== alert.id));
        this.updatingId.set(null);
      },
      error: () => {
        this.updatingId.set(null);
        this.error.set(true);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.alertService.getUnresolved().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
    this.tripService.getAll().subscribe({
      next: (trips) => this.trips.set(trips),
    });
  }
}

import { Component, HostListener, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { initFlowbite } from 'flowbite';
import { filter, map } from 'rxjs';
import { LocaleService } from './locale.service';
import { Alert, AlertStatus } from './alerts/alert.model';
import { AlertsService } from './alerts/alerts.service';
import { Trip } from './trip/trip.model';
import { TripService } from './trip/trip.service';
import { VoucherService } from './voucher/voucher.service';

const TRAVEL_ROUTES = ['/calendar', '/planning-dashboard', '/train-bookings', '/hotel-bookings', '/vouchers'];
const FISCAL_SUMMARY_ROUTES = ['/expense-summary', '/annual-expense-summary'];
const SETTINGS_ROUTES = ['/constraints', '/personal-leaves', '/frequent-expenses'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly localeService = inject(LocaleService);
  private readonly voucherService = inject(VoucherService);
  protected readonly languageDropdownOpen = signal(false);
  protected readonly drawerId = 'drawer-navigation';
  protected readonly alertsOpen = signal(false);
  protected readonly alertStatus = AlertStatus;
  protected readonly alerts = signal<Alert[]>([]);
  protected readonly trips = signal<Trip[]>([]);
  protected readonly alertsLoading = signal(false);
  protected readonly alertsLoadError = signal(false);
  protected readonly alertUpdatingId = signal<string | null>(null);
  protected readonly alertActionMessage = signal<string | null>(null);

  private readonly router = inject(Router);
  private readonly alertsService = inject(AlertsService);
  private readonly tripService = inject(TripService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly currentTripId = computed(() => {
    const match = this.currentUrl().match(/^\/trip\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  protected readonly alertCount = computed(() => this.alerts().length);

  protected readonly travelMenuOpen = signal(false);
  protected readonly fiscalSummaryMenuOpen = signal(false);
  protected readonly settingsMenuOpen = signal(false);
  protected readonly activeVoucherCount = computed(() => this.voucherService.getActiveVouchers().length);

  protected readonly travelSectionOpen = computed(
    () => this.travelMenuOpen() || TRAVEL_ROUTES.some(route => this.currentUrl().startsWith(route)),
  );
  protected readonly fiscalSummarySectionOpen = computed(
    () => this.fiscalSummaryMenuOpen() || FISCAL_SUMMARY_ROUTES.some(route => this.currentUrl().startsWith(route)),
  );
  protected readonly settingsSectionOpen = computed(
    () => this.settingsMenuOpen() || SETTINGS_ROUTES.some(route => this.currentUrl().startsWith(route)),
  );

  ngOnInit(): void {
    this.localeService.syncDocumentLang();
    initFlowbite();
    this.loadAlerts();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileDrawer());
  }

  protected toggleAlerts(): void {
    this.alertsOpen.update(open => !open);
  }

  protected loadAlerts(): void {
    this.alertsLoading.set(true);
    this.alertsLoadError.set(false);
    this.alertsService.getAll(AlertStatus.New).subscribe({
      next: alerts => {
        this.alerts.set(alerts);
        this.alertsLoading.set(false);
        if (alerts.length > 0) {
          this.tripService.getAll().subscribe({
            next: trips => this.trips.set(trips),
            error: () => this.trips.set([]),
          });
        }
      },
      error: () => {
        this.alertsLoadError.set(true);
        this.alertsLoading.set(false);
      },
    });
  }

  protected updateAlertStatus(alert: Alert, status: AlertStatus.Handled | AlertStatus.Ignored): void {
    if (this.alertUpdatingId()) {
      return;
    }

    this.alertUpdatingId.set(alert.id);
    this.alertActionMessage.set(null);
    this.alertsService.updateStatus(alert.id, status).subscribe({
      next: () => {
        this.alerts.update(alerts => alerts.filter(item => item.id !== alert.id));
        this.alertActionMessage.set(
          status === AlertStatus.Handled ? 'alerts.handledFeedback' : 'alerts.ignoredFeedback',
        );
        this.alertUpdatingId.set(null);
      },
      error: () => {
        this.alertActionMessage.set('alerts.updateError');
        this.alertUpdatingId.set(null);
      },
    });
  }

  protected tripName(alert: Alert): string {
    return this.trips().find(trip => trip.id === alert.tripId)?.destination ?? 'alerts.unknownTrip';
  }

  protected alertDescriptionKey(alert: Alert): string {
    return `alerts.types.${alert.type}`;
  }

  protected formatAlertDate(date: string): string {
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
  }

  protected closeMobileDrawer(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    if (!window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    const flowbiteDrawer = (window as Window & {
      FlowbiteInstances?: { getInstance?: (component: string, id: string) => { hide: () => void } | undefined };
    }).FlowbiteInstances?.getInstance?.('Drawer', this.drawerId);

    if (flowbiteDrawer) {
      flowbiteDrawer.hide();
      return;
    }

    const drawer = document.getElementById(this.drawerId);
    if (drawer) {
      drawer.classList.remove('translate-x-0');
      drawer.classList.add('-translate-x-full');
      drawer.setAttribute('aria-hidden', 'true');
    }

    const backdrop = document.querySelector('[drawer-backdrop]');
    if (backdrop) {
      backdrop.remove();
    }

    document.body.classList.remove('overflow-hidden');
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.languageDropdownOpen.update(v => !v);
  }

  switchLanguage(locale: string): void {
    this.localeService.setLocale(locale);
    this.languageDropdownOpen.set(false);
  }

  toggleTravelMenu(): void {
    this.travelMenuOpen.update(v => !v);
  }

  toggleFiscalSummaryMenu(): void {
    this.fiscalSummaryMenuOpen.update(v => !v);
  }

  toggleSettingsMenu(): void {
    this.settingsMenuOpen.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.languageDropdownOpen()) {
      this.languageDropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.languageDropdownOpen()) {
      this.languageDropdownOpen.set(false);
    }
  }
}

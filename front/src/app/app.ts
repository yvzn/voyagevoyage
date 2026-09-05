import { Component, HostListener, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { initFlowbite } from 'flowbite';
import { filter, map } from 'rxjs';
import { LocaleService } from './locale.service';

const TRAVEL_ROUTES = ['/calendar', '/planning-dashboard', '/train-bookings', '/hotel-bookings'];
const FISCAL_SUMMARY_ROUTES = ['/expense-summary'];
const SETTINGS_ROUTES = ['/constraints', '/personal-leaves', '/frequent-expenses'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly localeService = inject(LocaleService);
  protected readonly languageDropdownOpen = signal(false);

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly travelMenuOpen = signal(false);
  protected readonly fiscalSummaryMenuOpen = signal(false);
  protected readonly settingsMenuOpen = signal(false);

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

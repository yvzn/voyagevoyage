import { Injectable, LOCALE_ID, inject, signal, computed, DOCUMENT } from '@angular/core';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    toggleSidebar: 'Basculer le menu latéral',
    changeLanguage: 'Changer de langue',
    sidenavLabel: 'Menu de navigation',
    calendarNavItem: 'Calendrier',
    calendarHeading: 'Calendrier des voyages',
    calendarNavLabel: 'Navigation du calendrier',
    previousMonthLabel: 'Mois précédent',
    nextMonthLabel: 'Mois suivant',
    monthSelectLabel: 'Mois',
    yearInputLabel: 'Année',
    todayButton: "Aujourd'hui",
    skipToMain: 'Aller au contenu principal',
  },
  en: {
    toggleSidebar: 'Toggle sidebar',
    changeLanguage: 'Change language',
    sidenavLabel: 'Side navigation',
    calendarNavItem: 'Calendar',
    calendarHeading: 'Trip calendar',
    calendarNavLabel: 'Calendar navigation',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    monthSelectLabel: 'Month',
    yearInputLabel: 'Year',
    todayButton: 'Today',
    skipToMain: 'Skip to main content',
  },
};

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly defaultLocale = inject(LOCALE_ID);

  private readonly _currentLocale = signal(this.defaultLocale);

  readonly currentLocale = this._currentLocale.asReadonly();

  readonly displayLanguage = computed(() => {
    const locale = this._currentLocale();
    if (locale.startsWith('fr')) {
      return 'Français';
    }
    return 'English';
  });

  setLocale(locale: string): void {
    this._currentLocale.set(locale);
    this.document.documentElement.lang = locale;
  }

  translate(key: string): string {
    const locale = this._currentLocale();
    const lang = locale.startsWith('fr') ? 'fr' : 'en';
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
  }
}

import { Injectable, LOCALE_ID, inject, signal, computed, DOCUMENT } from '@angular/core';

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
}

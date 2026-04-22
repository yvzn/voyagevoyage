import { Injectable, LOCALE_ID, inject, signal, computed, DOCUMENT, isDevMode } from '@angular/core';

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
    if (isDevMode()) {
      const message =
        'Locale switching only works with localized production builds. In development, use the matching locale serve configuration instead.';
      console.warn(message);
      this.document.defaultView?.alert(message);
      return;
    }

    const knownLocales = ['en', 'fr'];
    const pathname = this.document.location.pathname;
    const pathParts = pathname.split('/').filter(Boolean);
    const routePath = knownLocales.includes(pathParts[0])
      ? pathParts.slice(1).join('/')
      : pathParts.join('/');
    this.document.location.href = `/${locale}/${routePath}`;
  }
}

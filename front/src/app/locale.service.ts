import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly translateService = inject(TranslateService);

  private readonly _currentLocale = signal(
    this.translateService.getCurrentLang() ?? this.translateService.getFallbackLang() ?? 'en'
  );

  readonly currentLocale = this._currentLocale.asReadonly();

  readonly displayLanguage = computed(() => {
    const locale = this._currentLocale();
    if (locale.startsWith('fr')) {
      return 'Français';
    }
    return 'English';
  });

  setLocale(locale: string): void {
    this.translateService.use(locale);
    this._currentLocale.set(locale);
    this.document.documentElement.lang = locale;
  }

  syncDocumentLang(): void {
    this.document.documentElement.lang = this._currentLocale();
  }
}

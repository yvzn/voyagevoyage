import { Component, HostListener, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { initFlowbite } from 'flowbite';
import { LocaleService } from './locale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly localeService = inject(LocaleService);
  protected readonly languageDropdownOpen = signal(false);

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

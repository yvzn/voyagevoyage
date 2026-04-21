import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { LocaleService } from './locale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly localeService = inject(LocaleService);
  protected readonly languageDropdownOpen = signal(false);

  ngOnInit(): void {
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
    this.languageDropdownOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.languageDropdownOpen.set(false);
  }
}

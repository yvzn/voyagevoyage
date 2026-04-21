import { Component, OnInit, inject } from '@angular/core';
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

  ngOnInit(): void {
    initFlowbite();
  }

  switchLanguage(locale: string): void {
    this.localeService.setLocale(locale);
  }
}

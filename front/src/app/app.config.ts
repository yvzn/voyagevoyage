import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        lang: 'en',
      })
    ),
    // provideTranslateHttpLoader must come after forRoot so its TranslateLoader
    // registration overrides the default TranslateNoOpLoader registered by forRoot.
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
  ],
};

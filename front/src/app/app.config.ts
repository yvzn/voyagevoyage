import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { tripsFeature } from './trip/store/trip.reducer';
import { settingsFeature } from './constraints/store/settings.reducer';
import { expensesFeature } from './expense/store/expense.reducer';
import { personalLeaveFeature } from './personal-leave/store/personal-leave.reducer';
import * as tripEffects from './trip/store/trip.effects';
import * as settingsEffects from './constraints/store/settings.effects';
import * as expenseEffects from './expense/store/expense.effects';
import * as personalLeaveEffects from './personal-leave/store/personal-leave.effects';

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
    provideStore({
      [tripsFeature.name]: tripsFeature.reducer,
      [settingsFeature.name]: settingsFeature.reducer,
      [expensesFeature.name]: expensesFeature.reducer,
      [personalLeaveFeature.name]: personalLeaveFeature.reducer,
    }),
    provideEffects(tripEffects, settingsEffects, expenseEffects, personalLeaveEffects),
  ],
};

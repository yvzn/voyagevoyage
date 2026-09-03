import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { FiscalRuleListComponent } from '../fiscal-rule-list/fiscal-rule-list';
import { FiscalRuleActions } from '../store/fiscal-rule.actions';

@Component({
  selector: 'app-fiscal-rule-settings',
  standalone: true,
  imports: [TranslatePipe, FiscalRuleListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './fiscal-rule-settings.html',
})
export class FiscalRuleSettingsComponent {
  private readonly store = inject(Store);

  constructor() {
    this.store.dispatch(FiscalRuleActions.loadFiscalRules());
  }
}

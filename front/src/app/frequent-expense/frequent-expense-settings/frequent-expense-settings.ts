import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { FrequentExpenseListComponent } from '../frequent-expense-list/frequent-expense-list';
import { FrequentExpenseActions } from '../store/frequent-expense.actions';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-frequent-expense-settings',
  standalone: true,
  imports: [TranslatePipe, FrequentExpenseListComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './frequent-expense-settings.html',
})
export class FrequentExpenseSettingsComponent {
  private readonly store = inject(Store);

  constructor() {
    this.store.dispatch(FrequentExpenseActions.loadFrequentExpenses());
  }
}

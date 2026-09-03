import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { FiscalRule, CreateFiscalRuleRequest, UpdateFiscalRuleRequest } from '../fiscal-rule.model';
import { selectAllFiscalRules, selectDeleteStatus, selectLoadStatus } from '../store/fiscal-rule.selectors';
import { FiscalRuleActions } from '../store/fiscal-rule.actions';
import { FiscalRuleFormComponent } from '../fiscal-rule-form/fiscal-rule-form';

@Component({
  selector: 'app-fiscal-rule-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DecimalPipe, DatePipe, FiscalRuleFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './fiscal-rule-list.html',
})
export class FiscalRuleListComponent {
  private readonly store = inject(Store);

  protected readonly fiscalRules = this.store.selectSignal(selectAllFiscalRules);
  protected readonly deleteStatus = this.store.selectSignal(selectDeleteStatus);
  protected readonly loadStatus = this.store.selectSignal(selectLoadStatus);

  protected readonly isFormOpen = signal(false);
  protected readonly selectedRule = signal<FiscalRule | null>(null);
  protected readonly ruleToDelete = signal<FiscalRule | null>(null);

  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  readonly isLoading = computed(() => this.loadStatus() === 'loading');

  protected onEdit(rule: FiscalRule): void {
    this.selectedRule.set(rule);
    this.isFormOpen.set(true);
  }

  onCreate(): void {
    this.selectedRule.set(null);
    this.isFormOpen.set(true);
  }

  protected onFormSaved(request: CreateFiscalRuleRequest | UpdateFiscalRuleRequest): void {
    const selectedRule = this.selectedRule();
    if (selectedRule) {
      this.store.dispatch(FiscalRuleActions.updateFiscalRule({ id: selectedRule.id, request }));
    } else {
      this.store.dispatch(FiscalRuleActions.createFiscalRule({ request }));
    }
    this.isFormOpen.set(false);
    this.selectedRule.set(null);
  }

  protected onFormCancelled(): void {
    this.isFormOpen.set(false);
    this.selectedRule.set(null);
  }

  protected onDeleteClick(rule: FiscalRule): void {
    this.ruleToDelete.set(rule);
  }

  protected onConfirmDelete(): void {
    const rule = this.ruleToDelete();
    if (rule) {
      this.store.dispatch(FiscalRuleActions.deleteFiscalRule({ id: rule.id }));
      this.ruleToDelete.set(null);
    }
  }

  protected onCancelDelete(): void {
    this.ruleToDelete.set(null);
  }
}

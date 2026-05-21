import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { PersonalLeave, LeaveType } from '../personal-leave.model';
import { PersonalLeaveActions } from '../store/personal-leave.actions';
import {
  selectAllPersonalLeaves,
  selectPersonalLeavesLoadStatus,
  selectPersonalLeavesDeleteStatus,
  selectPersonalLeavesImportIcsStatus,
} from '../store/personal-leave.selectors';
import { PersonalLeaveFormComponent } from '../personal-leave-form/personal-leave-form';
import { LocaleService } from '../../locale.service';

@Component({
  selector: 'app-personal-leave-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PersonalLeaveFormComponent],
  templateUrl: './personal-leave-page.html',
})
export class PersonalLeavePageComponent implements OnInit {
  private readonly store = inject(Store);
  protected readonly localeService = inject(LocaleService);

  protected readonly leaves = this.store.selectSignal(selectAllPersonalLeaves);
  protected readonly loadStatus = this.store.selectSignal(selectPersonalLeavesLoadStatus);
  private readonly deleteStatus = this.store.selectSignal(selectPersonalLeavesDeleteStatus);
  private readonly importIcsStatus = this.store.selectSignal(selectPersonalLeavesImportIcsStatus);

  protected readonly isLoading = computed(() => this.loadStatus() === 'loading');
  protected readonly loadErrorKey = computed<string | null>(() =>
    this.loadStatus() === 'failure' ? 'personalLeave.loadError' : null,
  );
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly isImportingIcs = computed(() => this.importIcsStatus() === 'loading');
  protected readonly isIcsImported = computed(() => this.importIcsStatus() === 'success');
  protected readonly icsImportErrorKey = computed<string | null>(() =>
    this.importIcsStatus() === 'failure' ? 'personalLeave.icsImportError' : null,
  );

  /** Whether the leave form modal is open */
  protected readonly isFormOpen = signal(false);

  /** The leave being edited, or null when creating a new leave */
  protected readonly editingLeave = signal<PersonalLeave | null>(null);

  /** ID of the leave pending inline delete confirmation */
  protected readonly pendingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.store.dispatch(PersonalLeaveActions.loadPersonalLeaves());
  }

  retryLoad(): void {
    this.store.dispatch(PersonalLeaveActions.loadPersonalLeaves());
  }

  openCreateForm(): void {
    this.editingLeave.set(null);
    this.isFormOpen.set(true);
  }

  openEditForm(leave: PersonalLeave): void {
    this.editingLeave.set(leave);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingLeave.set(null);
  }

  requestDelete(id: string): void {
    this.pendingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  confirmDelete(id: string): void {
    this.pendingDeleteId.set(null);
    this.store.dispatch(PersonalLeaveActions.deletePersonalLeave({ id }));
  }

  onIcsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.store.dispatch(PersonalLeaveActions.importPersonalLeaveIcs({ file }));

    // Reset the file input so the same file can be re-selected if needed
    input.value = '';
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  protected getLeaveTypeTranslationKey(type: LeaveType): string {
    return `leaveType.${type}`;
  }
}

import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { PersonalLeaveActions } from '../store/personal-leave.actions';
import {
  selectAllPersonalLeaves,
  selectPersonalLeavesLoadStatus,
  selectPersonalLeavesDeleteStatus,
} from '../store/personal-leave.selectors';
import { PersonalLeaveFormComponent } from '../personal-leave-form/personal-leave-form';
import { LocaleService } from '../../locale.service';
import { LeaveType } from '../personal-leave.model';

@Component({
  selector: 'app-personal-leave-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PersonalLeaveFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './personal-leave-detail.html',
})
export class PersonalLeaveDetailComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly localeService = inject(LocaleService);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );
  protected readonly leaveId = this.routeParamId;

  private readonly allLeaves = this.store.selectSignal(selectAllPersonalLeaves);
  private readonly loadStatus = this.store.selectSignal(selectPersonalLeavesLoadStatus);

  protected readonly leave = computed(() =>
    this.allLeaves().find((l) => l.id === this.leaveId()) ?? null,
  );

  /** Whether the edit form modal is open */
  protected readonly isFormOpen = signal(false);

  /** Whether the inline delete confirmation prompt is shown */
  protected readonly showDeleteConfirm = signal(false);

  private readonly deleteStatus = this.store.selectSignal(selectPersonalLeavesDeleteStatus);
  protected readonly isDeleting = computed(() => this.deleteStatus() === 'loading');
  protected readonly deleteError = computed<string | null>(() =>
    this.deleteStatus() === 'failure' ? 'personalLeaveDetail.deleteError' : null,
  );

  /** True while a delete dispatched by this instance is in flight. */
  private deletePending = false;

  constructor() {
    // Load leaves if not yet loaded
    effect(() => {
      const status = this.loadStatus();
      if (status === 'idle') {
        this.store.dispatch(PersonalLeaveActions.loadPersonalLeaves());
      }
    });

    // Navigate back after successful deletion
    effect(() => {
      const ds = this.deleteStatus();
      if (this.deletePending) {
        if (ds === 'success') {
          this.deletePending = false;
          this.router.navigate(['/personal-leaves']);
        } else if (ds === 'failure') {
          this.deletePending = false;
        }
      }
    });
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

  protected openEditForm(): void {
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected onDelete(): void {
    const leave = this.leave();
    if (!leave || this.isDeleting()) return;

    this.showDeleteConfirm.set(false);
    this.deletePending = true;
    this.store.dispatch(PersonalLeaveActions.deletePersonalLeave({ id: leave.id }));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CreateVoucherRequest, UpdateVoucherRequest, Voucher, VoucherCategory } from './voucher.model';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/vouchers';

  readonly vouchers = signal<Voucher[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.http.get<Voucher[]>(this.apiUrl).subscribe({
      next: (vouchers) => {
        this.vouchers.set(vouchers);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  getActiveVouchers(category?: VoucherCategory): Voucher[] {
    return this.vouchers().filter((voucher) => {
      if (voucher.status !== 'active' || isVoucherExpired(voucher)) {
        return false;
      }
      return category === undefined || voucher.category === category;
    });
  }

  getActiveVoucherCount(category: VoucherCategory): number {
    return this.getActiveVouchers(category).length;
  }

  hasActiveVoucher(category: VoucherCategory): boolean {
    return this.getActiveVoucherCount(category) > 0;
  }

  addVoucher(request: CreateVoucherRequest): Observable<Voucher> {
    return this.http.post<Voucher>(this.apiUrl, request).pipe(
      tap((created) => this.vouchers.update((vouchers) => [...vouchers, created])),
    );
  }

  updateVoucher(id: string, request: UpdateVoucherRequest): Observable<Voucher> {
    return this.http.put<Voucher>(`${this.apiUrl}/${id}`, request).pipe(
      tap((updated) => this.replaceVoucher(updated)),
    );
  }

  markVoucherAsUsed(id: string): Observable<Voucher> {
    return this.http.post<Voucher>(`${this.apiUrl}/${id}/use`, null).pipe(
      tap((updated) => this.replaceVoucher(updated)),
    );
  }

  deleteVoucher(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.vouchers.update((vouchers) => vouchers.filter((voucher) => voucher.id !== id))),
    );
  }

  private replaceVoucher(updated: Voucher): void {
    this.vouchers.update((vouchers) => vouchers.map((voucher) => (voucher.id === updated.id ? updated : voucher)));
  }
}

export function isVoucherExpired(voucher: Pick<Voucher, 'expirationDate' | 'status'>): boolean {
  if (!voucher.expirationDate || voucher.status === 'used') {
    return false;
  }

  const todayKey = toIsoDateKey(new Date());
  return voucher.expirationDate < todayKey;
}

export function getVoucherStatusLabelKey(voucher: Pick<Voucher, 'status' | 'expirationDate'>): string {
  if (voucher.status === 'used') {
    return 'voucher.status.used';
  }
  return isVoucherExpired(voucher) ? 'voucher.status.expired' : 'voucher.status.active';
}

export function getVoucherCategoryLabelKey(category: VoucherCategory): string {
  return `voucher.category.${category}`;
}

function toIsoDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

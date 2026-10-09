import { Injectable, signal } from '@angular/core';
import { CreateVoucherRequest, UpdateVoucherRequest, Voucher, VoucherCategory, VoucherStatus } from './voucher.model';

const VOUCHER_STORAGE_KEY = 'voyage-voyage-vouchers-v1';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  readonly vouchers = signal<Voucher[]>(this.loadVouchers());

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

  addVoucher(request: CreateVoucherRequest): Voucher {
    const voucher: Voucher = {
      id: createVoucherId(),
      code: request.code.trim(),
      category: request.category,
      description: request.description.trim(),
      expirationDate: request.expirationDate || null,
      status: 'active',
    };

    const next = [...this.vouchers(), voucher];
    this.persistVouchers(next);
    return voucher;
  }

  updateVoucher(id: string, request: UpdateVoucherRequest): Voucher | null {
    const existing = this.vouchers().find((voucher) => voucher.id === id);
    if (!existing) {
      return null;
    }

    const updated: Voucher = {
      ...existing,
      code: request.code.trim(),
      category: request.category,
      description: request.description.trim(),
      expirationDate: request.expirationDate || null,
    };

    const next = this.vouchers().map((voucher) => (voucher.id === id ? updated : voucher));
    this.persistVouchers(next);
    return updated;
  }

  markVoucherAsUsed(id: string): Voucher | null {
    const voucher = this.vouchers().find((item) => item.id === id);
    if (!voucher) {
      return null;
    }

    const updated: Voucher = { ...voucher, status: 'used' };
    const next = this.vouchers().map((item) => (item.id === id ? updated : item));
    this.persistVouchers(next);
    return updated;
  }

  deleteVoucher(id: string): void {
    const next = this.vouchers().filter((voucher) => voucher.id !== id);
    this.persistVouchers(next);
  }

  private persistVouchers(vouchers: Voucher[]): void {
    this.vouchers.set(vouchers);
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(vouchers));
  }

  private loadVouchers(): Voucher[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(VOUCHER_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as Voucher[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((voucher): voucher is Voucher => {
        if (!voucher || typeof voucher.id !== 'string' || typeof voucher.code !== 'string') {
          return false;
        }
        return Object.values(VoucherCategory).includes(voucher.category as VoucherCategory)
          && (voucher.status === 'active' || voucher.status === 'used');
      });
    } catch {
      return [];
    }
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

function createVoucherId(): string {
  return `voucher-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

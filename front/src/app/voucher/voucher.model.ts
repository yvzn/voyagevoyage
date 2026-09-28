export enum VoucherCategory {
  Train = 'train',
  Hotel = 'hotel',
}

export type VoucherStatus = 'active' | 'used';

export interface Voucher {
  id: string;
  code: string;
  category: VoucherCategory;
  description: string;
  expirationDate: string | null; // ISO date YYYY-MM-DD
  status: VoucherStatus;
}

export interface CreateVoucherRequest {
  code: string;
  category: VoucherCategory;
  description: string;
  expirationDate: string | null;
}

export interface UpdateVoucherRequest {
  code: string;
  category: VoucherCategory;
  description: string;
  expirationDate: string | null;
}

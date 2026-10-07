import { TestBed } from '@angular/core/testing';
import { VoucherCategory } from './voucher.model';
import { VoucherService } from './voucher.service';

describe('VoucherService', () => {
  let service: VoucherService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoucherService);
  });

  it('counts only active, non-expired vouchers for a category', () => {
    service.addVoucher({ code: 'TRAIN10', category: VoucherCategory.Train, description: 'Train offer', expirationDate: '2099-12-31' });
    service.addVoucher({ code: 'HOTEL15', category: VoucherCategory.Hotel, description: 'Hotel offer', expirationDate: '2020-01-01' });
    service.addVoucher({ code: 'TRAIN20', category: VoucherCategory.Train, description: 'Used train offer', expirationDate: '2099-12-31' });
    service.markVoucherAsUsed(service.vouchers().at(-1)!.id);

    expect(service.getActiveVoucherCount(VoucherCategory.Train)).toBe(1);
    expect(service.getActiveVoucherCount(VoucherCategory.Hotel)).toBe(0);
    expect(service.hasActiveVoucher(VoucherCategory.Train)).toBe(true);
  });

  it('treats expiration as computed, not stored status', () => {
    const voucher = service.addVoucher({ code: 'TRAIN30', category: VoucherCategory.Train, description: 'Soon expired', expirationDate: '2000-01-01' });
    expect(service.getActiveVouchers(VoucherCategory.Train)).toEqual([]);
    expect(service.vouchers().find((entry) => entry.id === voucher.id)?.status).toBe('active');
  });
});

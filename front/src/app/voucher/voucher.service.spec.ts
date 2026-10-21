import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Voucher, VoucherCategory } from './voucher.model';
import { VoucherService } from './voucher.service';

const voucher = (overrides: Partial<Voucher>): Voucher => ({
  id: 'v-1',
  code: 'CODE',
  category: VoucherCategory.Train,
  description: '',
  expirationDate: null,
  status: 'active',
  ...overrides,
});

describe('VoucherService', () => {
  let service: VoucherService;
  let http: HttpTestingController;

  const create = () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(VoucherService);
  };

  const init = (initial: Voucher[] = []) => {
    create();
    http.expectOne('/api/vouchers').flush(initial);
  };

  afterEach(() => http.verify());

  it('loads vouchers from the API', () => {
    init([voucher({ id: 'a' })]);
    expect(service.vouchers().map((v) => v.id)).toEqual(['a']);
    expect(service.loadError()).toBe(false);
  });

  it('flags a load error', () => {
    create();
    http.expectOne('/api/vouchers').flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.loadError()).toBe(true);
  });

  it('counts only active, non-expired vouchers for a category', () => {
    init([
      voucher({ id: '1', category: VoucherCategory.Train, expirationDate: '2099-12-31' }),
      voucher({ id: '2', category: VoucherCategory.Hotel, expirationDate: '2020-01-01' }),
      voucher({ id: '3', category: VoucherCategory.Train, status: 'used' }),
    ]);

    expect(service.getActiveVoucherCount(VoucherCategory.Train)).toBe(1);
    expect(service.getActiveVoucherCount(VoucherCategory.Hotel)).toBe(0);
    expect(service.hasActiveVoucher(VoucherCategory.Train)).toBe(true);
  });

  it('persists a new voucher through the API', () => {
    init();
    const request = { code: 'NEW', category: VoucherCategory.Hotel, description: '', expirationDate: null };

    service.addVoucher(request).subscribe();
    const req = http.expectOne('/api/vouchers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(voucher({ id: 'new', code: 'NEW', category: VoucherCategory.Hotel }));

    expect(service.vouchers().map((v) => v.id)).toEqual(['new']);
  });

  it('does not change local state when saving fails', () => {
    init();
    let failed = false;
    service.addVoucher({ code: 'X', category: VoucherCategory.Train, description: '', expirationDate: null })
      .subscribe({ error: () => (failed = true) });
    http.expectOne('/api/vouchers').flush(null, { status: 500, statusText: 'Server Error' });

    expect(failed).toBe(true);
    expect(service.vouchers()).toEqual([]);
  });

  it('updates, marks as used and deletes through the API', () => {
    init([voucher({ id: 'a', code: 'OLD' })]);

    service.updateVoucher('a', { code: 'NEW', category: VoucherCategory.Train, description: '', expirationDate: null }).subscribe();
    const put = http.expectOne('/api/vouchers/a');
    expect(put.request.method).toBe('PUT');
    put.flush(voucher({ id: 'a', code: 'NEW' }));
    expect(service.vouchers()[0].code).toBe('NEW');

    service.markVoucherAsUsed('a').subscribe();
    const use = http.expectOne('/api/vouchers/a/use');
    expect(use.request.method).toBe('POST');
    use.flush(voucher({ id: 'a', code: 'NEW', status: 'used' }));
    expect(service.vouchers()[0].status).toBe('used');

    service.deleteVoucher('a').subscribe();
    const del = http.expectOne('/api/vouchers/a');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    expect(service.vouchers()).toEqual([]);
  });
});

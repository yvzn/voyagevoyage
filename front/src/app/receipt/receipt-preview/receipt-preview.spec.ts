import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReceiptPreviewComponent } from './receipt-preview';
import { ReceiptService } from '../receipt.service';
import { of } from 'rxjs';

describe('ReceiptPreviewComponent', () => {
  let component: ReceiptPreviewComponent;
  let fixture: ComponentFixture<ReceiptPreviewComponent>;
  let receiptService: jasmine.SpyObj<ReceiptService>;

  const mockReceipt = {
    id: 'test-id',
    fileName: 'test-receipt.pdf',
    contentType: 'application/pdf'
  };

  const mockImageReceipt = {
    id: 'image-id',
    fileName: 'test-image.jpg',
    contentType: 'image/jpeg'
  };

  beforeEach(async () => {
    const receiptServiceSpy = jasmine.createSpyObj('ReceiptService', ['getPreviewUrl']);
    receiptServiceSpy.getPreviewUrl.and.returnValue('/api/receipts/test-id/preview');

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ReceiptPreviewComponent],
      providers: [
        { provide: ReceiptService, useValue: receiptServiceSpy },
        TranslateService
      ]
    }).compileComponents();

    receiptService = TestBed.inject(ReceiptService) as jasmine.SpyObj<ReceiptService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptPreviewComponent);
    component = fixture.componentInstance;
    component.receipt.set(mockReceipt);
    component.isOpen.set(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect PDF content type', () => {
    component.receipt.set(mockReceipt);
    expect(component.isPdf()).toBe(true);
    expect(component.isImage()).toBe(false);
  });

  it('should detect image content type', () => {
    component.receipt.set(mockImageReceipt);
    expect(component.isPdf()).toBe(false);
    expect(component.isImage()).toBe(true);
  });

  it('should return preview URL', () => {
    const previewUrl = component.previewUrl();
    expect(previewUrl).toBe('/api/receipts/test-id/preview');
    expect(receiptService.getPreviewUrl).toHaveBeenCalledWith('test-id');
  });

  it('should truncate long file names', () => {
    const longFileName = 'very-long-file-name-that-should-be-truncated-because-it-exceeds-the-maximum-length.pdf';
    const receipt = { id: 'test', fileName: longFileName, contentType: 'application/pdf' };
    component.receipt.set(receipt);
    
    const displayName = component.getDisplayFileName(longFileName);
    expect(displayName.length).toBeLessThanOrEqual(50);
    expect(displayName.endsWith('...')).toBe(true);
  });

  it('should not truncate short file names', () => {
    const shortFileName = 'short.pdf';
    const displayName = component.getDisplayFileName(shortFileName);
    expect(displayName).toBe(shortFileName);
  });

  it('should emit closed event when close button is clicked', fakeAsync(() => {
    spyOn(component.closed, 'emit');
    
    // Find and click the close button
    const closeButton = fixture.nativeElement.querySelector('button[aria-label*="Close"]');
    expect(closeButton).toBeTruthy();
    
    closeButton.click();
    tick();
    
    expect(component.closed.emit).toHaveBeenCalled();
  }));

  it('should handle image error gracefully', () => {
    spyOn(console, 'error'); // Prevent console error from showing in test output
    
    component.receipt.set(mockImageReceipt);
    component.onImageError();
    
    // Should not throw any errors
    expect(component.onImageError).toBeDefined();
  });
});
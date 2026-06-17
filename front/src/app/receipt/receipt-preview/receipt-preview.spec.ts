import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReceiptPreviewComponent } from './receipt-preview';
import { ReceiptService } from '../receipt.service';
import { vi } from 'vitest';

describe('ReceiptPreviewComponent', () => {
  beforeEach(async () => {
    const receiptServiceSpy = {
      getPreviewUrl: vi.fn().mockReturnValue('/api/receipts/test-id/preview'),
      getDownloadUrl: vi.fn().mockReturnValue('/api/receipts/test-id/download')
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: ReceiptService, useValue: receiptServiceSpy },
        TranslateService
      ]
    }).compileComponents();
  });

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

  it('should create', () => {
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should detect PDF content type', () => {
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('receipt', mockReceipt);
    fixture.detectChanges();
    
    expect(component['isPdf']()).toBe(true);
    expect(component['isImage']()).toBe(false);
  });

  it('should detect image content type', () => {
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('receipt', mockImageReceipt);
    fixture.detectChanges();
    
    expect(component['isPdf']()).toBe(false);
    expect(component['isImage']()).toBe(true);
  });

  it('should return preview URL', () => {
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    const receiptService = TestBed.inject(ReceiptService);
    
    fixture.componentRef.setInput('receipt', mockReceipt);
    fixture.detectChanges();
    
    const previewUrl = component['previewUrl']();
    // previewUrl is now a SafeResourceUrl object - just verify it's truthy and the service was called
    expect(previewUrl).toBeTruthy();
    expect(receiptService.getPreviewUrl).toHaveBeenCalledWith('test-id');
  });

  it('should truncate long file names', () => {
    const longFileName = 'very-long-file-name-that-should-be-truncated-because-it-exceeds-the-maximum-length.pdf';
    const receipt = { id: 'test', fileName: longFileName, contentType: 'application/pdf' };
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    
    fixture.componentRef.setInput('receipt', receipt);
    fixture.detectChanges();
    
    const displayName = component['getDisplayFileName'](longFileName);
    expect(displayName.length).toBeLessThanOrEqual(50);
    expect(displayName.endsWith('...')).toBe(true);
  });

  it('should not truncate short file names', () => {
    const shortFileName = 'short.pdf';
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    
    const displayName = component['getDisplayFileName'](shortFileName);
    expect(displayName).toBe(shortFileName);
  });

  it('should emit closed event when close button is clicked', () => {
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    
    fixture.componentRef.setInput('receipt', mockReceipt);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    
    const emitSpy = vi.spyOn(component['closed'], 'emit');
    
    // Find and click the close button
    const closeButton = fixture.nativeElement.querySelector('button[aria-label*="Close"]');
    expect(closeButton).toBeTruthy();
    
    closeButton.click();
    
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should handle image error gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const fixture = TestBed.createComponent(ReceiptPreviewComponent);
    const component = fixture.componentInstance;
    
    fixture.componentRef.setInput('receipt', mockImageReceipt);
    fixture.detectChanges();
    
    component['onImageError']();
    
    // Should not throw any errors
    expect(component['onImageError']).toBeDefined();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
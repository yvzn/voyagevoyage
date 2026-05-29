export type ReceiptLinkedEntityType = 'expense' | 'trip';

export interface Receipt {
  id: string;
  linkedEntityType: ReceiptLinkedEntityType;
  linkedEntityId: string;
  fileName: string;
  contentType: string;
  uploadedAt: string; // ISO 8601 timestamp
}

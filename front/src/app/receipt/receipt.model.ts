export type ReceiptLinkedEntityType = 'expense';

export interface Receipt {
  id: string;
  linkedEntityType: ReceiptLinkedEntityType;
  linkedEntityId: string;
  fileName: string;
  contentType: string;
  uploadedAt: string; // ISO 8601 timestamp
}

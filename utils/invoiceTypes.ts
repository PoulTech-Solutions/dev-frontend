export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  invoiceDate: string;
  items: InvoiceItem[];
  /** Defaults to ₹ on HTML / Rs. on PDF (Helvetica). */
  currency?: string;
}

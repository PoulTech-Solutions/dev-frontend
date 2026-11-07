import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { InvoiceRecord } from "../services/invoiceStorage";
import type { InvoiceData } from "./invoiceTypes";
import { createInvoiceHtml } from "./invoiceHtml";
import { loadInvoiceLogo } from "./invoiceLogo";

export type { InvoiceData, InvoiceItem } from "./invoiceTypes";

export async function generateInvoicePdf(data: InvoiceData): Promise<string> {
  const directory = FileSystem.documentDirectory;
  if (!directory) throw new Error("Invoice storage is unavailable on this device.");

  const logoDataUri = await loadInvoiceLogo();
  const { uri: temporaryUri } = await Print.printToFileAsync({
    html: createInvoiceHtml(data, logoDataUri),
  });
  const invoiceDirectory = `${directory}invoices/`;
  await FileSystem.makeDirectoryAsync(invoiceDirectory, { intermediates: true });

  const destination = `${invoiceDirectory}${data.invoiceNumber}.pdf`;
  const existing = await FileSystem.getInfoAsync(destination);
  if (existing.exists) await FileSystem.deleteAsync(destination);
  await FileSystem.copyAsync({ from: temporaryUri, to: destination });
  return destination;
}

export async function openInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  if (!invoice.pdfUri) throw new Error("The saved invoice PDF could not be found.");
  await Linking.openURL(invoice.pdfUri);
}

export async function shareInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  if (!invoice.pdfUri) throw new Error("The saved invoice PDF could not be found.");
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("PDF sharing is not available on this device.");
  }
  await Sharing.shareAsync(invoice.pdfUri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: `Invoice ${invoice.invoiceNumber}`,
  });
}

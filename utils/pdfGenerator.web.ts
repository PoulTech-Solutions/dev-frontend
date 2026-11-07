import { jsPDF } from "jspdf";
import type { InvoiceRecord } from "../services/invoiceStorage";
import type { InvoiceData } from "./invoiceTypes";
import { loadInvoiceLogo } from "./invoiceLogo";

export type { InvoiceData, InvoiceItem } from "./invoiceTypes";

function createPdf(data: InvoiceData, logoDataUri: string) {
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = 18;
  const right = pageWidth - 18;
  const currency = data.currency ?? "INR";
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  pdf.setFillColor(20, 83, 45);
  pdf.rect(0, 0, pageWidth, 7, "F");
  pdf.addImage(logoDataUri, "PNG", left, 12, 16, 16);
  pdf.setTextColor(11, 42, 91);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Poultech Solutions", left + 21, 20);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Farm & Marketplace", left + 21, 25);
  pdf.setTextColor(23, 32, 51);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(data.sellerName, left, 36);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  if (data.sellerPhone) pdf.text(data.sellerPhone, left, 41);
  if (data.sellerEmail) pdf.text(data.sellerEmail, left, 45);

  pdf.setTextColor(20, 83, 45);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.text("INVOICE", right, 24, { align: "right" });
  pdf.setTextColor(71, 85, 105);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(data.invoiceNumber, right, 31, { align: "right" });
  pdf.text(`Date: ${data.invoiceDate}`, right, 37, { align: "right" });
  pdf.setDrawColor(20, 83, 45);
  pdf.setLineWidth(0.7);
  pdf.line(left, 54, right, 54);

  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("BILL FROM", left, 65);
  pdf.text("BILL TO", pageWidth / 2, 65);
  pdf.setTextColor(23, 32, 51);
  pdf.setFontSize(11);
  pdf.text(data.sellerName, left, 72);
  pdf.text(data.customerName, pageWidth / 2, 72);

  const tableTop = 88;
  const columns = [left, left + 10, left + 101, left + 124, left + 155, right];
  pdf.setFillColor(241, 245, 249);
  pdf.rect(left, tableTop, right - left, 10, "F");
  pdf.setTextColor(51, 65, 85);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("#", columns[1], tableTop + 6.5, { align: "center" });
  pdf.text("DESCRIPTION", columns[1] + 8, tableTop + 6.5);
  pdf.text("QTY", columns[3], tableTop + 6.5, { align: "right" });
  pdf.text("UNIT PRICE", columns[4], tableTop + 6.5, { align: "right" });
  pdf.text("AMOUNT", columns[5], tableTop + 6.5, { align: "right" });

  let rowY = tableTop + 10;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  data.items.forEach((item, index) => {
    const descriptionLines = pdf.splitTextToSize(item.description, 85) as string[];
    const rowHeight = Math.max(12, descriptionLines.length * 4.5 + 6);
    pdf.setTextColor(23, 32, 51);
    pdf.text(String(index + 1), columns[1], rowY + 7, { align: "center" });
    pdf.text(descriptionLines, columns[1] + 8, rowY + 7);
    pdf.text(String(item.quantity), columns[3], rowY + 7, { align: "right" });
    pdf.text(`${currency} ${item.unitPrice.toFixed(2)}`, columns[4], rowY + 7, { align: "right" });
    pdf.text(
      `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`,
      columns[5],
      rowY + 7,
      { align: "right" },
    );
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.25);
    pdf.line(left, rowY + rowHeight, right, rowY + rowHeight);
    rowY += rowHeight;
  });

  const totalTop = rowY + 12;
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(10);
  pdf.text("Subtotal", right - 64, totalTop);
  pdf.text(`${currency} ${total.toFixed(2)}`, right, totalTop, { align: "right" });
  pdf.setDrawColor(20, 83, 45);
  pdf.setLineWidth(0.6);
  pdf.line(right - 78, totalTop + 5, right, totalTop + 5);
  pdf.setTextColor(20, 83, 45);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("TOTAL DUE", right - 64, totalTop + 13);
  pdf.text(`${currency} ${total.toFixed(2)}`, right, totalTop + 13, { align: "right" });

  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Thank you for your business.", pageWidth / 2, 275, { align: "center" });
  return pdf;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<string> {
  const logoDataUri = await loadInvoiceLogo();
  return createPdf(data, logoDataUri).output("datauristring");
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, encoded] = dataUri.split(",");
  if (!header || !encoded) throw new Error("The generated invoice PDF is invalid.");
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "application/pdf";
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function openInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  if (!invoice.pdfUri) throw new Error("The saved invoice PDF could not be found.");
  const preview = window.open("about:blank", "_blank");
  if (!preview) throw new Error("Allow pop-ups to open the invoice PDF.");
  const objectUrl = URL.createObjectURL(dataUriToBlob(invoice.pdfUri));
  preview.location.href = objectUrl;
}

export async function shareInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  if (!invoice.pdfUri) throw new Error("The saved invoice PDF could not be found.");
  const blob = dataUriToBlob(invoice.pdfUri);
  const file = new File([blob], `${invoice.invoiceNumber}.pdf`, {
    type: "application/pdf",
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `Invoice ${invoice.invoiceNumber}` });
    return;
  }

  const url = URL.createObjectURL(blob);
  const download = document.createElement("a");
  download.href = url;
  download.download = `${invoice.invoiceNumber}.pdf`;
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

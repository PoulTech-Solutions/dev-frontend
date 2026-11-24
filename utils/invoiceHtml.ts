import type { InvoiceData } from "./invoiceTypes";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function createInvoiceHtml(data: InvoiceData, logoDataUri: string): string {
  const currency = escapeHtml(data.currency ?? "₹");
  const money = (value: number) => `${currency}${value.toFixed(2)}`;
  const rows = data.items
    .map(
      (item, index) => `<tr>
        <td class="number">${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="number">${item.quantity}</td>
        <td class="amount">${money(item.unitPrice)}</td>
        <td class="amount">${money(item.quantity * item.unitPrice)}</td>
      </tr>`,
    )
    .join("");
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const sellerContact = [data.sellerPhone, data.sellerEmail]
    .filter((value): value is string => Boolean(value))
    .map(escapeHtml)
    .join(" · ");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 40px; color: #172033; font: 14px Arial, sans-serif; position: relative; }
          .invoice { max-width: 780px; margin: 0 auto; position: relative; z-index: 1; }
          .watermark {
            position: fixed;
            top: 46%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            opacity: 0.12;
            pointer-events: none;
            z-index: 0;
          }
          .watermark img {
            width: 96px;
            height: 96px;
            object-fit: contain;
            border-radius: 14px;
          }
          .watermark .wm-name {
            color: #0b2a5b;
            font-size: 18px;
            font-weight: 700;
          }
          .watermark .wm-tag {
            color: #64748b;
            font-size: 11px;
            font-weight: 500;
          }
          .top { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 3px solid #14532d; }
          .brand-row { display: flex; align-items: center; gap: 14px; }
          .brand-logo { width: 58px; height: 58px; object-fit: contain; border-radius: 10px; }
          .brand { color: #0b2a5b; font-size: 23px; font-weight: 700; }
          .muted { color: #64748b; line-height: 1.6; }
          .invoice-label { color: #14532d; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
          .meta { margin-top: 24px; display: flex; justify-content: space-between; gap: 30px; }
          .meta h2 { margin: 0 0 8px; color: #64748b; font-size: 11px; letter-spacing: .8px; text-transform: uppercase; }
          .meta strong { display: block; margin-bottom: 5px; font-size: 15px; }
          table { width: 100%; margin-top: 34px; border-collapse: collapse; }
          th { padding: 12px 10px; background: #f1f5f9; color: #334155; font-size: 11px; text-align: left; text-transform: uppercase; }
          td { padding: 14px 10px; border-bottom: 1px solid #e2e8f0; line-height: 1.45; }
          .number { text-align: center; }
          .amount { text-align: right; white-space: nowrap; }
          .totals { width: 280px; margin: 22px 0 0 auto; }
          .totals div { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand { margin-top: 7px; padding-top: 14px !important; border-top: 2px solid #14532d; color: #14532d; font-size: 18px; font-weight: 700; }
          .thanks { margin-top: 58px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="watermark" aria-hidden="true">
          <img src="${logoDataUri}" alt="" />
          <div class="wm-name">Poultech Solutions</div>
          <div class="wm-tag">Farm &amp; Marketplace</div>
        </div>
        <main class="invoice">
          <header class="top">
            <div>
              <div class="brand-row">
                <img class="brand-logo" src="${logoDataUri}" alt="Poultech Solutions logo" />
                <div>
                  <div class="brand">Poultech Solutions</div>
                  <div class="muted">Farm &amp; Marketplace</div>
                </div>
              </div>
              <div class="muted" style="margin-top:8px;font-weight:700;color:#334155">${escapeHtml(data.sellerName)}</div>
              ${sellerContact ? `<div class="muted">${sellerContact}</div>` : ""}
            </div>
            <div style="text-align:right">
              <div class="invoice-label">INVOICE</div>
              <div class="muted">${escapeHtml(data.invoiceNumber)}</div>
              <div class="muted">Date: ${escapeHtml(data.invoiceDate)}</div>
            </div>
          </header>
          <section class="meta">
            <div><h2>Bill From</h2><strong>${escapeHtml(data.sellerName)}</strong>${sellerContact ? `<span class="muted">${sellerContact}</span>` : ""}</div>
            <div><h2>Bill To</h2><strong>${escapeHtml(data.customerName)}</strong></div>
          </section>
          <table>
            <thead><tr><th class="number">#</th><th>Description</th><th class="number">Qty</th><th class="amount">Unit price</th><th class="amount">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <section class="totals">
            <div><span>Subtotal</span><strong>${money(total)}</strong></div>
            <div class="grand"><span>Total due</span><span>${money(total)}</span></div>
          </section>
          <footer class="thanks">
            Thank you for your business.<br />
            <span style="font-size:11px">Official Farm Mitra invoice · Verify with Poultech Solutions · Do not alter this PDF</span>
          </footer>
        </main>
      </body>
    </html>`;
}

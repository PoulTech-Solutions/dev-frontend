import { jsPDF } from "jspdf";
import { sortRecords } from "./farmRecordCalc";
import { LAYER_PHASES, resolvePhase } from "./farmRecordPhases";
import {
  SHEET_COLORS,
  columnsForSheet,
  displayCell,
  formatMetaCell,
  phaseBannerTitle,
  phaseMetaItems,
  weekFromDayNumber,
  type SheetColumn,
} from "./farmRecordSheet";
import type { ShedDailyRecord, ShedFlockBook } from "./farmRecordTypes";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export async function generateFarmRecordPdf(input: {
  farmName: string;
  shedName: string;
  place?: string;
  book: ShedFlockBook;
}): Promise<string> {
  const pdf = new jsPDF({ format: "a4", unit: "mm", orientation: "landscape" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 8;
  const right = pageWidth - 8;
  const usable = right - left;
  let y = 8;

  const records = sortRecords(input.book.dailyRecords);
  const farmTitle = (input.farmName || "Farm Record").toUpperCase();

  const newPage = () => {
    pdf.addPage();
    y = 8;
  };

  const ensure = (needed: number) => {
    if (y + needed > pageHeight - 8) newPage();
  };

  // Top meta line
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  const latest = records[records.length - 1];
  const latestPhase = latest ? resolvePhase(latest.dayNumber) : null;
  const topLine = [
    `Shed: ${input.shedName}`,
    `Proprietor: ${input.book.proprietor || "—"}`,
    `Hatch: ${input.book.hatchDate || "—"}`,
    `Chicks: ${input.book.chicksReceived || 0}`,
    `Hen housed: ${input.book.henHoused || 0}`,
    latestPhase ? `Current: ${phaseBannerTitle(latestPhase)} (Week ${weekFromDayNumber(latest.dayNumber)})` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");
  pdf.text(topLine, left, y);
  y += 6;

  let wroteAny = false;

  LAYER_PHASES.forEach((phase) => {
    const phaseRecords = records.filter((record) => resolvePhase(record.dayNumber).id === phase.id);
    if (!phaseRecords.length && records.length > 0) return;
    wroteAny = true;

    const cols = columnsForSheet(phase.sheet);
    const totalUnits = cols.reduce((sum, col) => sum + col.width, 0);
    const colWidths = cols.map((col) => (col.width / totalUnits) * usable);
    const rowH = 5.2;
    const headerH = 6;

    const drawTableHeader = () => {
      let x = left;
      cols.forEach((col, index) => {
        const w = colWidths[index];
        const [r, g, b] = hexToRgb(SHEET_COLORS.headerBg);
        pdf.setFillColor(r, g, b);
        pdf.setDrawColor(...hexToRgb(SHEET_COLORS.grid));
        pdf.setLineWidth(0.25);
        pdf.rect(x, y, w, headerH, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...hexToRgb(SHEET_COLORS.headerText));
        const label = pdf.splitTextToSize(col.label, w - 1.5) as string[];
        pdf.text(label[0] ?? "", x + w / 2, y + 3.8, { align: "center" });
        x += w;
      });
      y += headerH;
    };

    const drawBannerAndMeta = () => {
      ensure(22);
      const bannerH = 8;
      const farmW = usable * 0.55;
      const phaseW = usable - farmW;

      pdf.setFillColor(...hexToRgb(SHEET_COLORS.farmBlue));
      pdf.setDrawColor(...hexToRgb(SHEET_COLORS.grid));
      pdf.setLineWidth(0.4);
      pdf.rect(left, y, farmW, bannerH, "FD");
      pdf.setTextColor(...hexToRgb(SHEET_COLORS.farmBlueText));
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(farmTitle, left + 2, y + 5.2);

      pdf.setFillColor(...hexToRgb(SHEET_COLORS.phaseYellow));
      pdf.rect(left + farmW, y, phaseW, bannerH, "FD");
      pdf.setTextColor(...hexToRgb(SHEET_COLORS.phaseYellowText));
      pdf.setFontSize(8.5);
      const phaseTitle = phaseBannerTitle(phase);
      pdf.text(phaseTitle, left + farmW + phaseW / 2, y + 5.2, { align: "center" });
      y += bannerH;

      const meta = phaseMetaItems(phase, input.book, phaseRecords);
      const metaH = 7;
      const metaW = usable / Math.max(meta.length, 1);
      meta.forEach((item, index) => {
        const x = left + index * metaW;
        pdf.setFillColor(...hexToRgb(SHEET_COLORS.metaBlue));
        pdf.setDrawColor(...hexToRgb(SHEET_COLORS.grid));
        pdf.setLineWidth(0.35);
        pdf.rect(x, y, metaW, metaH, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...hexToRgb(SHEET_COLORS.metaText));
        const label = pdf.splitTextToSize(formatMetaCell(item), metaW - 2) as string[];
        pdf.text(label[0] ?? "", x + 1.2, y + 4.5);
      });
      y += metaH;
    };

    drawBannerAndMeta();
    drawTableHeader();

    const drawDataRow = (record: ShedDailyRecord, index: number) => {
      ensure(rowH + 1);
      // Re-draw header if we just page-broke near top without banner context
      if (y <= 10) {
        drawBannerAndMeta();
        drawTableHeader();
      }

      const bg = index % 2 === 0 ? SHEET_COLORS.rowA : SHEET_COLORS.rowB;
      let x = left;
      cols.forEach((col: SheetColumn, colIndex) => {
        const w = colWidths[colIndex];
        pdf.setFillColor(...hexToRgb(bg));
        pdf.setDrawColor(...hexToRgb(SHEET_COLORS.grid));
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, w, rowH, "FD");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.2);
        pdf.setTextColor(...hexToRgb(SHEET_COLORS.ink));
        const text = pdf.splitTextToSize(displayCell(record, col.key), w - 1.2) as string[];
        const tx =
          col.align === "right" ? x + w - 0.8 : col.align === "center" ? x + w / 2 : x + 0.8;
        const align = col.align === "left" ? "left" : col.align;
        pdf.text(text[0] ?? "", tx, y + 3.5, { align });
        x += w;
      });
      y += rowH;
    };

    if (!phaseRecords.length) {
      ensure(rowH);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text("No daily records in this phase yet.", left + 2, y + 4);
      y += 8;
    } else {
      phaseRecords.forEach((record, index) => drawDataRow(record, index));
    }
    y += 5;
  });

  if (!wroteAny) {
    pdf.setFontSize(10);
    pdf.text("No daily records yet.", left, y + 4);
  }

  return pdf.output("datauristring");
}

export async function shareFarmRecordPdf(uri: string, _title: string): Promise<void> {
  const link = document.createElement("a");
  link.href = uri;
  link.download = "farm-mitra-shed-record.pdf";
  link.click();
}

export async function shareFarmRecordOnWhatsApp(uri: string, message: string): Promise<void> {
  await shareFarmRecordPdf(uri, "Farm Mitra record");
  const encoded = encodeURIComponent(`${message}\n\nPDF downloaded — attach it in WhatsApp.`);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

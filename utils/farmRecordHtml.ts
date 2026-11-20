import { sortRecords } from "./farmRecordCalc";
import { LAYER_PHASES, resolvePhase } from "./farmRecordPhases";
import {
  columnsForSheet,
  displayCell,
  formatMetaCell,
  phaseBannerTitle,
  phaseMetaItems,
  weekFromDayNumber,
  type SheetColKey,
} from "./farmRecordSheet";
import type { ShedDailyRecord, ShedFlockBook } from "./farmRecordTypes";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Middle title row: Hatch Date / Hen-Housed / Proprietor — gridded cells. */
function metaTitleRow(items: { label: string; value: string }[]): string {
  const cells = items
    .map((item) => `<td class="meta-cell">${escapeHtml(formatMetaCell(item))}</td>`)
    .join("");
  return `<table class="meta-table"><tr>${cells}</tr></table>`;
}

function phaseTable(phaseId: string, records: ShedDailyRecord[], sheet: "growing" | "laying"): string {
  const cols = columnsForSheet(sheet);
  const headers = cols.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("");
  const body =
    records
      .map((record, index) => {
        const rowClass = index % 2 === 0 ? "row-a" : "row-b";
        const cells = cols
          .map((col) => {
            const align = col.align === "left" ? "left" : col.align;
            return `<td class="c-${align}">${escapeHtml(displayCell(record, col.key as SheetColKey))}</td>`;
          })
          .join("");
        return `<tr class="${rowClass}">${cells}</tr>`;
      })
      .join("") ||
    `<tr><td colspan="${cols.length}">No daily records in this phase yet.</td></tr>`;

  return `<table class="sheet-table">
    <thead><tr>${headers}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function createFarmRecordHtml(input: {
  farmName: string;
  shedName: string;
  place?: string;
  book: ShedFlockBook;
}): string {
  const records = sortRecords(input.book.dailyRecords);
  const farmTitle = escapeHtml((input.farmName || "Farm Record").toUpperCase());

  const sections = LAYER_PHASES.map((phase) => {
    const phaseRecords = records.filter((record) => resolvePhase(record.dayNumber).id === phase.id);
    if (!phaseRecords.length && records.length > 0) return "";

    const banner = escapeHtml(phaseBannerTitle(phase));
    const meta = phaseMetaItems(phase, input.book, phaseRecords);
    const table = phaseTable(phase.id, phaseRecords, phase.sheet);

    return `<section class="phase">
      <div class="banner">
        <div class="banner-farm">${farmTitle}</div>
        <div class="banner-phase">${banner}</div>
      </div>
      ${metaTitleRow(meta)}
      ${table}
    </section>`;
  })
    .filter(Boolean)
    .join("");

  const latest = records[records.length - 1];
  const latestPhase = latest ? resolvePhase(latest.dayNumber) : null;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0F172A; padding: 6px; margin: 0; }
    .top { margin-bottom: 10px; font-size: 10px; color: #334155; }
    .top strong { color: #0F172A; }
    .phase { margin-bottom: 14px; page-break-inside: avoid; }
    .banner { display: flex; width: 100%; border: 1.5px solid #0F172A; }
    .banner-farm {
      flex: 1.1;
      background: #1D4ED8;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.3px;
      padding: 7px 10px;
      border-right: 1.5px solid #0F172A;
      text-transform: uppercase;
    }
    .banner-phase {
      flex: 1;
      background: #FACC15;
      color: #0F172A;
      font-weight: 700;
      font-size: 12px;
      padding: 7px 10px;
      text-align: center;
    }
    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border-left: 1.5px solid #0F172A;
      border-right: 1.5px solid #0F172A;
      border-bottom: 1.5px solid #0F172A;
    }
    table.meta-table td.meta-cell {
      background: #93C5FD;
      color: #0F172A;
      font-weight: 700;
      font-size: 9px;
      border: 1px solid #0F172A;
      padding: 6px 8px;
      vertical-align: middle;
    }
    table.sheet-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8px;
      border: 1.5px solid #0F172A;
    }
    table.sheet-table th,
    table.sheet-table td {
      border: 1px solid #0F172A;
      padding: 3px 4px;
      vertical-align: middle;
      word-wrap: break-word;
    }
    table.sheet-table th {
      background: #2563EB;
      color: #FFFFFF;
      font-weight: 700;
      text-align: center;
    }
    table.sheet-table td.c-right { text-align: right; }
    table.sheet-table td.c-center { text-align: center; }
    table.sheet-table td.c-left { text-align: left; }
    tr.row-a td { background: #FFEDD5; }
    tr.row-b td { background: #EFF6FF; }
    .footer { margin-top: 8px; font-size: 8px; color: #64748B; }
  </style>
</head>
<body>
  <div class="top">
    <strong>Shed:</strong> ${escapeHtml(input.shedName)}
    &nbsp;·&nbsp; <strong>Proprietor:</strong> ${escapeHtml(input.book.proprietor || "—")}
    &nbsp;·&nbsp; <strong>Hatch:</strong> ${escapeHtml(input.book.hatchDate || "—")}
    &nbsp;·&nbsp; <strong>Chicks:</strong> ${input.book.chicksReceived || 0}
    &nbsp;·&nbsp; <strong>Hen housed:</strong> ${input.book.henHoused || 0}
    ${
      latestPhase
        ? `&nbsp;·&nbsp; <strong>Current:</strong> ${escapeHtml(phaseBannerTitle(latestPhase))} (Week ${weekFromDayNumber(latest!.dayNumber)})`
        : ""
    }
  </div>
  ${sections || "<p>No daily records yet.</p>"}
  <div class="footer">Poultech Farm Mitra · Farm Record Book layout · Feed/bird &amp; lay % auto-calculated · ${records.length} daily rows</div>
</body>
</html>`;
}

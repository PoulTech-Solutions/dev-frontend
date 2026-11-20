/** Display format: YYYY/MM/DD — auto-inserts `/` while typing. Storage: YYYY-MM-DD. */

export function digitsOnlyDate(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Mask typed digits as `2026` → `2026/` → `2026/11/` → `2026/11/20`. */
export function formatDateTyping(raw: string): string {
  const digits = digitsOnlyDate(raw);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`;
}

export function isoToSlashDate(iso: string): string {
  const trimmed = iso.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10).replace(/-/g, "/");
  return formatDateTyping(trimmed);
}

export function slashDateToIso(display: string): string | null {
  const digits = digitsOnlyDate(display);
  if (digits.length !== 8) return null;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) return null;
  return `${year}-${month}-${day}`;
}

export function isCompleteSlashDate(display: string): boolean {
  return slashDateToIso(display) != null;
}

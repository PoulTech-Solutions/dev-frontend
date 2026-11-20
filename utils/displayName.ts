/** Prefer a readable first name in tight nav; fall back to full name. */
export function firstName(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function fullName(name?: string | null): string {
  return (name ?? "").trim();
}

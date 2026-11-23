/** Split a display name into API first/last that pass backend name rules (letters, not "-"). */
export function splitPersonName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first_name = parts[0] ?? "User";
  const last_name = parts.slice(1).join(" ") || first_name;
  return { first_name, last_name };
}